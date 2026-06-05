import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { createAppServer } from '../server/index'
import { getCommandExecutable, checkCommandCode, commandCodeStatus, listModels } from '../core/cli'
import { ptyDoctorAsync } from '../core/ptyDoctor'
import { exec } from 'node:child_process'
import os from 'node:os'

function usage(): void {
  console.log([
    'ccgui — Command Code GUI bridge',
    '',
    'Usage: ccgui <command>',
    '',
    'Commands:',
    '  serve [--port <n>] [--dir <path>] [--open]  Start local server with web UI',
    '  doctor                                      Check environment readiness',
    '  open [--port <n>]                           Open browser to local server',
    ''
  ].join('\n'))
}

function defaultStaticDir(): string {
  const cwdOut = resolve('out/renderer')
  if (existsSync(cwdOut)) return cwdOut
  return path.resolve(__dirname, '../renderer')
}

function openUrl(url: string): void {
  const platform = process.platform
  const cmd = platform === 'darwin'
    ? `open "${url}"`
    : platform === 'win32'
      ? `start "" "${url}"`
      : `xdg-open "${url}"`

  exec(cmd)
}

async function startServe(port: number, staticDir?: string, shouldOpen = false): Promise<void> {
  const resolvedDir = staticDir ? resolve(staticDir) : defaultStaticDir()

  if (resolvedDir && !existsSync(resolvedDir)) {
    console.error(`Static directory not found: ${resolvedDir}`)
    console.error('Run `npm run build` first, or use --dir to point to out/renderer/')
    process.exit(1)
  }

  const app = createAppServer(port, '127.0.0.1', { staticDir: resolvedDir })
  try {
    await app.start()
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`)
      console.error(`Try: ccgui serve --port ${port + 1}`)
      process.exit(1)
    }
    throw err
  }

  if (resolvedDir) {
    console.log(`Serving web UI from: ${resolvedDir}`)
  }
  console.log(`API token: ${app.token}`)
  console.log(`Server URL: ${app.url}`)
  console.log(`Browser URL: ${app.authUrl}`)

  if (shouldOpen) {
    openUrl(app.authUrl)
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down...')
    await app.stop()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

async function runDoctor(): Promise<void> {
  let exitCode = 0
  const passed: string[] = []
  const failed: string[] = []

  // Node.js check
  const nodeVersion = process.version
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]!, 10)
  console.log(`Node.js:    ${nodeVersion}`)
  if (nodeMajor >= 20) {
    passed.push('Node.js version')
  } else {
    failed.push('Node.js version (need >=20)')
    exitCode = 1
  }

  // Platform check
  const platform = os.platform()
  const isWin = platform === 'win32'
  console.log(`Platform:   ${platform} (${os.release()})`)

  // Command Code binary
  const binary = getCommandExecutable()
  console.log(`Binary:     ${binary}`)
  const check = await checkCommandCode(binary)
  const version = check.ok ? `v${check.version ?? 'unknown'}` : 'not found'

  if (check.ok) {
    console.log(`  Result:   ${version}`)
    passed.push('Command Code binary')
  } else {
    console.log(`  Result:   FAILED (${check.stderr || check.error || 'unknown error'})`)
    failed.push('Command Code binary')
    exitCode = 1
  }

  // Auth status
  if (check.ok) {
    const status = await commandCodeStatus(binary, process.cwd())
    if (status.ok) {
      console.log('Auth:       ok')
      passed.push('Authentication')
    } else {
      console.log(`Auth:       not authenticated (${status.stderr || status.error || 'unknown'})`)
      failed.push('Authentication')
    }
  }

  // Models
  if (check.ok) {
    try {
      const models = await listModels(binary, process.cwd())
      if (models.ok && models.models.length > 0) {
        console.log(`Models:     ${models.models.length} available (${models.models.slice(0, 3).join(', ')}${models.models.length > 3 ? '...' : ''})`)
        passed.push('Model listing')
      } else {
        console.log('Models:     listing failed')
        failed.push('Model listing')
      }
    } catch {
      console.log('Models:     listing failed')
      failed.push('Model listing')
    }
  }

  // Windows hints
  if (isWin) {
    console.log('\nWindows notes:')
    console.log('  - The `cmd` binary may collide with cmd.exe. Set COMMAND_CODE_BIN to the full shim path.')
    console.log('  - WSL is recommended for the best experience on Windows.')
    console.log('  - Native Windows support is experimental.')
    console.log('  - If running in WSL, run ccgui from inside the Linux environment.')
  }

  // PTY health
  console.log('\nPTY check:')
  const ptyResult = await ptyDoctorAsync()
  if (ptyResult.available) {
    console.log(`  Available: yes`)
    console.log(`  Shell:     ${ptyResult.shell}`)
    if (ptyResult.healthy) {
      console.log(`  Health:    ok`)
      passed.push('PTY availability')
    } else {
      console.log(`  Health:    FAILED — ${ptyResult.error || `exit=${ptyResult.exitCode} signal=${ptyResult.signal}`}`)
      failed.push('PTY health')
    }
  } else {
    console.log(`  Available: no`)
    console.log(`  Error:     ${ptyResult.error}`)
    failed.push('PTY availability')
  }

  // Summary
  console.log(`\n${passed.length} passed, ${failed.length} failed`)

  if (failed.length > 0) {
    console.log(`\nFailed checks: ${failed.join(', ')}`)
  }

  process.exit(exitCode)
}

async function openBrowser(port: number): Promise<void> {
  const url = `http://127.0.0.1:${port}`
  console.log(`Opening: ${url} (append ?token=<token> from server output)`)
  openUrl(url)
}

// Main
const args = process.argv.slice(2)
const command = args[0]

if (!command || command === 'help' || command === '--help' || command === '-h') {
  usage()
  process.exit(0)
}

const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(name)
  return idx !== -1 ? args[idx + 1] : undefined
}

const portArg = getArg('--port')
const port = portArg ? parseInt(portArg, 10) : 5173

if (isNaN(port) || port < 1 || port > 65535) {
  console.error('Invalid port number')
  process.exit(1)
}

switch (command) {
  case 'serve':
    startServe(port, getArg('--dir'), args.includes('--open'))
    break

  case 'doctor':
    runDoctor()
    break

  case 'open':
    openBrowser(port)
    break

  default:
    console.error(`Unknown command: ${command}`)
    usage()
    process.exit(1)
}

import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { createAppServer } from '../server/index'
import { getCommandExecutable } from '../core/cli'
import { runDoctorChecks } from '../core/doctor'
import { exec } from 'node:child_process'

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

async function runDoctor(json = false): Promise<void> {
  const result = await runDoctorChecks()
  if (json) {
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.ok ? 0 : 1)
  }

  console.log(`Node.js:    ${result.nodeVersion}`)
  console.log(`Platform:   ${result.platform} (${result.platformRelease})`)
  console.log(`Binary:     ${result.commandExecutable}`)
  for (const check of result.checks) {
    if (check.id === 'node' || check.id === 'platform' || check.id === 'windows') continue
    const status = check.status === 'pass' ? check.detail : `FAILED (${check.detail})`
    console.log(`${check.label.padEnd(18)} ${status}`)
    if (check.nextStep && check.status !== 'pass') console.log(`  Next: ${check.nextStep}`)
  }
  console.log(`\n${result.passed.length} passed, ${result.failed.length} failed`)
  if (result.failed.length > 0) console.log(`\nFailed checks: ${result.failed.join(', ')}`)
  process.exit(result.ok ? 0 : 1)
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
    runDoctor(args.includes('--json'))
    break

  case 'open':
    openBrowser(port)
    break

  default:
    console.error(`Unknown command: ${command}`)
    usage()
    process.exit(1)
}

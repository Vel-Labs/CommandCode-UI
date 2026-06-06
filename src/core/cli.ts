import { spawn } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type {
  CommandCodeCheck,
  CommandCodeStatus,
  CommandCodeUpdateResult,
  HeadlessRunOptions,
  HeadlessRunResult,
  ModelListResult,
  PermissionMode
} from './types'

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000
const MAX_OUTPUT_BYTES = 1_048_576 // 1MB

function cappedAppend(current: string, chunk: string, maxBytes: number): string {
  const next = current + chunk
  if (next.length <= maxBytes) return next
  if (current.length >= maxBytes) return current
  return current + chunk.slice(0, maxBytes - current.length)
}

export function getCommandExecutable(input?: string): string {
  return input?.trim() || process.env.COMMAND_CODE_BIN || 'cmd'
}

export function normalizeCwd(input?: string): string {
  const candidate = input?.trim() ? input : os.homedir()
  const resolved = path.resolve(candidate)

  if (!existsSync(resolved)) {
    throw new Error(`Project directory does not exist: ${resolved}`)
  }
  if (!statSync(resolved).isDirectory()) {
    throw new Error(`Project path is not a directory: ${resolved}`)
  }

  return resolved
}

export function buildCommonArgs(options: {
  model?: string
  permissionMode?: PermissionMode
  trust?: boolean
  skipOnboarding?: boolean
  addDirs?: string[]
}): string[] {
  const args: string[] = []

  if (options.model?.trim()) {
    args.push('--model', options.model.trim())
  }

  if (options.permissionMode && options.permissionMode !== 'standard') {
    args.push('--permission-mode', options.permissionMode)
  }

  if (options.trust) {
    args.push('--trust')
  }

  if (options.skipOnboarding) {
    args.push('--skip-onboarding')
  }

  for (const dir of options.addDirs ?? []) {
    if (dir.trim()) {
      args.push('--add-dir', path.resolve(dir.trim()))
    }
  }

  return args
}

export function buildInteractiveArgs(options: {
  initialPrompt?: string
  resume?: string
  continueLast?: boolean
  model?: string
  permissionMode?: PermissionMode
  trust?: boolean
  skipOnboarding?: boolean
  addDirs?: string[]
}): string[] {
  const args: string[] = []
  if (options.continueLast) {
    args.push('--continue')
  } else if (options.resume?.trim()) {
    args.push('--resume', options.resume.trim())
  }

  if (options.initialPrompt?.trim()) {
    args.push(options.initialPrompt.trim())
  }
  args.push(...buildCommonArgs(options))
  return args
}

export function buildHeadlessArgs(options: HeadlessRunOptions): string[] {
  const args = ['--print']

  if (options.prompt.trim()) {
    args.push(options.prompt.trim())
  }

  if (options.maxTurns && Number.isFinite(options.maxTurns)) {
    args.push('--max-turns', String(Math.max(1, Math.floor(options.maxTurns))))
  }

  if (options.yolo) {
    args.push('--yolo')
  }

  const permissionMode: PermissionMode | undefined = options.plan ? 'plan' : options.permissionMode
  args.push(
    ...buildCommonArgs({
      model: options.model,
      permissionMode,
      trust: options.trust,
      skipOnboarding: options.skipOnboarding,
      addDirs: options.addDirs
    })
  )

  return args
}

export function runProcess(command: string, args: string[], cwd: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<HeadlessRunResult> {
  const startedAt = Date.now()

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        FORCE_COLOR: '0',
        NO_COLOR: process.env.NO_COLOR ?? '1'
      },
      shell: false,
      windowsHide: true
    })

    let stdout = ''
    let stderr = ''
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => {
        if (!child.killed) child.kill('SIGKILL')
      }, 2_000).unref()
    }, timeoutMs)

    child.stdout?.on('data', (data: Buffer) => {
      stdout = cappedAppend(stdout, data.toString('utf8'), MAX_OUTPUT_BYTES)
    })

    child.stderr?.on('data', (data: Buffer) => {
      stderr = cappedAppend(stderr, data.toString('utf8'), MAX_OUTPUT_BYTES)
    })

    child.on('error', (error) => {
      clearTimeout(timer)
      resolve({
        command,
        args,
        cwd,
        exitCode: 1,
        signal: null,
        stdout,
        stderr: `${stderr}${stderr ? '\n' : ''}${error.message}`,
        timedOut,
        durationMs: Date.now() - startedAt
      })
    })

    child.on('close', (exitCode, signal) => {
      clearTimeout(timer)
      resolve({
        command,
        args,
        cwd,
        exitCode,
        signal,
        stdout,
        stderr,
        timedOut,
        durationMs: Date.now() - startedAt
      })
    })
  })
}

export async function checkCommandCode(commandExecutable?: string): Promise<CommandCodeCheck> {
  const command = getCommandExecutable(commandExecutable)
  const cwd = os.homedir()
  const result = await runProcess(command, ['--version'], cwd, 30_000)

  return {
    ok: result.exitCode === 0,
    command,
    version: result.stdout.trim().split(/\s+/).at(-1),
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.exitCode === 0 ? undefined : `Command exited with ${result.exitCode}`
  }
}

export async function commandCodeStatus(commandExecutable?: string, cwdInput?: string): Promise<CommandCodeStatus> {
  const command = getCommandExecutable(commandExecutable)
  const cwd = normalizeCwd(cwdInput)
  const result = await runProcess(command, ['status', '--json'], cwd, 30_000)

  let parsed: unknown | undefined
  try {
    parsed = result.stdout.trim() ? JSON.parse(result.stdout) : undefined
  } catch {
    parsed = undefined
  }

  return {
    ok: result.exitCode === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    parsed,
    error: result.exitCode === 0 ? undefined : `Command exited with ${result.exitCode}`
  }
}

export async function commandCodeUpdate(commandExecutable?: string, cwdInput?: string, checkOnly = true): Promise<CommandCodeUpdateResult> {
  const command = getCommandExecutable(commandExecutable)
  const cwd = normalizeCwd(cwdInput)
  const args = checkOnly ? ['update', '--check-only'] : ['update']
  const result = await runProcess(command, args, cwd, 120_000)
  const output = `${result.stdout}\n${result.stderr}`
  const upToDate = /up to date/i.test(output)
  const updateAvailable = /update available|new version|out of date/i.test(output) && !upToDate
  const version = output.match(/(\d+\.\d+\.\d+(?:[-\w.]*)?)/)?.[1]

  return {
    ok: result.exitCode === 0,
    command,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    checkOnly,
    upToDate,
    updateAvailable,
    version,
    error: result.exitCode === 0 ? undefined : `Command exited with ${result.exitCode}`
  }
}

export async function listModels(commandExecutable?: string, cwdInput?: string): Promise<ModelListResult> {
  const command = getCommandExecutable(commandExecutable)
  const cwd = normalizeCwd(cwdInput)
  const result = await runProcess(command, ['--list-models'], cwd, 60_000)

  const models = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().includes('model'))

  return {
    ok: result.exitCode === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    models,
    error: result.exitCode === 0 ? undefined : `Command exited with ${result.exitCode}`
  }
}

export async function runHeadless(options: HeadlessRunOptions): Promise<HeadlessRunResult> {
  const command = getCommandExecutable(options.commandExecutable)
  const cwd = normalizeCwd(options.cwd)
  const args = buildHeadlessArgs(options)
  return runProcess(command, args, cwd, options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
}

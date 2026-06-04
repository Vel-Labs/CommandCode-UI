export type PermissionMode = 'standard' | 'plan' | 'auto-accept'

export type CommandCodeCheck = {
  ok: boolean
  command: string
  version?: string
  stdout: string
  stderr: string
  error?: string
}

export type CommandCodeStatus = {
  ok: boolean
  stdout: string
  stderr: string
  parsed?: unknown
  error?: string
}

export type SessionStartOptions = {
  cwd: string
  commandExecutable?: string
  initialPrompt?: string
  model?: string
  permissionMode?: PermissionMode
  trust?: boolean
  skipOnboarding?: boolean
  addDirs?: string[]
  cols?: number
  rows?: number
  useMock?: boolean
}

export type SessionStartResult = {
  id: string
  command: string
  args: string[]
  cwd: string
  mock: boolean
  transcriptPath: string
}

export type HeadlessRunOptions = {
  cwd: string
  commandExecutable?: string
  prompt: string
  model?: string
  permissionMode?: PermissionMode
  maxTurns?: number
  yolo?: boolean
  trust?: boolean
  plan?: boolean
  skipOnboarding?: boolean
  addDirs?: string[]
  timeoutMs?: number
}

export type HeadlessRunResult = {
  command: string
  args: string[]
  cwd: string
  exitCode: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
  timedOut: boolean
  durationMs: number
}

export type ModelListResult = {
  ok: boolean
  stdout: string
  stderr: string
  models: string[]
  error?: string
}

export type DirectoryPickResult = {
  canceled: boolean
  path?: string
}

export type SessionExitPayload = {
  sessionId: string
  exitCode: number | null
  signal: number | string | null
}

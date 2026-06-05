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
  useMock?: boolean
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

export type FileEntry = {
  name: string
  path: string
  isDirectory: boolean
  size?: number
}

export type IdeStatusResult = {
  ok: boolean
  stdout: string
  stderr: string
  lines: string[]
  error?: string
}

export type CliExecResult = {
  ok: boolean
  stdout: string
  stderr: string
  exitCode: number | null
  error?: string
}

export type DiscoveredSession = {
  id: string
  timestamp: string
  transcriptPath: string
  sizeBytes: number
  cwd?: string
  model?: string
}

export type UsageSummary = {
  totalTokens: number
  totalCost: number
  totalRuns: number
  raw: string
  parsed: boolean
}

export type TastePackage = {
  path: string
  name: string
  categories: TasteCategory[]
}

export type TasteCategory = {
  name: string
  confidence: number
  learnings: string[]
}

export type AgentConfig = {
  path: string
  name: string
  rawContent: string
  systemPrompt?: string
  description?: string
}

export type McpServer = {
  name: string
  status: string
  toolCount?: number
  raw: string
}

export type SkillEntry = {
  path: string
  name: string
  content: string
  description?: string
}

export type MemoryFile = {
  path: string
  content: string
  name: string
}

export type WriteFileResult = {
  ok: boolean
  error?: string
}

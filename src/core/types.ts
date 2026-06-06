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

export type CommandCodeUpdateResult = {
  ok: boolean
  command: string
  stdout: string
  stderr: string
  exitCode: number | null
  checkOnly: boolean
  upToDate: boolean
  updateAvailable: boolean
  version?: string
  error?: string
}

export type GitEnvironmentStatus = {
  ok: boolean
  cwd: string
  root?: string
  branch?: string
  ahead?: number
  behind?: number
  filesChanged: number
  insertions: number
  deletions: number
  added: number
  modified: number
  deleted: number
  untracked: number
  files: Array<{ path: string; status: string }>
  raw: string
  error?: string
}

export type ProjectGuiPreferences = {
  version: 1
  projectPath?: string
  model?: string
  runtimeMode?: 'mock' | 'real-session'
  permissionMode?: PermissionMode
  trust?: boolean
  skipOnboarding?: boolean
  headlessMaxTurns?: number
  headlessYolo?: boolean
  appearanceTheme?: 'cc-spectrum' | 'terminal-minimal' | 'blueprint' | 'high-contrast'
  updatedAt?: string
}

export type ProjectGuiPreferencesResult = {
  ok: boolean
  path?: string
  preferences?: ProjectGuiPreferences
  error?: string
}

export type AppGuiPreferences = {
  version: 1
  cwd?: string
  recentProjects?: string[]
  commandExecutable?: string
  model?: string
  projectModels?: Record<string, string>
  appearanceTheme?: 'cc-spectrum' | 'terminal-minimal' | 'blueprint' | 'high-contrast'
  startupProjectBehavior?: 'restore-last' | 'empty'
  releaseNotesSeen?: string[]
  sidebarWidth?: number
  rightInspectorWidth?: number
  updatedAt?: string
}

export type AppGuiPreferencesResult = {
  ok: boolean
  path?: string
  preferences?: AppGuiPreferences
  error?: string
}

export type SessionStartOptions = {
  cwd: string
  terminalMode?: 'command-code' | 'shell'
  commandExecutable?: string
  initialPrompt?: string
  resume?: string
  continueLast?: boolean
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
  model?: string
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
  title?: string
  cwd?: string
  model?: string
  source?: 'global' | 'project'
}

export type ProjectCommandCodeFile = {
  name: string
  path: string
  sizeBytes: number
  updatedAt: string
}

export type ProjectCommandCodeSection = {
  key: 'commands' | 'skills' | 'taste' | 'memory' | 'preferences' | 'sessions'
  label: string
  description: string
  path: string
  exists: boolean
  files: ProjectCommandCodeFile[]
}

export type ProjectCommandCodeReference = {
  projectPath: string
  projectCommandCodePath: string
  userProjectContextPath: string
  sections: ProjectCommandCodeSection[]
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

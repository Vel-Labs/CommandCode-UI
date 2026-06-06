import type {
  AgentConfig,
  AppGuiPreferences,
  AppGuiPreferencesResult,
  CliExecResult,
  CommandCodeCheck,
  CommandCodeStatus,
  CommandCodeUpdateResult,
  DirectoryPickResult,
  DiscoveredSession,
  FileEntry,
  GitEnvironmentStatus,
  HeadlessRunOptions,
  HeadlessRunResult,
  IdeStatusResult,
  McpServer,
  MemoryFile,
  ModelListResult,
  ProjectGuiPreferences,
  ProjectGuiPreferencesResult,
  ProjectCommandCodeReference,
  SessionExitPayload,
  SessionStartOptions,
  SessionStartResult,
  SkillEntry,
  TastePackage,
  UsageSummary,
  WriteFileResult,
} from './types'
import type { PtyDoctorResult } from './ptyDoctor'
import type { HookConfigDiscoveryResult, HookConfigToggleApplyResult, HookConfigTogglePreviewResult, HookEvent, HookScope } from './hooksConfig'

export type SessionDataSource = 'live' | 'replay'
export type SessionDataCallback = (data: string, metadata: { source: SessionDataSource }) => void
export type SessionExitCallback = (payload: SessionExitPayload) => void
export type Unsubscribe = () => void

export type TransportAPI = {
  chooseDirectory: () => Promise<DirectoryPickResult>
  check: (commandExecutable?: string) => Promise<CommandCodeCheck>
  status: (commandExecutable?: string, cwd?: string) => Promise<CommandCodeStatus>
  update: (commandExecutable?: string, cwd?: string, checkOnly?: boolean) => Promise<CommandCodeUpdateResult>
  loadAppPreferences: () => Promise<AppGuiPreferencesResult>
  saveAppPreferences: (preferences: AppGuiPreferences) => Promise<AppGuiPreferencesResult>
  loadProjectPreferences: (cwd: string) => Promise<ProjectGuiPreferencesResult>
  saveProjectPreferences: (cwd: string, preferences: ProjectGuiPreferences) => Promise<ProjectGuiPreferencesResult>
  ptyHealth: () => Promise<PtyDoctorResult>
  listModels: (commandExecutable?: string, cwd?: string) => Promise<ModelListResult>
  startSession: (options: SessionStartOptions) => Promise<SessionStartResult>
  write: (sessionId: string, data: string) => Promise<void>
  resize: (sessionId: string, cols: number, rows: number) => Promise<void>
  stop: (sessionId: string) => Promise<void>
  interrupt: (sessionId: string) => Promise<void>
  forceKill: (sessionId: string) => Promise<void>
  kill: (sessionId: string) => Promise<void>
  runHeadless: (options: HeadlessRunOptions) => Promise<HeadlessRunResult>
  openExternal: (url: string) => Promise<void>
  revealTranscript: (transcriptPath: string) => Promise<void>
  revealPath: (targetPath: string) => Promise<void>
  readTranscript: (transcriptPath: string) => Promise<{ content: string; path: string; ext: string; error?: string }>
  listFiles: (dir: string, cwd?: string) => Promise<{ entries: FileEntry[]; dir: string; error?: string }>
  readFile: (filePath: string, cwd?: string) => Promise<{ content: string; path: string; ext: string; error?: string }>
  ideStatus: (commandExecutable?: string, cwd?: string) => Promise<IdeStatusResult>
  gitStatus: (cwd?: string) => Promise<GitEnvironmentStatus>
  discoverSessions: (cwd?: string) => Promise<{ sessions: DiscoveredSession[] }>
  projectCommandCodeReference: (cwd?: string) => Promise<{ reference: ProjectCommandCodeReference }>
  usage: (commandExecutable?: string, cwd?: string) => Promise<UsageSummary>
  listTaste: () => Promise<{ packages: TastePackage[] }>
  listAgents: (cwd?: string) => Promise<{ agents: AgentConfig[] }>
  saveAgent: (agentPath: string, content: string, cwd?: string) => Promise<WriteFileResult>
  listMcp: (commandExecutable?: string) => Promise<{ servers: McpServer[] }>
  mcpAction: (commandExecutable: string | undefined, action: 'connect' | 'disconnect', serverName: string) => Promise<CliExecResult>
  listSkills: () => Promise<{ skills: SkillEntry[] }>
  listMemories: (cwd?: string) => Promise<{ memories: MemoryFile[] }>
  saveMemory: (filePath: string, content: string, cwd?: string) => Promise<WriteFileResult>
  discoverHookConfigs: (cwd?: string) => Promise<HookConfigDiscoveryResult>
  previewHookToggle: (options: {
    cwd?: string
    sourceScope: HookScope
    event: HookEvent
    command: string
    enabled: boolean
  }) => Promise<HookConfigTogglePreviewResult>
  applyHookToggle: (options: {
    cwd?: string
    sourceScope: HookScope
    event: HookEvent
    command: string
    enabled: boolean
  }) => Promise<HookConfigToggleApplyResult>
  onSessionData: (sessionId: string, callback: SessionDataCallback) => Unsubscribe
  onSessionExit: (sessionId: string, callback: SessionExitCallback) => Unsubscribe
}

import type {
  AgentConfig,
  CliExecResult,
  CommandCodeCheck,
  CommandCodeStatus,
  DirectoryPickResult,
  DiscoveredSession,
  FileEntry,
  HeadlessRunOptions,
  HeadlessRunResult,
  IdeStatusResult,
  McpServer,
  MemoryFile,
  ModelListResult,
  SessionExitPayload,
  SessionStartOptions,
  SessionStartResult,
  SkillEntry,
  TastePackage,
  UsageSummary,
  WriteFileResult,
} from './types'
import type { PtyDoctorResult } from './ptyDoctor'

export type SessionDataCallback = (data: string) => void
export type SessionExitCallback = (payload: SessionExitPayload) => void
export type Unsubscribe = () => void

export type TransportAPI = {
  chooseDirectory: () => Promise<DirectoryPickResult>
  check: (commandExecutable?: string) => Promise<CommandCodeCheck>
  status: (commandExecutable?: string, cwd?: string) => Promise<CommandCodeStatus>
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
  listFiles: (dir: string) => Promise<{ entries: FileEntry[]; dir: string; error?: string }>
  readFile: (filePath: string) => Promise<{ content: string; path: string; ext: string; error?: string }>
  ideStatus: (commandExecutable?: string, cwd?: string) => Promise<IdeStatusResult>
  discoverSessions: () => Promise<{ sessions: DiscoveredSession[] }>
  usage: (commandExecutable?: string, cwd?: string) => Promise<UsageSummary>
  listTaste: () => Promise<{ packages: TastePackage[] }>
  listAgents: () => Promise<{ agents: AgentConfig[] }>
  saveAgent: (agentPath: string, content: string) => Promise<WriteFileResult>
  listMcp: (commandExecutable?: string) => Promise<{ servers: McpServer[] }>
  mcpAction: (commandExecutable: string | undefined, action: 'connect' | 'disconnect', serverName: string) => Promise<CliExecResult>
  listSkills: () => Promise<{ skills: SkillEntry[] }>
  listMemories: (cwd?: string) => Promise<{ memories: MemoryFile[] }>
  saveMemory: (filePath: string, content: string) => Promise<WriteFileResult>
  onSessionData: (sessionId: string, callback: SessionDataCallback) => Unsubscribe
  onSessionExit: (sessionId: string, callback: SessionExitCallback) => Unsubscribe
}

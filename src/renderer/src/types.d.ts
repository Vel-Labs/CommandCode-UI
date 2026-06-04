import type {
  CommandCodeCheck,
  CommandCodeStatus,
  DirectoryPickResult,
  HeadlessRunOptions,
  HeadlessRunResult,
  ModelListResult,
  SessionExitPayload,
  SessionStartOptions,
  SessionStartResult
} from '../../shared/types'

declare global {
  interface Window {
    commandCode: {
      chooseDirectory: () => Promise<DirectoryPickResult>
      check: (commandExecutable?: string) => Promise<CommandCodeCheck>
      status: (commandExecutable?: string, cwd?: string) => Promise<CommandCodeStatus>
      listModels: (commandExecutable?: string, cwd?: string) => Promise<ModelListResult>
      startSession: (options: SessionStartOptions) => Promise<SessionStartResult>
      write: (sessionId: string, data: string) => Promise<void>
      resize: (sessionId: string, cols: number, rows: number) => Promise<void>
      kill: (sessionId: string) => Promise<void>
      stop: (sessionId: string) => Promise<void>
      forceKill: (sessionId: string) => Promise<void>
      runHeadless: (options: HeadlessRunOptions) => Promise<HeadlessRunResult>
      openExternal: (url: string) => Promise<void>
      revealTranscript: (transcriptPath: string) => Promise<void>
      onSessionData: (sessionId: string, callback: (data: string) => void) => () => void
      onSessionExit: (sessionId: string, callback: (payload: SessionExitPayload) => void) => () => void
    }
  }
}

export {}

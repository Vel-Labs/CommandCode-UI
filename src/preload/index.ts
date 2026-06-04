import { contextBridge, ipcRenderer } from 'electron'
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
} from '../shared/types'

const api = {
  chooseDirectory: (): Promise<DirectoryPickResult> => ipcRenderer.invoke('cc:choose-directory'),
  check: (commandExecutable?: string): Promise<CommandCodeCheck> => ipcRenderer.invoke('cc:check', commandExecutable),
  status: (commandExecutable?: string, cwd?: string): Promise<CommandCodeStatus> => ipcRenderer.invoke('cc:status', commandExecutable, cwd),
  listModels: (commandExecutable?: string, cwd?: string): Promise<ModelListResult> => ipcRenderer.invoke('cc:list-models', commandExecutable, cwd),
  startSession: (options: SessionStartOptions): Promise<SessionStartResult> => ipcRenderer.invoke('cc:start-session', options),
  write: (sessionId: string, data: string): Promise<void> => ipcRenderer.invoke('cc:write', sessionId, data),
  resize: (sessionId: string, cols: number, rows: number): Promise<void> => ipcRenderer.invoke('cc:resize', sessionId, cols, rows),
  kill: (sessionId: string): Promise<void> => ipcRenderer.invoke('cc:kill', sessionId),
  stop: (sessionId: string): Promise<void> => ipcRenderer.invoke('cc:stop', sessionId),
  forceKill: (sessionId: string): Promise<void> => ipcRenderer.invoke('cc:force-kill', sessionId),
  runHeadless: (options: HeadlessRunOptions): Promise<HeadlessRunResult> => ipcRenderer.invoke('cc:run-headless', options),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('cc:open-external', url),
  revealTranscript: (transcriptPath: string): Promise<void> => ipcRenderer.invoke('cc:reveal-transcript', transcriptPath),
  onSessionData: (sessionId: string, callback: (data: string) => void): (() => void) => {
    const channel = `cc:session-data:${sessionId}`
    const handler = (_event: Electron.IpcRendererEvent, data: string) => callback(data)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  onSessionExit: (sessionId: string, callback: (payload: SessionExitPayload) => void): (() => void) => {
    const channel = `cc:session-exit:${sessionId}`
    const handler = (_event: Electron.IpcRendererEvent, payload: SessionExitPayload) => callback(payload)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  }
}

contextBridge.exposeInMainWorld('commandCode', api)

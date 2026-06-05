import { contextBridge, ipcRenderer } from 'electron'
import type { DirectoryPickResult } from '../shared/types'

const api = {
  chooseDirectory: (): Promise<DirectoryPickResult> => ipcRenderer.invoke('cc:choose-directory'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('cc:open-external', url),
  revealTranscript: (transcriptPath: string): Promise<void> => ipcRenderer.invoke('cc:reveal-transcript', transcriptPath),
  getServerInfo: (): Promise<{ port: number; token: string }> => ipcRenderer.invoke('cc:get-server-info')
}

contextBridge.exposeInMainWorld('commandCode', api)

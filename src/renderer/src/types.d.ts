import type { DirectoryPickResult } from '../../shared/types'

declare global {
  interface Window {
    commandCode: {
      chooseDirectory: () => Promise<DirectoryPickResult>
      openExternal: (url: string) => Promise<void>
      revealTranscript: (transcriptPath: string) => Promise<void>
      getServerInfo: () => Promise<{ port: number; token: string }>
    }
  }
}

export {}

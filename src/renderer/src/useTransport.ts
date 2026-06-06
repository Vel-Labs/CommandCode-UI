import { useMemo } from 'react'
import { createBrowserTransport } from './browserAdapter'
import type { TransportAPI } from '../../core/transport'

export function useTransport(): TransportAPI {
  const transport = useMemo(() => {
    const t = createBrowserTransport()

    // Electron native API overlays
    if (typeof window !== 'undefined') {
      const cc = (window as unknown as {
        commandCode?: {
          chooseDirectory: () => Promise<{ canceled: boolean; path?: string }>
          openExternal: (url: string) => Promise<void>
          revealTranscript: (path: string) => Promise<void>
          revealPath: (path: string) => Promise<void>
        }
      }).commandCode

      if (cc) {
        t.chooseDirectory = () => cc.chooseDirectory()
        t.openExternal = (url: string) => cc.openExternal(url)
        t.revealTranscript = (path: string) => cc.revealTranscript(path)
        t.revealPath = (path: string) => cc.revealPath(path)
      }
    }

    return t
  }, [])

  return transport
}

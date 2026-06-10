import { useCallback, useEffect, useState } from 'react'
import type { TransportAPI } from '../../../core/transport'
import type { WorkEvent } from '../appTypes'
import { notify } from '../components/ToastSystem'
import { displayPath } from '../services/appStorage'

export function useShellTerminal({
  transport,
  cwd,
  setStatusLine,
  addWorkEvent
}: {
  transport: TransportAPI
  cwd: string
  setStatusLine: (value: string) => void
  addWorkEvent: (label: string, detail: string, tone?: WorkEvent['tone']) => void
}) {
  const [bottomTerminalOpen, setBottomTerminalOpen] = useState(false)
  const [shellSessionId, setShellSessionId] = useState<string | undefined>()

  const closeShellTerminal = useCallback(async (): Promise<void> => {
    if (shellSessionId) {
      await transport.forceKill(shellSessionId)
    }
    setShellSessionId(undefined)
    setBottomTerminalOpen(false)
  }, [shellSessionId, transport])

  useEffect(() => {
    if (cwd.trim()) return
    if (shellSessionId) {
      void transport.forceKill(shellSessionId)
      setShellSessionId(undefined)
      setBottomTerminalOpen(false)
    }
  }, [cwd, shellSessionId, transport])

  const openShellTerminal = useCallback(async (): Promise<void> => {
    if (!cwd.trim()) {
      setStatusLine('Choose a project directory before opening a terminal.')
      return
    }

    setBottomTerminalOpen(true)
    if (shellSessionId) return

    try {
      const result = await transport.startSession({
        cwd,
        terminalMode: 'shell',
        cols: 120,
        rows: 22,
        useMock: false
      })
      setShellSessionId(result.id)
      setStatusLine(`Terminal opened in ${displayPath(result.cwd)}.`)
      addWorkEvent('Terminal opened', `Shell session in ${displayPath(result.cwd)}`)
    } catch (err) {
      setBottomTerminalOpen(false)
      const message = err instanceof Error ? err.message : 'Failed to open terminal'
      setStatusLine(message)
      notify(`Terminal failed: ${message}`, 'session-error')
    }
  }, [addWorkEvent, cwd, setStatusLine, shellSessionId, transport])

  const toggleShellTerminal = useCallback(async (): Promise<void> => {
    if (bottomTerminalOpen) {
      await closeShellTerminal()
      return
    }
    await openShellTerminal()
  }, [bottomTerminalOpen, closeShellTerminal, openShellTerminal])

  return {
    bottomTerminalOpen,
    toggleShellTerminal
  }
}

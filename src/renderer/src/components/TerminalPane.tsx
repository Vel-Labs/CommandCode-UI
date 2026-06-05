import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import type { SessionExitPayload } from '../../../shared/types'
import type { TransportAPI } from '../../../core/transport'
import { notify } from './ToastSystem'

type TerminalPaneProps = {
  transport: TransportAPI
  sessionId?: string
  onExit: (payload: SessionExitPayload) => void
}

export function TerminalPane({ transport, sessionId, onExit }: TerminalPaneProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const sessionRef = useRef<string | undefined>(sessionId)
  const notifiedRef = useRef(true)

  useEffect(() => {
    if (!hostRef.current || terminalRef.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: 'JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      scrollback: 20_000,
      theme: {
        background: '#050505',
        foreground: '#f4f4f5',
        cursor: '#f4f4f5',
        black: '#050505',
        brightBlack: '#52525b',
        red: '#fb7185',
        green: '#a3e635',
        yellow: '#fde047',
        blue: '#60a5fa',
        magenta: '#8b5cf6',
        cyan: '#22d3ee',
        white: '#f4f4f5',
        brightWhite: '#ffffff'
      }
    })

    const fit = new FitAddon()
    terminal.loadAddon(fit)
    terminal.loadAddon(new WebLinksAddon())
    terminal.open(hostRef.current)
    fit.fit()

    terminal.writeln('\x1b[35mCommand Code GUI\x1b[0m')
    terminal.writeln('Start a session from the left rail, or enable Mock mode to preview the UI.')
    terminal.writeln('')

    terminal.onData((data) => {
      const active = sessionRef.current
      if (active) transport.write(active, data)
    })

    terminalRef.current = terminal
    fitRef.current = fit

    const resize = (): void => {
      fit.fit()
      const active = sessionRef.current
      if (active) transport.resize(active, terminal.cols, terminal.rows)
    }

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      terminal.dispose()
      terminalRef.current = null
      fitRef.current = null
    }
  }, [])

  useEffect(() => {
    sessionRef.current = sessionId
    if (!sessionId) return

    const terminal = terminalRef.current
    if (!terminal) return

    terminal.clear()
    terminal.writeln('\x1b[2mattaching session ' + sessionId + '\x1b[0m')
    terminal.writeln('')
    fitRef.current?.fit()
    transport.resize(sessionId, terminal.cols, terminal.rows)

    notifiedRef.current = false

    const offData = transport.onSessionData(sessionId, (data) => {
      terminal.write(data)

      if (!notifiedRef.current && data.length > 20) {
        notifiedRef.current = true
        setTimeout(() => notify('AI responded', 'session-response'), 300)
      }
    })

    const offExit = transport.onSessionExit(sessionId, (payload) => {
      terminal.writeln('')
      terminal.writeln(`\x1b[35msession exited\x1b[0m code=${payload.exitCode ?? 'null'} signal=${payload.signal ?? 'null'}`)
      onExit(payload)
    })

    return () => {
      offData()
      offExit()
    }
  }, [sessionId, onExit, transport])

  return <div className="terminal-host" ref={hostRef} />
}

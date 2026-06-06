import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import type { SessionExitPayload } from '../../../shared/types'
import type { TransportAPI } from '../../../core/transport'
import { looksLikeCliSelectionPrompt } from '../../../shared/terminalPrompts'
import { loadTerminalPrefs } from '../settings/terminalPreferences'

type TerminalPaneProps = {
  transport: TransportAPI
  sessionId?: string
  onExit?: (payload: SessionExitPayload) => void
  onExpandRequest?: () => void
  onInputRequest?: () => void
  onInputCommit?: () => void
  compact?: boolean
  inputEnabled?: boolean
  active?: boolean
}

export function TerminalPane({ transport, sessionId, onExit, onExpandRequest, onInputRequest, onInputCommit, compact = false, inputEnabled = true, active = true }: TerminalPaneProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const sessionRef = useRef<string | undefined>(sessionId)
  const activeRef = useRef(active)
  const lastSizeRef = useRef({ cols: 0, rows: 0 })
  const lastUserInputAtRef = useRef(0)
  const recentOutputRef = useRef('')
  const onExitRef = useRef(onExit)
  const onExpandRequestRef = useRef(onExpandRequest)
  const onInputRequestRef = useRef(onInputRequest)
  const onInputCommitRef = useRef(onInputCommit)
  const inputEnabledRef = useRef(inputEnabled)
  const [followingOutput, setFollowingOutput] = useState(true)

  useEffect(() => {
    onExitRef.current = onExit
  }, [onExit])

  useEffect(() => {
    onExpandRequestRef.current = onExpandRequest
  }, [onExpandRequest])

  useEffect(() => {
    onInputRequestRef.current = onInputRequest
  }, [onInputRequest])

  useEffect(() => {
    onInputCommitRef.current = onInputCommit
  }, [onInputCommit])

  useEffect(() => {
    inputEnabledRef.current = inputEnabled
    if (terminalRef.current) {
      terminalRef.current.options.disableStdin = !inputEnabled
      if (inputEnabled && activeRef.current) {
        terminalRef.current.focus()
      }
    }
  }, [inputEnabled])

  const fitVisibleTerminal = (): void => {
    const terminal = terminalRef.current
    if (!terminal || !activeRef.current) return
    fitRef.current?.fit()
    const nextSize = { cols: terminal.cols, rows: terminal.rows }
    const changed = nextSize.cols !== lastSizeRef.current.cols || nextSize.rows !== lastSizeRef.current.rows
    lastSizeRef.current = nextSize
    if (sessionRef.current && changed) {
      void transport.resize(sessionRef.current, terminal.cols, terminal.rows)
    }
    if (terminal.rows > 0) {
      terminal.refresh(0, terminal.rows - 1)
    }
  }

  useEffect(() => {
    activeRef.current = active
    const terminal = terminalRef.current
    if (!active || !terminal) return
    fitVisibleTerminal()
    window.requestAnimationFrame(() => {
      fitVisibleTerminal()
    })
    if (inputEnabledRef.current) {
      terminal.focus()
    }
    if (followingOutput) {
      terminal.scrollToBottom()
    }
  }, [active, followingOutput, transport])

  useEffect(() => {
    if (!hostRef.current || terminalRef.current) return

    const terminalPrefs = loadTerminalPrefs()
    const terminal = new Terminal({
      cursorBlink: terminalPrefs.cursorBlink,
      convertEol: true,
      fontFamily: 'JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: terminalPrefs.fontSize,
      lineHeight: terminalPrefs.lineHeight,
      scrollback: terminalPrefs.scrollback,
      scrollOnUserInput: false,
      disableStdin: !inputEnabledRef.current,
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
      if (!inputEnabledRef.current) {
        return
      }
      lastUserInputAtRef.current = Date.now()
      if (data === '\x0f') {
        onExpandRequestRef.current?.()
        return
      }
      const active = sessionRef.current
      if (active) transport.write(active, data)
      if (data.includes('\r') || data.includes('\n')) {
        onInputCommitRef.current?.()
      }
    })

    const scrollDisposable = terminal.onScroll(() => {
      const buffer = terminal.buffer.active
      setFollowingOutput(buffer.viewportY >= buffer.baseY - 1)
    })

    terminalRef.current = terminal
    fitRef.current = fit

    const resize = (): void => {
      fit.fit()
      const active = sessionRef.current
      const nextSize = { cols: terminal.cols, rows: terminal.rows }
      const changed = nextSize.cols !== lastSizeRef.current.cols || nextSize.rows !== lastSizeRef.current.rows
      lastSizeRef.current = nextSize
      if (active && activeRef.current && changed) transport.resize(active, terminal.cols, terminal.rows)
    }

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(resize)
    })
    resizeObserver.observe(hostRef.current)
    window.addEventListener('resize', resize)
    return () => {
      resizeObserver.disconnect()
      scrollDisposable.dispose()
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
    recentOutputRef.current = ''
    fitRef.current?.fit()
    if (inputEnabledRef.current && activeRef.current) {
      terminal.focus()
    }
    terminal.scrollToBottom()
    setFollowingOutput(true)
    lastSizeRef.current = { cols: terminal.cols, rows: terminal.rows }
    transport.resize(sessionId, terminal.cols, terminal.rows)

    const offData = transport.onSessionData(sessionId, (data) => {
      recentOutputRef.current = (recentOutputRef.current + data).slice(-6000)
      if (!inputEnabledRef.current && looksLikeCliSelectionPrompt(recentOutputRef.current)) {
        onInputRequestRef.current?.()
      }

      const buffer = terminal.buffer.active
      const wasFollowing = buffer.viewportY >= buffer.baseY - 1
      const recentUserInput = Date.now() - lastUserInputAtRef.current < 900
      terminal.write(data, () => {
        if (wasFollowing && !recentUserInput) {
          terminal.scrollToBottom()
        }
        const nextBuffer = terminal.buffer.active
        setFollowingOutput(nextBuffer.viewportY >= nextBuffer.baseY - 1)
      })
    })

    const offExit = onExitRef.current
      ? transport.onSessionExit(sessionId, (payload) => {
        terminal.writeln('')
        terminal.writeln(`\x1b[35msession exited\x1b[0m code=${payload.exitCode ?? 'null'} signal=${payload.signal ?? 'null'}`)
        onExitRef.current?.(payload)
      })
      : () => undefined

    return () => {
      offData()
      offExit()
    }
  }, [sessionId, transport])

  return (
    <div
      className={`terminal-host-wrap ${compact ? 'terminal-host-wrap--compact' : ''} ${inputEnabled ? 'terminal-host-wrap--input-enabled' : 'terminal-host-wrap--read-only'}`}
      onMouseDown={() => {
        if (!inputEnabledRef.current) {
          onInputRequestRef.current?.()
        }
      }}
    >
      <div className="terminal-host" ref={hostRef} />
      {!followingOutput && (
        <button className="terminal-jump-button" onClick={() => { terminalRef.current?.scrollToBottom(); terminalRef.current?.focus(); setFollowingOutput(true) }}>
          Jump to prompt
        </button>
      )}
    </div>
  )
}

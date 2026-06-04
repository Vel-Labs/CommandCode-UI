import { useCallback, useMemo, useState } from 'react'
import type { JSX } from 'react'
import type { PermissionMode, SessionExitPayload } from '../../shared/types'
import { ControlPanel } from './components/ControlPanel'
import { HeadlessRunner } from './components/HeadlessRunner'
import { TerminalPane } from './components/TerminalPane'
import { StatusPill } from './components/StatusPill'

function defaultCwd(): string {
  return localStorage.getItem('ccgui.cwd') || ''
}

function defaultCommand(): string {
  return localStorage.getItem('ccgui.command') || 'cmd'
}

export function App(): JSX.Element {
  const [cwd, setCwdState] = useState(defaultCwd)
  const [commandExecutable, setCommandExecutableState] = useState(defaultCommand)
  const [model, setModel] = useState(localStorage.getItem('ccgui.model') || '')
  const [permissionMode, setPermissionMode] = useState<PermissionMode>('standard')
  const [trust, setTrust] = useState(true)
  const [skipOnboarding, setSkipOnboarding] = useState(false)
  const [useMock, setUseMock] = useState(true)
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()
  const [statusLine, setStatusLine] = useState('')
  const [stopRequested, setStopRequested] = useState(false)
  const [transcriptPath, setTranscriptPath] = useState<string | undefined>()

  const setCwd = (value: string): void => {
    setCwdState(value)
    localStorage.setItem('ccgui.cwd', value)
  }

  const setCommandExecutable = (value: string): void => {
    setCommandExecutableState(value)
    localStorage.setItem('ccgui.command', value)
  }

  const setModelPersisted = (value: string): void => {
    setModel(value)
    localStorage.setItem('ccgui.model', value)
  }

  const cwdReady = useMemo(() => Boolean(cwd.trim()) || useMock, [cwd, useMock])

  const chooseProject = async (): Promise<void> => {
    const result = await window.commandCode.chooseDirectory()
    if (!result.canceled && result.path) setCwd(result.path)
  }

  const startSession = async (): Promise<void> => {
    if (!cwdReady) {
      setStatusLine('Choose a project directory first, or enable Mock mode.')
      return
    }

    const result = await window.commandCode.startSession({
      cwd: cwd || '.',
      commandExecutable,
      model: model || undefined,
      permissionMode,
      trust,
      skipOnboarding,
      cols: 120,
      rows: 34,
      useMock
    })

    setActiveSessionId(result.id)
    setStopRequested(false)
    setTranscriptPath(result.transcriptPath)
    setStatusLine(`${result.mock ? 'Mock' : 'Real'} session started: ${result.command} ${result.args.join(' ')}`)
  }

  const stopSession = async (): Promise<void> => {
    if (!activeSessionId) return
    if (!stopRequested) {
      await window.commandCode.stop(activeSessionId)
      setStopRequested(true)
      setStatusLine('Sent Ctrl-C. Press Force Stop to kill, or wait for graceful exit.')
      return
    }
    await window.commandCode.forceKill(activeSessionId)
    setActiveSessionId(undefined)
    setStopRequested(false)
    setStopRequested(false)
    setStatusLine('Session force-killed.')
  }

  const runCheck = async (): Promise<void> => {
    const result = await window.commandCode.check(commandExecutable)
    setStatusLine(result.ok ? `OK ${result.command}: ${result.version || result.stdout.trim()}` : `Failed: ${result.stderr || result.error}`)
  }

  const runStatus = async (): Promise<void> => {
    const result = await window.commandCode.status(commandExecutable, cwd || '.')
    setStatusLine(result.ok ? `Authenticated/status ok: ${result.stdout.trim().slice(0, 160) || 'empty JSON'}` : `Status failed: ${result.stderr || result.error}`)
  }

  const runListModels = async (): Promise<void> => {
    const result = await window.commandCode.listModels(commandExecutable, cwd || '.')
    setStatusLine(result.ok ? `Models: ${result.models.slice(0, 6).join(', ')}${result.models.length > 6 ? '…' : ''}` : `List models failed: ${result.stderr || result.error}`)
  }

  const sendSlash = async (command: string): Promise<void> => {
    if (!activeSessionId) return
    await window.commandCode.write(activeSessionId, `${command}\r`)
  }

  const onExit = useCallback((payload: SessionExitPayload): void => {
    setActiveSessionId(undefined)
    setStatusLine(`Session exited with code=${payload.exitCode ?? 'null'} signal=${payload.signal ?? 'null'}`)
  }, [])

  return (
    <main className="app-shell">
      <div className="grid-overlay" />
      <div className="noise-bars" aria-hidden="true">
        <span /><span /><span /><span /><span /><span /><span /><span />
      </div>

      <ControlPanel
        cwd={cwd}
        setCwd={setCwd}
        commandExecutable={commandExecutable}
        setCommandExecutable={setCommandExecutable}
        model={model}
        setModel={setModelPersisted}
        permissionMode={permissionMode}
        setPermissionMode={setPermissionMode}
        trust={trust}
        setTrust={setTrust}
        skipOnboarding={skipOnboarding}
        setSkipOnboarding={setSkipOnboarding}
        useMock={useMock}
        setUseMock={setUseMock}
        activeSessionId={activeSessionId}
        stopRequested={stopRequested}
        statusLine={statusLine}
        onChooseProject={chooseProject}
        onStartSession={startSession}
        onStopSession={stopSession}
        onCheck={runCheck}
        onStatus={runStatus}
        onListModels={runListModels}
        onSlash={sendSlash}
      />

      <section className="workspace">
        <header className="top-bar">
          <div>
            <div className="brand-kicker">Every tool you need. None you don't.</div>
            <h2>Run Command Code as a background engine.</h2>
          </div>
          <div className="top-actions">
            <StatusPill label={permissionMode} tone={permissionMode === 'auto-accept' ? 'warn' : permissionMode === 'plan' ? 'purple' : 'default'} />
            <StatusPill label={trust ? 'trusted cwd' : 'manual trust'} tone={trust ? 'good' : 'default'} />
            {transcriptPath && activeSessionId && (
              <button className="ghost-button" onClick={() => window.commandCode.revealTranscript(transcriptPath)} title={transcriptPath}>Transcript</button>
            )}
            <button className="ghost-button" onClick={() => window.commandCode.openExternal('https://commandcode.ai/docs/reference/cli')}>CLI docs</button>
          </div>
        </header>

        <section className="terminal-card">
          <TerminalPane sessionId={activeSessionId} onExit={onExit} />
        </section>

        <HeadlessRunner
          cwd={cwd || '.'}
          commandExecutable={commandExecutable}
          model={model}
          permissionMode={permissionMode}
          trust={trust}
          skipOnboarding={skipOnboarding}
        />
      </section>
    </main>
  )
}

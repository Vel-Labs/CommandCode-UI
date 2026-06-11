import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { FileText, MoreHorizontal, Square, TerminalSquare, X } from 'lucide-react'
import type { SessionExitPayload } from '../../../shared/types'
import type { GitEnvironmentStatus, SessionTelemetrySnapshot } from '../../../core/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { SessionTab } from '../appTypes'
import { ComposerBar } from '../components/ComposerBar'
import { LiveConversationPane } from '../components/LiveConversationPane'
import { PtyHealthBadge } from '../components/PtyHealthBadge'
import { StatusPill } from '../components/StatusPill'
import { TabBar } from '../components/TabBar'
import { TerminalPane } from '../components/TerminalPane'
import { sessionReadinessDisplay } from '../services/sessionReadiness'
import { sessionModelLabel } from '../services/sessionModelIdentity'

export function SessionWorkspace({
  transport,
  tabs,
  activeTabId,
  activeTab,
  projectLabel,
  cwd,
  ptyHealth,
  statusLine,
  composerPrompt,
  showPlanSuggestion,
  permissionLabel,
  riskyPermission,
  permissionTone,
  gitStatus,
  gitStatusLoading,
  onKillTab,
  onSelectTab,
  onExit,
  onStopSession,
  setComposerPrompt,
  onSubmitComposer,
  onFocusComposer,
  onUsePlanMode,
  onProject,
  onPermission,
  onModel,
  onSlash,
  onOpenArtifact,
  onOpenThinking,
  onRevealTranscript,
  onInputRequired,
  onConversationReadiness,
  terminalInputEnabled,
  onTerminalInputRequest,
  onTerminalInputCommit
}: {
  transport: TransportAPI
  tabs: SessionTab[]
  activeTabId?: string
  activeTab?: SessionTab
  projectLabel: string
  cwd: string
  ptyHealth: PtyDoctorResult | null
  statusLine: string
  composerPrompt: string
  showPlanSuggestion: boolean
  permissionLabel: string
  riskyPermission: boolean
  permissionTone: 'default' | 'warn' | 'purple'
  gitStatus: GitEnvironmentStatus | null
  gitStatusLoading: boolean
  onKillTab: (id: string) => Promise<void>
  onSelectTab: (id: string) => void
  onExit: (payload: SessionExitPayload) => void
  onStopSession: () => Promise<void>
  setComposerPrompt: (value: string) => void
  onSubmitComposer: () => Promise<void>
  onFocusComposer: () => void
  onUsePlanMode: () => Promise<void>
  onProject: () => void
  onPermission: () => void
  onModel: () => void
  onSlash: () => void
  onOpenArtifact: (path: string) => void
  onOpenThinking: () => void
  onRevealTranscript: () => void
  onInputRequired: () => void
  onConversationReadiness: (sessionId: string, state: 'thinking' | 'ready' | 'input') => void
  terminalInputEnabled: boolean
  onTerminalInputRequest: () => void
  onTerminalInputCommit: () => void
}): JSX.Element {
  const activeReadiness = activeTab ? sessionReadinessDisplay(activeTab.readiness) : undefined
  const lastPrompt = activeTab?.lastPrompt?.trim()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    setAdvancedOpen(false)
    setTerminalOpen(false)
  }, [activeTabId])

  useEffect(() => {
    if (activeTab?.readiness.status === 'running' || activeTab?.readiness.status === 'waiting-for-input') {
      setIsStreaming(true)
    } else {
      setIsStreaming(false)
    }
  }, [activeTab?.readiness])

  const openAdvancedTerminal = (): void => {
    setAdvancedOpen(true)
    setTerminalOpen(true)
  }

  const metadataModel = sessionModelLabel({ model: activeTab?.model, transcriptModel: activeTab?.resumedSession?.model })

  return (
    <section className="session-workspace session-workspace--native" aria-label="Active session">
      <TabBar tabs={tabs} activeId={activeTabId} onSelect={onSelectTab} onKill={(id) => void onKillTab(id)} />
      <header className="native-session-header">
        <div className="native-session-title-group">
          <div className="native-session-title">{activeTab?.label || 'Command Code'}</div>
          <div className="native-session-meta" aria-label="Session environment">
            <span className="native-session-project">{projectLabel}</span>
            <StatusPill label={metadataModel} tone="default" size="sm" />
            <StatusPill label={activeTab?.mock ? 'Demo' : 'Real'} tone={activeTab?.mock ? 'purple' : 'default'} size="sm" />
            <PtyHealthBadge ptyHealth={ptyHealth} compact size="sm" />
            {activeReadiness && <StatusPill label={activeReadiness.label} tone={activeReadiness.tone} size="sm" />}
            <StatusPill label={permissionLabel} tone={permissionTone} size="sm" />
          </div>
          {activeTab?.telemetry && <SessionTelemetryStrip telemetry={activeTab.telemetry} />}
        </div>
        <div className="native-session-actions">
          <button className="ghost-button native-ghost" onClick={() => void onStopSession()} title="Stop active session" disabled={!isStreaming}>
            <Square size={12} />
            Stop
          </button>
          <div className="native-session-advanced">
            <button
              className={`ghost-button native-icon-button ${advancedOpen ? 'native-ghost--active' : ''}`}
              onClick={() => setAdvancedOpen((open) => !open)}
              title="Advanced session tools"
              aria-label="Advanced session tools"
            >
              <MoreHorizontal size={17} />
            </button>
            {advancedOpen && (
              <div className="native-advanced-menu">
                <button onClick={openAdvancedTerminal}>
                  <TerminalSquare size={14} />
                  <span>Open terminal transcript</span>
                </button>
                {activeTab?.transcriptPath && (
                  <button onClick={onRevealTranscript}>
                    <FileText size={14} />
                    <span>{transport.supportsNativeReveal ? 'Reveal transcript' : 'Show transcript path'}</span>
                  </button>
                )}
                {terminalOpen && (
                  <button onClick={onTerminalInputRequest}>
                    <TerminalSquare size={14} />
                    <span>{terminalInputEnabled ? 'Terminal input enabled' : 'Enable terminal input'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="native-conversation-surface" aria-label="Conversation">
        <LiveConversationPane
          // Each PTY session owns its own parser refs and turn history.
          key={activeTabId || 'no-session'}
          transport={transport}
          sessionId={activeTabId || ''}
          active
          lastPrompt={lastPrompt}
          cwd={cwd}
          mock={activeTab?.mock}
          structuredTranscriptPath={activeTab?.structuredTranscriptPath}
          transcriptBindingStatus={activeTab?.transcriptBindingStatus}
          commandCodeSessionId={activeTab?.commandCodeSessionId}
          onOpenArtifact={onOpenArtifact}
          onOpenRawTerminal={openAdvancedTerminal}
          onOpenThinking={onOpenThinking}
          onInputRequired={onInputRequired}
          onConversationReadiness={onConversationReadiness}
          onInputCommit={onTerminalInputCommit}
        />
        <SessionExitBridge key={`exit:${activeTabId || 'no-session'}`} transport={transport} sessionId={activeTabId || ''} onExit={onExit} />
      </section>

      {terminalOpen && (
        <section className="advanced-terminal-panel" aria-label="Advanced terminal transcript">
          <div className="advanced-terminal-header">
            <div>
              <div className="advanced-terminal-title">Terminal transcript</div>
              <div className="advanced-terminal-subtitle">Raw Command Code PTY output for diagnostics and unsupported menus.</div>
            </div>
            <button className="ghost-button native-icon-button" onClick={() => setTerminalOpen(false)} title="Close terminal transcript" aria-label="Close terminal transcript">
              <X size={16} />
            </button>
          </div>
          <div className="advanced-terminal-body">
            <TerminalPane
              transport={transport}
              sessionId={activeTabId}
              seamless
              active={terminalOpen}
              inputEnabled={terminalInputEnabled}
              onInputRequest={onTerminalInputRequest}
              onInputCommit={onTerminalInputCommit}
            />
          </div>
        </section>
      )}

      <div className="session-composer">
        <ComposerBar
          active
          prompt={composerPrompt}
          setPrompt={setComposerPrompt}
          onSubmit={onSubmitComposer}
          onFocus={onFocusComposer}
          showPlanSuggestion={showPlanSuggestion}
          onPlanMode={onUsePlanMode}
          projectLabel={projectLabel}
          modelLabel={metadataModel}
          permissionLabel={permissionLabel}
          riskyPermission={riskyPermission}
          onProject={onProject}
          onPermission={onPermission}
          onModel={onModel}
          onSlash={onSlash}
        />
      </div>
    </section>
  )
}

function SessionTelemetryStrip({ telemetry }: { telemetry: SessionTelemetrySnapshot }): JSX.Element {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (telemetry.exitCode !== undefined || telemetry.signal !== undefined) {
      setNowMs(Date.now())
      return
    }
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [telemetry.exitCode, telemetry.signal, telemetry.sessionId])

  const lastEvent = telemetry.lastOutputAtMs || telemetry.lastInputAtMs || telemetry.startedAtMs
  const ageSeconds = Math.max(0, Math.floor((nowMs - lastEvent) / 1000))
  const direction = telemetry.lastOutputAtMs && (!telemetry.lastInputAtMs || telemetry.lastOutputAtMs >= telemetry.lastInputAtMs)
    ? 'output'
    : telemetry.lastInputAtMs
      ? 'input'
      : 'started'
  const exit = telemetry.exitCode !== undefined || telemetry.signal !== undefined
    ? `exit ${telemetry.exitCode ?? telemetry.signal ?? 'done'}`
    : 'live'
  const streamHealth = exit !== 'live'
    ? 'closed'
    : ageSeconds >= 60
      ? 'stale'
      : ageSeconds >= 15
        ? 'quiet'
        : 'active'

  return (
    <div className="native-session-telemetry" aria-label="Session stream telemetry">
      <span title={`${telemetry.command} ${telemetry.args.join(' ')}`}>{telemetry.command}</span>
      <span>{telemetry.inputChunks} in / {formatBytes(telemetry.inputBytes)}</span>
      <span>{telemetry.outputChunks} out / {formatBytes(telemetry.outputBytes)}</span>
      <span>{direction} {ageSeconds}s ago</span>
      <span className={`native-session-telemetry-health native-session-telemetry-health--${streamHealth}`}>{streamHealth}</span>
      <span>{exit}</span>
      {telemetry.transcriptWriteErrors > 0 && <span className="native-session-telemetry-error">{telemetry.transcriptWriteErrors} transcript errors</span>}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function SessionExitBridge({
  transport,
  sessionId,
  onExit
}: {
  transport: TransportAPI
  sessionId: string
  onExit: (payload: SessionExitPayload) => void
}): null {
  useEffect(() => transport.onSessionExit(sessionId, onExit), [onExit, sessionId, transport])
  return null
}

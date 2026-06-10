import { useMemo } from 'react'
import type { JSX } from 'react'
import { ChevronRight, FileText, Loader2, TerminalSquare } from 'lucide-react'
import type { TransportAPI } from '../../../core/transport'
import type { LiveConversationEvent } from '../services/liveConversation'
import { suggestTranscriptArtifacts } from '../services/transcriptArtifacts'

export function TimelineEvent({
  event,
  elapsedMs,
  cwd,
  sessionId,
  transport,
  onOpenArtifact,
  onOpenRawTerminal,
  onOpenThinking,
  onInputCommit
}: {
  event: LiveConversationEvent
  elapsedMs: number
  cwd?: string
  sessionId?: string
  transport: TransportAPI
  onOpenArtifact?: (path: string) => void
  onOpenRawTerminal?: () => void
  onOpenThinking?: () => void
  onInputCommit?: () => void
}): JSX.Element {
  if (event.kind === 'user_message') {
    return (
      <article className="native-chat-row native-chat-row--user">
        <div className="native-chat-avatar">You</div>
        <div className="native-chat-message native-chat-message--user">{event.text}</div>
      </article>
    )
  }

  if (event.kind === 'assistant_message') {
    return (
      <article className="native-chat-row native-chat-row--assistant">
        <div className="native-chat-avatar native-chat-avatar--assistant">CC</div>
        <div className="native-chat-message native-chat-message--assistant">
          {event.text.split('\n').map((line, index) => <p key={`${event.id}-${index}`}>{line}</p>)}
          <LiveArtifactLinks text={event.text} cwd={cwd} onOpenArtifact={onOpenArtifact} />
        </div>
      </article>
    )
  }

  if (event.kind === 'working') {
    return (
      <article className="native-chat-row native-chat-row--assistant native-chat-row--system">
        <div className="native-chat-avatar native-chat-avatar--assistant">CC</div>
        <div className="native-chat-system-row">
          <div className="native-chat-working">
            <span className="live-waiting-spinner" aria-hidden="true" />
            <span>{event.text}</span>
            <span className="live-waiting-time">{formatElapsed(elapsedMs)}</span>
          </div>
          {event.detail?.length ? <ExpandableDetails label="Show activity" lines={event.detail} /> : null}
        </div>
      </article>
    )
  }

  if (event.kind === 'thinking') {
    return (
      <article className="native-chat-row native-chat-row--assistant native-chat-row--system">
        <div className="native-chat-avatar native-chat-avatar--assistant">CC</div>
        <div className="native-chat-system-row">
          <button className="native-chat-thinking" onClick={onOpenThinking} title="Open thinking in inspector with Ctrl/Cmd+O or Ctrl/Cmd+0">
            <span>{event.text}</span>
            <span className="native-chat-kbd">Ctrl/Cmd+O/0</span>
          </button>
        </div>
      </article>
    )
  }

  if (event.kind === 'activity') {
    return (
      <article className="native-chat-row native-chat-row--assistant native-chat-row--system">
        <div className="native-chat-avatar native-chat-avatar--assistant">CC</div>
        <div className="native-chat-system-row">
          <div className="native-chat-activity">
            <FileText size={14} />
            <span>{event.text}</span>
          </div>
          {event.detail?.length ? <ExpandableDetails label="Show details" lines={event.detail} /> : null}
          <LiveArtifactLinks text={[event.text, ...(event.detail || [])].join('\n')} cwd={cwd} onOpenArtifact={onOpenArtifact} compact />
        </div>
      </article>
    )
  }

  if (event.kind === 'approval') {
    return (
      <div className="native-chat-system-row">
        <div className="native-chat-approval">
          <div className="native-chat-approval-title">{event.text}</div>
          {event.detail?.length ? <div className="native-chat-approval-copy">{event.detail.join(' ')}</div> : null}
          <div className="native-chat-approval-actions">
            {event.options?.map((option) => (
              <button
                key={option.key}
                className="native-chat-approval-button"
                onClick={() => {
                  onInputCommit?.()
                  if (sessionId) void transport.write(sessionId, approvalInput(option.key))
                }}
              >
                <span>{approvalLabel(option.label)}</span>
                <ChevronRight size={14} />
              </button>
            ))}
            <button className="native-chat-approval-button native-chat-approval-button--secondary" onClick={onOpenRawTerminal}>
              <TerminalSquare size={14} />
              <span>Advanced terminal</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (event.kind === 'file_reference') {
    return <LiveFileReference event={event} cwd={cwd} onOpenArtifact={onOpenArtifact} />
  }

  if (event.kind === 'terminal_required') {
    return (
      <div className="native-chat-system-row">
        <div className="native-chat-terminal-required">
          <TerminalSquare size={14} />
          <div>
            <div className="native-chat-terminal-title">{event.text}</div>
            {event.detail?.length ? <div className="native-chat-terminal-copy">{event.detail.slice(-2).join(' ')}</div> : null}
          </div>
          <button className="native-chat-terminal-button" onClick={onOpenRawTerminal}>Open advanced terminal</button>
        </div>
      </div>
    )
  }

  return (
    <div className="native-chat-system-row">
      <div className="native-chat-session-event">
        <Loader2 size={13} />
        <span>{event.text}</span>
      </div>
    </div>
  )
}

function ExpandableDetails({ label, lines }: { label: string; lines: string[] }): JSX.Element {
  return (
    <details className="native-chat-details">
      <summary>{label}</summary>
      <div className="native-chat-detail-lines">
        {lines.map((line, index) => <div key={`${label}-${index}`}>{line}</div>)}
      </div>
    </details>
  )
}

function LiveFileReference({
  event,
  cwd,
  onOpenArtifact
}: {
  event: LiveConversationEvent
  cwd?: string
  onOpenArtifact?: (path: string) => void
}): JSX.Element | null {
  const artifacts = suggestTranscriptArtifacts(event.path || event.text, cwd).artifacts.slice(0, 1)
  const artifact = artifacts[0]
  if (!artifact) return null

  return (
    <div className="native-chat-system-row">
      <button
        className="native-file-card"
        onClick={() => onOpenArtifact?.(artifact.path)}
        disabled={!onOpenArtifact}
        title={artifact.path}
      >
        <FileText size={16} />
        <span>{artifact.raw}</span>
      </button>
    </div>
  )
}

function approvalLabel(label: string): string {
  if (/analyze session/i.test(label)) return 'Analyze session'
  if (/skip/i.test(label)) return 'Skip'
  if (/never/i.test(label)) return 'Never'
  if (/switch to plan mode/i.test(label)) return 'Switch to plan mode'
  if (/stay in standard/i.test(label)) return 'Stay standard'
  if (/allow all edits|all edits|session/i.test(label)) return 'Allow session'
  if (/^yes\b|allow|approve/i.test(label)) return 'Allow once'
  if (/^no\b|deny|different/i.test(label)) return 'Deny'
  return label
}

function approvalInput(key: string): string {
  if (key === 'enter') return '\r'
  if (key === 'esc') return '\x1b'
  return `${key}\r`
}

function LiveArtifactLinks({
  text,
  cwd,
  onOpenArtifact,
  compact = false
}: {
  text: string
  cwd?: string
  onOpenArtifact?: (path: string) => void
  compact?: boolean
}): JSX.Element | null {
  const artifacts = useMemo(() => suggestTranscriptArtifacts(text, cwd).artifacts.slice(0, compact ? 3 : 5), [compact, cwd, text])
  if (!artifacts.length) return null

  return (
    <div className={`live-artifact-links ${compact ? 'live-artifact-links--compact' : ''}`} aria-label="Referenced files">
      {artifacts.map((artifact) => (
        <button
          key={artifact.path}
          className="live-artifact-link"
          onClick={() => onOpenArtifact?.(artifact.path)}
          disabled={!onOpenArtifact}
          title={artifact.path}
        >
          <FileText size={13} />
          <span>{artifact.raw}</span>
        </button>
      ))}
    </div>
  )
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes ? `${minutes}m ${seconds.toString().padStart(2, '0')}s` : `${seconds}s`
}

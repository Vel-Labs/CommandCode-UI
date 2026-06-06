import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import { FileText, RotateCcw } from 'lucide-react'
import type { DiscoveredSession } from '../../../core/types'
import type { TransportAPI } from '../../../core/transport'
import { parseTranscriptJsonl, type ParsedTranscriptEntry, type TranscriptEntryKind } from '../../../core/transcriptParser'
import type { WorkEvent } from '../appTypes'
import { resolveSessionModelIdentity } from '../services/sessionModelIdentity'

export function TranscriptWorkspace({
  session,
  transport,
  statusLine,
  resumeFailure,
  workEvents,
  onResume,
  onReveal,
  onOpenTranscript
}: {
  session: DiscoveredSession
  transport: TransportAPI
  statusLine: string
  resumeFailure: string
  workEvents: WorkEvent[]
  onResume: () => void
  onReveal: () => void
  onOpenTranscript: () => void
}): JSX.Element {
  const modelIdentity = resolveSessionModelIdentity({ transcriptModel: session.model })

  return (
    <section className="transcript-workspace" aria-label="Transcript">
      <header className="transcript-header">
        <div>
          <div className="transcript-eyebrow">Recent context</div>
          <h1>{session.title || session.id}</h1>
          <div className="transcript-meta">{session.id} · {new Date(session.timestamp).toLocaleString()} · {modelIdentity.label}</div>
        </div>
        <div className="transcript-actions">
          <button className="primary-button" onClick={onResume}><RotateCcw size={16} /> Resume</button>
          <button className="ghost-button native-ghost" onClick={onOpenTranscript}><FileText size={16} /> Open transcript</button>
          <button className="ghost-button native-ghost" onClick={onReveal}>Reveal file</button>
        </div>
      </header>
      {resumeFailure && <div className="resume-failure">{resumeFailure}</div>}
      <div className="work-evidence-list">
        {(workEvents.length ? workEvents : [{ id: 'empty', label: 'Context loaded', detail: statusLine || 'Ready to inspect or resume this session.' }]).map((event) => (
          <div key={event.id} className={`work-evidence work-evidence--${event.tone || 'default'}`}>
            <strong>{event.label}</strong>
            <span>{event.detail}</span>
          </div>
        ))}
      </div>
      <div className="transcript-inline-preview">
        <TranscriptPreview transport={transport} session={session} compact />
      </div>
    </section>
  )
}

export function TranscriptPreview({ transport, session, compact = false }: { transport: TransportAPI; session: DiscoveredSession; compact?: boolean }): JSX.Element {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<TranscriptEntryKind | 'all'>('all')
  const parsed = useMemo(() => parseTranscriptJsonl(content), [content])
  const visibleEntries = filter === 'all'
    ? parsed.entries
    : parsed.entries.filter((entry) => entry.kind === filter)

  useEffect(() => {
    let cancelled = false
    transport.readTranscript(session.transcriptPath)
      .then((result) => {
        if (cancelled) return
        if (result.error) {
          setError(result.error)
          setContent('')
        } else {
          setError('')
          setContent(result.content)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Transcript read failed')
      })
    return () => {
      cancelled = true
    }
  }, [transport, session.transcriptPath])

  if (error) return <div className="error-text">{error}</div>
  if (!content) return <div className="muted">Loading transcript...</div>

  return (
    <div className={`transcript-timeline ${compact ? 'transcript-timeline--compact' : ''}`}>
      <div className="transcript-filter-row" aria-label="Transcript filters">
        {transcriptFilters.map((item) => (
          <button
            key={item.kind}
            type="button"
            className={filter === item.kind ? 'selected' : ''}
            onClick={() => setFilter(item.kind)}
          >
            <span>{item.label}</span>
            <strong>{item.kind === 'all' ? parsed.entries.length : parsed.counts[item.kind]}</strong>
          </button>
        ))}
      </div>
      <div className="transcript-entry-list">
        {visibleEntries.length
          ? visibleEntries.map((entry) => <TranscriptTimelineEntry key={`${entry.line}-${entry.id}`} entry={entry} />)
          : <div className="muted">No transcript entries match this filter.</div>}
      </div>
      <details className="transcript-raw-details">
        <summary>Raw transcript</summary>
        <pre className={`transcript-preview ${compact ? 'transcript-preview--compact' : ''}`}>{content}</pre>
      </details>
    </div>
  )
}

const transcriptFilters: Array<{ kind: TranscriptEntryKind | 'all'; label: string }> = [
  { kind: 'all', label: 'All' },
  { kind: 'user', label: 'User' },
  { kind: 'assistant', label: 'Assistant' },
  { kind: 'tool', label: 'Tools' },
  { kind: 'event', label: 'Events' },
  { kind: 'error', label: 'Errors' },
  { kind: 'unknown', label: 'Unknown' }
]

function TranscriptTimelineEntry({ entry }: { entry: ParsedTranscriptEntry }): JSX.Element {
  return (
    <article className={`transcript-entry transcript-entry--${entry.kind}`}>
      <header>
        <span className="transcript-entry-kind">{entry.label}</span>
        <span className="transcript-entry-meta">line {entry.line}{entry.timestamp ? ` · ${entry.timestamp}` : ''}</span>
      </header>
      {entry.text
        ? <p>{entry.text}</p>
        : <p className="muted">No readable text extracted; raw entry is preserved below.</p>}
      {entry.parseError && <div className="error-text">Invalid JSONL: {entry.parseError}</div>}
      <details>
        <summary>Raw entry</summary>
        <pre>{typeof entry.raw === 'string' ? entry.raw : JSON.stringify(entry.raw, null, 2)}</pre>
      </details>
    </article>
  )
}

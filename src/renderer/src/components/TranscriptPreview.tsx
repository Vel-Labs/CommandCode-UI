import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import type { DiscoveredSession } from '../../../core/types'
import type { TransportAPI } from '../../../core/transport'
import { parseTranscriptJsonl, type ParsedTranscriptEntry, type TranscriptEntryKind } from '../../../core/transcriptParser'
import { compactPtyDiagnosticTranscript } from '../services/liveConversation'
import { suggestTranscriptArtifacts, type TranscriptArtifactSuggestion } from '../services/transcriptArtifacts'

export function TranscriptPreview({
  transport,
  session,
  cwd,
  onOpenArtifact,
  compact = false,
  liveSession = false
}: {
  transport: TransportAPI
  session: DiscoveredSession
  cwd?: string
  onOpenArtifact?: (path: string) => void
  compact?: boolean
  liveSession?: boolean
}): JSX.Element {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [transcriptExt, setTranscriptExt] = useState('')
  const [truncated, setTruncated] = useState(false)
  const [filter, setFilter] = useState<TranscriptEntryKind | 'all'>('all')
  const isJsonlTranscript = transcriptExt === '.jsonl'
  const parsed = useMemo(() => isJsonlTranscript
    ? parseTranscriptJsonl(content)
    : {
      entries: [],
      counts: { user: 0, assistant: 0, tool: 0, error: 0, event: 0, unknown: 0 }
    }, [content, isJsonlTranscript])
  const artifactRoot = session.cwd || cwd
  const diagnosticText = useMemo(() => compactPtyDiagnosticTranscript(content), [content])
  const artifactText = useMemo(
    () => isJsonlTranscript ? parsed.entries.map((entry) => entry.text).filter(Boolean).join('\n') : diagnosticText,
    [diagnosticText, isJsonlTranscript, parsed.entries]
  )
  const artifactResult = useMemo(() => suggestTranscriptArtifacts(artifactText, artifactRoot), [artifactRoot, artifactText])
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
          setTranscriptExt('')
          setTruncated(false)
        } else {
          setError('')
          setContent(result.content)
          setTranscriptExt(result.ext)
          setTruncated(Boolean(result.truncated))
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Transcript read failed')
      })
    return () => {
      cancelled = true
    }
  }, [transport, session.transcriptPath])

  if (error && liveSession) {
    return (
      <div className="inspector-stack">
        <div className="muted">
          This is the live PTY diagnostic recording for the active session, not the native chat feed. It can grow quickly because it captures terminal repaint/control output.
        </div>
        <div className="error-text">{error}</div>
      </div>
    )
  }
  if (error) return <div className="error-text">{error}</div>
  if (!content) return <div className="muted">Loading transcript...</div>
  if (!isJsonlTranscript) {
    return (
      <DiagnosticTranscriptPreview
        content={diagnosticText}
        compact={compact}
        truncated={truncated}
        artifacts={artifactResult.artifacts}
        rejectedCount={artifactResult.rejectedCount}
        onOpenArtifact={onOpenArtifact}
      />
    )
  }

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
      <TranscriptArtifactList artifacts={artifactResult.artifacts} rejectedCount={artifactResult.rejectedCount} onOpenArtifact={onOpenArtifact} />
      <details className="transcript-raw-details">
        <summary>Raw transcript</summary>
        <pre className={`transcript-preview ${compact ? 'transcript-preview--compact' : ''}`}>{content}</pre>
      </details>
    </div>
  )
}

function DiagnosticTranscriptPreview({
  content,
  compact,
  truncated,
  artifacts,
  rejectedCount,
  onOpenArtifact
}: {
  content: string
  compact: boolean
  truncated: boolean
  artifacts: TranscriptArtifactSuggestion[]
  rejectedCount: number
  onOpenArtifact?: (path: string) => void
}): JSX.Element {
  return (
    <div className={`transcript-timeline ${compact ? 'transcript-timeline--compact' : ''}`}>
      <div className="muted">
        PTY diagnostic transcript tail. Native chat history is rendered from the live conversation feed; this view is raw terminal output for debugging unsupported states.
        {truncated ? ' Showing the latest 256KB.' : ''}
      </div>
      <TranscriptArtifactList artifacts={artifacts} rejectedCount={rejectedCount} onOpenArtifact={onOpenArtifact} />
      <pre className={`transcript-preview ${compact ? 'transcript-preview--compact' : ''}`}>{content}</pre>
    </div>
  )
}

function TranscriptArtifactList({
  artifacts,
  rejectedCount,
  onOpenArtifact
}: {
  artifacts: TranscriptArtifactSuggestion[]
  rejectedCount: number
  onOpenArtifact?: (path: string) => void
}): JSX.Element | null {
  if (!artifacts.length && !rejectedCount) return null

  return (
    <section className="transcript-artifacts" aria-label="Transcript artifacts">
      <header>
        <strong>Referenced artifacts</strong>
        <span>{artifacts.length} available{rejectedCount ? ` · ${rejectedCount} outside scope or unavailable` : ''}</span>
      </header>
      {artifacts.length ? (
        <div className="transcript-artifact-list">
          {artifacts.map((artifact) => (
            <button
              key={artifact.path}
              className="transcript-artifact"
              type="button"
              onClick={() => onOpenArtifact?.(artifact.path)}
              disabled={!onOpenArtifact}
              title={artifact.path}
            >
              <span>{artifact.path.split('/').pop()}</span>
              <code>{artifact.kind}{artifact.exists ? '' : ' · missing'}</code>
            </button>
          ))}
        </div>
      ) : <p className="muted">No previewable artifact paths were found inside the selected workspace.</p>}
    </section>
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

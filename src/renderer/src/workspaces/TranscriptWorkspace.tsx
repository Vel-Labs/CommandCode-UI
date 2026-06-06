import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { FileText, RotateCcw } from 'lucide-react'
import type { DiscoveredSession } from '../../../core/types'
import type { TransportAPI } from '../../../core/transport'
import type { WorkEvent } from '../appTypes'

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
  return (
    <section className="transcript-workspace" aria-label="Transcript">
      <header className="transcript-header">
        <div>
          <div className="transcript-eyebrow">Recent context</div>
          <h1>{session.title || session.id}</h1>
          <div className="transcript-meta">{session.id} · {new Date(session.timestamp).toLocaleString()}</div>
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
    <pre className={`transcript-preview ${compact ? 'transcript-preview--compact' : ''}`}>
      {content}
    </pre>
  )
}

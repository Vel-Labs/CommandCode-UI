import type { JSX } from 'react'
import { FileText, RotateCcw } from 'lucide-react'
import type { DiscoveredSession } from '../../../core/types'
import type { TransportAPI } from '../../../core/transport'
import type { WorkEvent } from '../appTypes'
import { resolveSessionModelIdentity } from '../services/sessionModelIdentity'
import { TranscriptPreview } from '../components/TranscriptPreview'

export function TranscriptWorkspace({
  session,
  transport,
  cwd,
  statusLine,
  resumeFailure,
  workEvents,
  onResume,
  onReveal,
  onOpenTranscript,
  onOpenArtifact
}: {
  session: DiscoveredSession
  transport: TransportAPI
  cwd: string
  statusLine: string
  resumeFailure: string
  workEvents: WorkEvent[]
  onResume: () => void
  onReveal: () => void
  onOpenTranscript: () => void
  onOpenArtifact: (path: string) => void
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
      <div className="resume-receipt-grid" aria-label="Resume receipt">
        <ResumeReceiptItem label="Source file" value={session.transcriptPath} mono />
        <ResumeReceiptItem label="Session id" value={session.id} mono />
        <ResumeReceiptItem label="Project" value={session.cwd || cwd || 'Current selected project'} mono />
        <ResumeReceiptItem label="Model" value={modelIdentity.label} />
        <ResumeReceiptItem label="Timestamp" value={new Date(session.timestamp).toLocaleString()} />
        <ResumeReceiptItem label="Latest result" value={resumeFailure ? `Failed: ${resumeFailure}` : statusLine || 'Ready to resume'} tone={resumeFailure ? 'warn' : 'default'} />
      </div>
      <div className="work-evidence-list">
        {(workEvents.length ? workEvents : [{ id: 'empty', label: 'Context loaded', detail: statusLine || 'Ready to inspect or resume this session.' }]).map((event) => (
          <div key={event.id} className={`work-evidence work-evidence--${event.tone || 'default'}`}>
            <strong>{event.label}</strong>
            <span>{event.detail}</span>
          </div>
        ))}
      </div>
      <div className="transcript-inline-preview">
        <TranscriptPreview transport={transport} session={session} cwd={session.cwd || cwd} onOpenArtifact={onOpenArtifact} compact />
      </div>
    </section>
  )
}

function ResumeReceiptItem({ label, value, mono = false, tone = 'default' }: { label: string; value: string; mono?: boolean; tone?: 'default' | 'warn' }): JSX.Element {
  return (
    <div className={`resume-receipt-item resume-receipt-item--${tone}`}>
      <span>{label}</span>
      <strong className={mono ? 'resume-receipt-mono' : ''}>{value}</strong>
    </div>
  )
}

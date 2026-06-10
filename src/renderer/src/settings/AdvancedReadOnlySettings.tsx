import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import type { DiscoveredSession, ProjectCommandCodeReference } from '../../../core/types'
import { workbenchActionsByCategory } from '../workbench/workbenchActions'
import { SettingsReadOnlyCard } from './SettingsReadOnlyCard'

export function ProjectStateSettings({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
  const [reference, setReference] = useState<ProjectCommandCodeReference | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setReference((await transport.projectCommandCodeReference(cwd)).reference)
    } catch {
      setReference(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [cwd])

  return (
    <>
      <SettingsReadOnlyCard title="Project state" loading={loading} onRefresh={load}>
        <p className="settings-muted">Read-only view of project `.commandcode` paths and user-level runtime context roots.</p>
        {reference && (
          <>
            <div className="reference-path-grid">
              <div><span>Project</span><code>{reference.projectPath}</code></div>
              <div><span>Repo state</span><code>{reference.projectCommandCodePath}</code></div>
              <div><span>Runtime contexts</span><code>{reference.userProjectContextPath}</code></div>
            </div>
            {reference.sections.map((section) => (
              <div key={section.key} className="reference-section">
                <div className="reference-section-head">
                  <div>
                    <strong>{section.label}</strong>
                    <span>{section.description}</span>
                  </div>
                  <span className={`reference-badge ${section.exists ? 'reference-badge--on' : ''}`}>
                    {section.exists ? `${section.files.length} files` : 'not present'}
                  </span>
                </div>
                <code className="reference-path">{section.path}</code>
              </div>
            ))}
          </>
        )}
      </SettingsReadOnlyCard>
      <SettingsReadOnlyCard title="Data controls gate" loading={loading} onRefresh={load}>
        <p className="settings-muted">Read-only control map. Delete, reset, export, import, and cache-clearing actions stay blocked until scoped routes and path validation tests exist.</p>
        <DataGateRow action="Transcript deletion" status="Blocked" detail="Requires approved transcript roots, affected-file count, confirmation, and post-delete validation." />
        <DataGateRow action="Cache clearing" status="Blocked" detail="Requires GUI-owned cache inventory and a route that cannot touch Command Code runtime state." />
        <DataGateRow action="Preference reset" status="Blocked" detail="Requires app/project scope selection and exact preference path preview before write or delete." />
        <DataGateRow action="Data export" status="Planned" detail="Requires explicit output path selection and manifest of included GUI-owned data." />
        <DataGateRow action="Data import" status="Planned" detail="Requires schema validation, destination preview, and rollback/cancel affordance before writes." />
      </SettingsReadOnlyCard>
      <WorkbenchPolishGateCard loading={loading} onRefresh={load} />
    </>
  )
}

function WorkbenchPolishGateCard({ loading, onRefresh }: { loading: boolean; onRefresh: () => Promise<void> }): JSX.Element {
  const groups = workbenchActionsByCategory()
  return (
    <SettingsReadOnlyCard title="Workbench polish gate" loading={loading} onRefresh={onRefresh}>
      <p className="settings-muted">Preview-only map for Phase 9 workbench actions. File, IDE, git, terminal lifecycle, theme token, and release-fetching changes remain gated by `docs/reports/WORKBENCH_POLISH_GATE.md`.</p>
      {Object.entries(groups).map(([category, actions]) => (
        <div key={category} className="settings-workbench-gate-group">
          <strong>{category}</strong>
          {actions.map((action) => (
            <DataGateRow
              key={action.id}
              action={action.title}
              status={formatWorkbenchStatus(action.status)}
              detail={`${action.summary} Proof required: ${action.requiredProof.join(', ')}.`}
            />
          ))}
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

function formatWorkbenchStatus(status: string): string {
  if (status === 'implemented-read-only') return 'Implemented read-only'
  if (status === 'gated-preview-only') return 'Gated preview-only'
  return 'Blocked'
}

function DataGateRow({ action, status, detail }: { action: string; status: string; detail: string }): JSX.Element {
  return (
    <div className="settings-data-gate-row">
      <strong>{action}</strong>
      <span>{status}</span>
      <p>{detail}</p>
    </div>
  )
}

export function SessionsSettingsReadOnly({
  transport,
  cwd,
  onResumeSession
}: {
  transport: TransportAPI
  cwd: string
  onResumeSession: (session: DiscoveredSession) => Promise<void>
}): JSX.Element {
  const [sessions, setSessions] = useState<DiscoveredSession[]>([])
  const [loading, setLoading] = useState(false)
  const [revealFallback, setRevealFallback] = useState('')

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setSessions((await transport.discoverSessions(cwd || undefined)).sessions)
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [cwd])

  async function revealTranscript(transcriptPath: string): Promise<void> {
    const result = await transport.revealTranscript(transcriptPath)
    if (result.ok) {
      setRevealFallback('')
      return
    }
    try {
      await navigator.clipboard?.writeText(result.path)
      setRevealFallback(`${result.message || 'Native reveal is not available in this shell'} Path copied: ${result.path}`)
    } catch {
      setRevealFallback(`${result.message || 'Native reveal is not available in this shell'} Transcript path: ${result.path}`)
    }
  }

  return (
    <SettingsReadOnlyCard title={`Discovered sessions (${sessions.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Session discovery uses Command Code transcript stores. Resume starts a new Command Code session with the selected project transcript; Reveal opens the transcript path through the existing adapter file-access bridge when native reveal is available.</p>
      {revealFallback && <div className="settings-warning">{revealFallback}</div>}
      {sessions.map((session) => (
        <div key={session.id} className="settings-readonly-row">
          <strong>{session.title || session.id}</strong>
          <span>{session.source || 'global'} - {formatSessionTime(session.timestamp)} - {(session.sizeBytes / 1024).toFixed(1)}KB</span>
          <code className="settings-readonly-path">{session.transcriptPath}</code>
          <div className="settings-inline-actions">
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => void onResumeSession(session)} disabled={session.source !== 'project'}>Resume</button>
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => void revealTranscript(session.transcriptPath)}>Reveal</button>
          </div>
        </div>
      ))}
      {!sessions.length && !loading && <p className="settings-muted">No sessions discovered for the current project context.</p>}
    </SettingsReadOnlyCard>
  )
}

function formatSessionTime(value: string): string {
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return value
  return time.toLocaleString()
}

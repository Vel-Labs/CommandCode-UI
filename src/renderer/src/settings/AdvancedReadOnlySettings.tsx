import { useEffect, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { buildMcpActionPreview } from '../../../core/mcpCommands'
import { mcpPolicyReferences, mcpScopeReferences } from '../../../core/mcpReference'
import type { TransportAPI } from '../../../core/transport'
import type { AgentConfig, DiscoveredSession, ProjectCommandCodeReference } from '../../../core/types'
import { AgentHelper } from '../workflows/AgentHelper'

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
    </>
  )
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

  return (
    <SettingsReadOnlyCard title={`Discovered sessions (${sessions.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Session discovery uses Command Code transcript stores. Resume starts a new Command Code session with the selected project transcript; Reveal opens the transcript path through the existing adapter file-access bridge.</p>
      {sessions.map((session) => (
        <div key={session.id} className="settings-readonly-row">
          <strong>{session.title || session.id}</strong>
          <span>{session.source || 'global'} - {formatSessionTime(session.timestamp)} - {(session.sizeBytes / 1024).toFixed(1)}KB</span>
          <code className="settings-readonly-path">{session.transcriptPath}</code>
          <div className="settings-inline-actions">
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => void onResumeSession(session)} disabled={session.source !== 'project'}>Resume</button>
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => void transport.revealTranscript(session.transcriptPath)}>Reveal</button>
          </div>
        </div>
      ))}
      {!sessions.length && !loading && <p className="settings-muted">No sessions discovered for the current project context.</p>}
    </SettingsReadOnlyCard>
  )
}

export function McpSettingsReadOnly({ transport, commandExecutable }: { transport: TransportAPI; commandExecutable: string }): JSX.Element {
  const [servers, setServers] = useState<Array<{ name: string; status: string; toolCount?: number; raw: string }>>([])
  const [loading, setLoading] = useState(false)
  const [actionResult, setActionResult] = useState('')

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setServers((await transport.listMcp(commandExecutable || undefined)).servers)
    } catch {
      setServers([])
    } finally {
      setLoading(false)
    }
  }

  const runMcpAction = async (action: 'connect' | 'disconnect', serverName: string): Promise<void> => {
    setActionResult(`${action === 'connect' ? 'Connecting' : 'Disconnecting'} ${serverName}...`)
    try {
      const result = await transport.mcpAction(commandExecutable || undefined, action, serverName)
      const output = (result.stdout || result.stderr || result.error || '').trim()
      setActionResult(`${serverName}: ${result.ok ? 'ok' : 'failed'}${output ? ` - ${output}` : ''}`)
      await load()
    } catch (error) {
      setActionResult(`${serverName}: ${error instanceof Error ? error.message : 'MCP action failed'}`)
    }
  }

  useEffect(() => { void load() }, [commandExecutable])

  return (
    <SettingsReadOnlyCard title={`MCP servers (${servers.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">MCP remains Command Code-owned. Connect and disconnect run the previewed `cmd mcp ...` command; add, remove, and auth actions remain gated.</p>
      <div className="settings-reference-grid settings-reference-grid--compact">
        {mcpScopeReferences.map((scope) => (
          <div key={scope.id} className="settings-reference-tile">
            <strong>{scope.label}</strong>
            <code>{scope.configPath}</code>
            <span>{scope.description}</span>
          </div>
        ))}
      </div>
      <div className="settings-reference-grid settings-reference-grid--compact">
        {mcpPolicyReferences.map((policy) => (
          <div key={policy.id} className="settings-reference-tile">
            <strong>{policy.label}</strong>
            <span>{policy.description}</span>
          </div>
        ))}
      </div>
      {actionResult && <p className="settings-muted">{actionResult}</p>}
      {servers.map((server) => (
        <div key={server.name} className="settings-readonly-row">
          <strong>{server.name}</strong>
          <span>{server.status}{server.toolCount != null ? ` · ${server.toolCount} tools` : ''}</span>
          <div className="settings-command-preview">
            <span>Connect preview</span>
            <code>{buildMcpActionPreview(commandExecutable, 'connect', server.name)}</code>
          </div>
          <div className="settings-command-preview">
            <span>Disconnect preview</span>
            <code>{buildMcpActionPreview(commandExecutable, 'disconnect', server.name)}</code>
          </div>
          <div className="settings-inline-actions">
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => void runMcpAction('connect', server.name)} disabled={server.status === 'connected'}>Connect</button>
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => void runMcpAction('disconnect', server.name)} disabled={server.status !== 'connected'}>Disconnect</button>
          </div>
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

export function AgentsSettingsReadOnly({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [editing, setEditing] = useState<string | undefined>()
  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setAgents((await transport.listAgents(cwd || undefined)).agents)
    } catch {
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (agent: AgentConfig): void => {
    setEditing(agent.path)
    setContent(agent.rawContent)
    setSaveStatus('')
  }

  const saveAgent = async (agentPath: string): Promise<void> => {
    setSaveStatus(`Saving ${agentPath}...`)
    try {
      const result = await transport.saveAgent(agentPath, content, cwd)
      if (result.ok) {
        setSaveStatus(`Saved ${agentPath}`)
        setEditing(undefined)
        await load()
      } else {
        setSaveStatus(result.error || 'Agent save failed')
      }
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Agent save failed')
    }
  }

  useEffect(() => { void load() }, [cwd])

  return (
    <SettingsReadOnlyCard title={`Agent configs (${agents.length})`} loading={loading} onRefresh={load}>
      <AgentHelper cwd={cwd} />
      <p className="settings-muted">Agent edits use the existing project-scoped save route. Destination paths stay visible and server validation keeps writes under the selected project `.commandcode/agents/` root.</p>
      {saveStatus && <p className="settings-muted">{saveStatus}</p>}
      {agents.map((agent) => (
        <div key={agent.path} className="settings-readonly-row">
          <strong>{agent.name}</strong>
          <span>{agent.description || agent.path}</span>
          <code className="settings-readonly-path">{agent.path}</code>
          <span className="settings-destination-note">Scope: {agent.scope === 'project' ? 'project editable' : 'user read-only'}</span>
          <div className="settings-inline-actions">
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => startEditing(agent)} disabled={agent.scope !== 'project'}>Edit</button>
          </div>
          {editing === agent.path && (
            <div className="settings-editor-block">
              <div className="settings-destination-note">
                <span>Project agent destination</span>
                <code>{agent.path}</code>
                <small>validated by server</small>
              </div>
              <textarea className="settings-editor-textarea" value={content} onChange={(event) => setContent(event.target.value)} rows={12} />
              <div className="settings-inline-actions">
                <button className="primary-button settings-inline-action" onClick={() => void saveAgent(agent.path)}>Save</button>
                <button className="ghost-button native-ghost settings-inline-action" onClick={() => setEditing(undefined)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

export function SkillsSettingsReadOnly({ transport }: { transport: TransportAPI }): JSX.Element {
  const [skills, setSkills] = useState<Array<{ path: string; name: string; description?: string; content?: string }>>([])
  const [expanded, setExpanded] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setSkills((await transport.listSkills()).skills)
    } catch {
      setSkills([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <SettingsReadOnlyCard title={`Skills (${skills.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Read-only skill discovery. Insert/use actions remain planned until command previews are added.</p>
      {skills.map((skill) => (
        <div key={skill.path} className="settings-readonly-row">
          <button
            className="settings-readonly-toggle"
            onClick={() => setExpanded(expanded === skill.path ? undefined : skill.path)}
          >
            <strong>{skill.name}</strong>
            <span>{skill.description || skill.path}</span>
          </button>
          {expanded === skill.path && (
            <pre className="settings-preview-block">{skill.content || 'No skill content available.'}</pre>
          )}
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

export function MemorySettingsReadOnly({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
  const [memories, setMemories] = useState<Array<{ path: string; name: string; content: string }>>([])
  const [editing, setEditing] = useState<string | undefined>()
  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setMemories((await transport.listMemories(cwd || undefined)).memories)
    } catch {
      setMemories([])
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (memory: { path: string; content: string }): void => {
    setEditing(memory.path)
    setContent(memory.content)
    setSaveStatus(undefined)
  }

  const saveMemory = async (filePath: string): Promise<void> => {
    setSaveStatus('Saving...')
    try {
      await transport.saveMemory(filePath, content, cwd)
      setEditing(undefined)
      setContent('')
      setSaveStatus('Saved memory file.')
      await load()
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Failed to save memory file.')
    }
  }

  useEffect(() => { void load() }, [cwd])

  return (
    <SettingsReadOnlyCard title={`Memory files (${memories.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Project-scoped memory discovery and editing through the existing memory save route. Command Code remains the source of memory semantics.</p>
      {saveStatus && <p className="settings-muted">{saveStatus}</p>}
      {memories.map((memory) => (
        <div key={memory.path} className="settings-readonly-row">
          <button
            className="settings-readonly-toggle"
            onClick={() => startEditing(memory)}
          >
            <strong>{memory.name}</strong>
            <span>{memory.path}</span>
          </button>
          {editing === memory.path && (
            <div className="settings-editor-block">
              <span className="settings-destination-note">Destination: {memory.path}</span>
              <textarea
                className="settings-editor-textarea"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={10}
              />
              <div className="agent-editor-actions">
                <button className="primary-button" onClick={() => { void saveMemory(memory.path) }}>Save memory</button>
                <button className="ghost-button" onClick={() => {
                  setEditing(undefined)
                  setContent('')
                  setSaveStatus(undefined)
                }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

export function TasteSettingsReadOnly({ transport }: { transport: TransportAPI }): JSX.Element {
  const [packages, setPackages] = useState<Array<{ path: string; name: string; categories: Array<{ name: string; confidence: number; learnings: string[] }> }>>([])
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setPackages((await transport.listTaste()).packages)
    } catch {
      setPackages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <SettingsReadOnlyCard title={`Taste packages (${packages.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Read-only taste profile discovery. Taste learning internals remain Command Code-owned.</p>
      {packages.map((pkg) => (
        <div key={pkg.path} className="settings-readonly-row">
          <strong>{pkg.name}</strong>
          <span>{pkg.categories.length} categories</span>
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

function SettingsReadOnlyCard({
  title,
  loading,
  onRefresh,
  children
}: {
  title: string
  loading: boolean
  onRefresh: () => Promise<void>
  children: ReactNode
}): JSX.Element {
  return (
    <div className="settings-card settings-card--wide">
      <div className="settings-readonly-header">
        <strong>{title}</strong>
        <button className="ghost-button native-ghost" onClick={() => void onRefresh()} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>
      {children}
    </div>
  )
}

function formatSessionTime(value: string): string {
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return value
  return time.toLocaleString()
}

import { useEffect, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { TransportAPI } from '../../../core/transport'
import type { DiscoveredSession, ProjectCommandCodeReference } from '../../../core/types'

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
  )
}

export function SessionsSettingsReadOnly({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
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
      <p className="settings-muted">Read-only session discovery. Resume and reveal actions remain in Advanced until session lifecycle and file-access replacement paths are validated.</p>
      {sessions.map((session) => (
        <div key={session.id} className="settings-readonly-row">
          <strong>{session.title || session.id}</strong>
          <span>{session.source || 'global'} - {formatSessionTime(session.timestamp)} - {(session.sizeBytes / 1024).toFixed(1)}KB</span>
          <code className="settings-readonly-path">{session.transcriptPath}</code>
        </div>
      ))}
      {!sessions.length && !loading && <p className="settings-muted">No sessions discovered for the current project context.</p>}
    </SettingsReadOnlyCard>
  )
}

export function McpSettingsReadOnly({ transport, commandExecutable }: { transport: TransportAPI; commandExecutable: string }): JSX.Element {
  const [servers, setServers] = useState<Array<{ name: string; status: string; toolCount?: number; raw: string }>>([])
  const [loading, setLoading] = useState(false)

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

  useEffect(() => { void load() }, [commandExecutable])

  return (
    <SettingsReadOnlyCard title={`MCP servers (${servers.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Read-only `cmd mcp list` view. Connect, disconnect, add, remove, and auth actions remain in Advanced until scopes and confirmation flows are implemented.</p>
      {servers.map((server) => (
        <div key={server.name} className="settings-readonly-row">
          <strong>{server.name}</strong>
          <span>{server.status}{server.toolCount != null ? ` · ${server.toolCount} tools` : ''}</span>
          <div className="settings-command-preview">
            <span>Connect preview</span>
            <code>{mcpCommandPreview(commandExecutable, 'connect', server.name)}</code>
          </div>
          <div className="settings-command-preview">
            <span>Disconnect preview</span>
            <code>{mcpCommandPreview(commandExecutable, 'disconnect', server.name)}</code>
          </div>
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

export function AgentsSettingsReadOnly({ transport }: { transport: TransportAPI }): JSX.Element {
  const [agents, setAgents] = useState<Array<{ path: string; name: string; description?: string }>>([])
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setAgents((await transport.listAgents()).agents)
    } catch {
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <SettingsReadOnlyCard title={`Agent configs (${agents.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Read-only agent discovery. Editing remains in Advanced until destination scope and validation are surfaced in Settings.</p>
      {agents.map((agent) => (
        <div key={agent.path} className="settings-readonly-row">
          <strong>{agent.name}</strong>
          <span>{agent.description || agent.path}</span>
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

  useEffect(() => { void load() }, [cwd])

  return (
    <SettingsReadOnlyCard title={`Memory files (${memories.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Read-only memory discovery. Editing remains in Advanced until ownership and destination paths are explicit in Settings.</p>
      {memories.map((memory) => (
        <div key={memory.path} className="settings-readonly-row">
          <strong>{memory.name}</strong>
          <span>{memory.path}</span>
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

function mcpCommandPreview(commandExecutable: string, action: 'connect' | 'disconnect', serverName: string): string {
  return [commandExecutable || 'cmd', 'mcp', action, serverName].map(shellWord).join(' ')
}

function shellWord(value: string): string {
  if (/^[A-Za-z0-9_./:@-]+$/.test(value)) return value
  return `'${value.replace(/'/g, "'\\''")}'`
}

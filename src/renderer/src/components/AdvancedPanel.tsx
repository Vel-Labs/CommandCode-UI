import { useState, useEffect } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import type { DiscoveredSession, ProjectCommandCodeReference } from '../../../core/types'

type AdvancedPanelProps = {
  transport: TransportAPI
  commandExecutable: string
  cwd: string
  onResumeSession: (session: DiscoveredSession) => Promise<void>
  visible: boolean
  onClose: () => void
}

type Tab = 'reference' | 'sessions' | 'usage' | 'taste' | 'agents' | 'mcp' | 'skills' | 'memory'

const TABS: { id: Tab; label: string }[] = [
  { id: 'reference', label: 'Project state' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'usage', label: 'Usage' },
  { id: 'taste', label: 'Taste' },
  { id: 'agents', label: 'Agents' },
  { id: 'mcp', label: 'MCP' },
  { id: 'skills', label: 'Skills' },
  { id: 'memory', label: 'Memory' }
]

export function AdvancedPanel({ transport, commandExecutable, cwd, onResumeSession, visible, onClose }: AdvancedPanelProps): JSX.Element | null {
  const [tab, setTab] = useState<Tab>('reference')

  if (!visible) return null

  return (
    <div className="advanced-overlay">
      <div className="advanced-panel">
        <div className="advanced-header">
          <div className="advanced-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`advanced-tab ${t.id === tab ? 'advanced-tab--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="ghost-button advanced-close" onClick={onClose}>×</button>
        </div>
        <div className="advanced-body">
          {tab === 'reference' && <ProjectStateReference transport={transport} cwd={cwd} />}
          {tab === 'sessions' && <SessionDiscovery transport={transport} cwd={cwd} onResumeSession={onResumeSession} />}
          {tab === 'usage' && <UsageDashboard transport={transport} commandExecutable={commandExecutable} cwd={cwd} />}
          {tab === 'taste' && <TasteBrowser transport={transport} />}
          {tab === 'agents' && <AgentEditor transport={transport} cwd={cwd} />}
          {tab === 'mcp' && <McpPanel transport={transport} commandExecutable={commandExecutable} />}
          {tab === 'skills' && <SkillsBrowser transport={transport} />}
          {tab === 'memory' && <MemoryEditor transport={transport} cwd={cwd} />}
        </div>
      </div>
    </div>
  )
}

function ProjectStateReference({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
  const [reference, setReference] = useState<ProjectCommandCodeReference | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
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
    <div className="advanced-section">
      <div className="advanced-section-header">
        <span>.commandcode reference</span>
        <button className="ghost-button" onClick={() => void load()} disabled={loading}>{loading ? 'Scanning...' : 'Refresh'}</button>
      </div>
      <p className="reference-note">
        Repo-local `.commandcode` files are project commands, skills, taste, memory, and GUI preferences. Chat contexts live in the user-level Command Code project store and are resumed through `cmd --resume`, not edited directly.
      </p>
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
              {section.files.slice(0, 8).map((file) => (
                <div key={file.path} className="reference-file">
                  <span>{file.name}</span>
                  <small>{(file.sizeBytes / 1024).toFixed(1)}KB</small>
                </div>
              ))}
              {section.files.length > 8 && <div className="reference-more">+{section.files.length - 8} more</div>}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function SessionDiscovery({ transport, cwd, onResumeSession }: { transport: TransportAPI; cwd: string; onResumeSession: (session: DiscoveredSession) => Promise<void> }): JSX.Element {
  const [sessions, setSessions] = useState<DiscoveredSession[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const result = await transport.discoverSessions(cwd)
      setSessions(result.sessions)
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="advanced-section">
      <div className="advanced-section-header">
        <span>Discovered sessions ({sessions.length})</span>
        <button className="ghost-button" onClick={load} disabled={loading}>{loading ? 'Scanning…' : 'Refresh'}</button>
      </div>
      {sessions.map((s) => (
        <div key={s.id} className="discovery-row">
          <div>
            <div className="discovery-name">{s.title || s.id}</div>
            <div className="discovery-meta">{s.source || 'global'} · {new Date(s.timestamp).toLocaleString()} · {(s.sizeBytes / 1024).toFixed(1)}KB</div>
          </div>
          <div className="discovery-actions">
            <button className="ghost-button" onClick={() => void onResumeSession(s)} disabled={s.source !== 'project'}>
              Resume
            </button>
            <button className="ghost-button" onClick={() => transport.revealTranscript(s.transcriptPath)}>
              Reveal
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function UsageDashboard({ transport, commandExecutable, cwd }: { transport: TransportAPI; commandExecutable: string; cwd: string }): JSX.Element {
  const [data, setData] = useState<{ totalTokens: number; totalCost: number; totalRuns: number; raw: string; parsed: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setData(await transport.usage(commandExecutable || undefined, cwd || undefined))
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="advanced-section">
      <div className="advanced-section-header">
        <span>Usage summary</span>
        <button className="ghost-button" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {data && (
        <>
          <div className="usage-grid">
            <div className="usage-stat">
              <div className="usage-value">{data.totalTokens.toLocaleString()}</div>
              <div className="usage-label">Total Tokens</div>
            </div>
            <div className="usage-stat">
              <div className="usage-value">${data.totalCost.toFixed(2)}</div>
              <div className="usage-label">Total Cost</div>
            </div>
            <div className="usage-stat">
              <div className="usage-value">{data.totalRuns.toLocaleString()}</div>
              <div className="usage-label">Total Runs</div>
            </div>
          </div>
          <pre className="advanced-raw">{data.raw}</pre>
        </>
      )}
      {!data && !loading && <div className="muted">Click Refresh to load usage data.</div>}
    </div>
  )
}

function TasteBrowser({ transport }: { transport: TransportAPI }): JSX.Element {
  const [packages, setPackages] = useState<Array<{
    path: string
    name: string
    categories: Array<{ name: string; confidence: number; learnings: string[] }>
  }>>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const result = await transport.listTaste()
      setPackages(result.packages)
    } catch {
      setPackages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="advanced-section">
      <div className="advanced-section-header">
        <span>Taste packages ({packages.length})</span>
        <button className="ghost-button" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {packages.map((pkg) => (
        <div key={pkg.name} className="taste-package">
          <div className="taste-pkg-name">{pkg.name}</div>
          {pkg.categories.map((cat) => (
            <div key={cat.name} className="taste-category">
              <div className="taste-cat-header">
                <span className="taste-cat-name">{cat.name}</span>
                <span className="taste-cat-conf">{(cat.confidence * 100).toFixed(0)}%</span>
              </div>
              {cat.learnings.slice(0, 3).map((l, i) => (
                <div key={i} className="taste-learning">• {l}</div>
              ))}
              {cat.learnings.length > 3 && (
                <div className="taste-learning taste-more">+{cat.learnings.length - 3} more</div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function AgentEditor({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
  const [agents, setAgents] = useState<Array<{
    path: string
    name: string
    rawContent: string
    scope?: 'project' | 'user'
    description?: string
  }>>([])
  const [editing, setEditing] = useState<string | undefined>()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setAgents((await transport.listAgents(cwd || undefined)).agents)
    } catch {
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const save = async (agentPath: string) => {
    try {
      await transport.saveAgent(agentPath, content, cwd)
      setEditing(undefined)
      load()
    } catch { /* show error? */ }
  }

  useEffect(() => { load() }, [cwd])

  return (
    <div className="advanced-section">
      <div className="advanced-section-header">
        <span>Agent configs ({agents.length})</span>
        <button className="ghost-button" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {agents.map((agent) => (
        <div key={agent.path} className="agent-entry">
          <div className="agent-header">
            <span className="agent-name">{agent.name}</span>
            {agent.description && <span className="agent-desc">{agent.description}</span>}
            <span className="agent-desc">{agent.scope === 'project' ? 'project editable' : 'user read-only'}</span>
            <button className="ghost-button" onClick={() => {
              setEditing(agent.path)
              setContent(agent.rawContent)
            }} disabled={agent.scope !== 'project'}>Edit</button>
          </div>
          {editing === agent.path && (
            <div className="agent-editor">
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} />
              <div className="agent-editor-actions">
                <button className="primary-button" onClick={() => save(agent.path)}>Save</button>
                <button className="ghost-button" onClick={() => setEditing(undefined)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function McpPanel({ transport, commandExecutable }: { transport: TransportAPI; commandExecutable: string }): JSX.Element {
  const [servers, setServers] = useState<Array<{
    name: string
    status: string
    toolCount?: number
    raw: string
  }>>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setServers((await transport.listMcp(commandExecutable || undefined)).servers)
    } catch {
      setServers([])
    } finally {
      setLoading(false)
    }
  }

  const doAction = async (action: 'connect' | 'disconnect', serverName: string) => {
    try {
      await transport.mcpAction(commandExecutable || undefined, action, serverName)
      load()
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="advanced-section">
      <div className="advanced-section-header">
        <span>MCP servers ({servers.length})</span>
        <button className="ghost-button" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {servers.map((s) => (
        <div key={s.name} className="mcp-entry">
          <div className="mcp-header">
            <span className="mcp-name">{s.name}</span>
            <span className={`mcp-status mcp-status--${s.status}`}>{s.status}</span>
            {s.toolCount != null && <span className="mcp-tools">{s.toolCount} tools</span>}
          </div>
          <div className="mcp-actions">
            <button className="ghost-button" onClick={() => doAction('connect', s.name)} disabled={s.status === 'connected'}>
              Connect
            </button>
            <button className="ghost-button" onClick={() => doAction('disconnect', s.name)} disabled={s.status !== 'connected'}>
              Disconnect
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillsBrowser({ transport }: { transport: TransportAPI }): JSX.Element {
  const [skills, setSkills] = useState<Array<{
    path: string
    name: string
    content: string
    description?: string
  }>>([])
  const [expanded, setExpanded] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setSkills((await transport.listSkills()).skills)
    } catch {
      setSkills([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="advanced-section">
      <div className="advanced-section-header">
        <span>Skills ({skills.length})</span>
        <button className="ghost-button" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {skills.map((s) => (
        <div key={s.name} className="skill-entry">
          <div className="skill-header" onClick={() => setExpanded(expanded === s.name ? undefined : s.name)}>
            <span className="skill-name">{s.name}</span>
            {s.description && <span className="skill-desc">{s.description}</span>}
          </div>
          {expanded === s.name && (
            <pre className="skill-content">{s.content}</pre>
          )}
        </div>
      ))}
    </div>
  )
}

function MemoryEditor({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
  const [memories, setMemories] = useState<Array<{
    path: string
    content: string
    name: string
  }>>([])
  const [editing, setEditing] = useState<string | undefined>()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setMemories((await transport.listMemories(cwd || undefined)).memories)
    } catch {
      setMemories([])
    } finally {
      setLoading(false)
    }
  }

  const save = async (filePath: string) => {
    try {
      await transport.saveMemory(filePath, content, cwd)
      setEditing(undefined)
      load()
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="advanced-section">
      <div className="advanced-section-header">
        <span>Memory files ({memories.length})</span>
        <button className="ghost-button" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {memories.map((m) => (
        <div key={m.name} className="memory-entry">
          <div className="memory-header">
            <span className="memory-name">{m.name}</span>
            <button className="ghost-button" onClick={() => {
              setEditing(m.path)
              setContent(m.content)
            }}>Edit</button>
          </div>
          {editing === m.path && (
            <div className="memory-editor">
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} />
              <div className="agent-editor-actions">
                <button className="primary-button" onClick={() => save(m.path)}>Save</button>
                <button className="ghost-button" onClick={() => setEditing(undefined)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

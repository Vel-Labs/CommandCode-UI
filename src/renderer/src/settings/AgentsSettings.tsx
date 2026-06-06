import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import type { AgentConfig } from '../../../core/types'
import { AgentHelper } from '../workflows/AgentHelper'
import { SettingsReadOnlyCard } from './SettingsReadOnlyCard'

export function AgentsSettingsReadOnly({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [expanded, setExpanded] = useState<string | undefined>()
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
          <button
            className="settings-readonly-toggle"
            onClick={() => setExpanded(expanded === agent.path ? undefined : agent.path)}
          >
            <strong>{agent.name}</strong>
            <span>{agent.description || agent.path}</span>
          </button>
          <code className="settings-readonly-path">{agent.path}</code>
          <span className="settings-destination-note">Scope: {agent.scope === 'project' ? 'project editable' : 'user read-only'}</span>
          <div className="settings-inline-actions">
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => startEditing(agent)} disabled={agent.scope !== 'project'}>Edit</button>
          </div>
          {expanded === agent.path && editing !== agent.path && (
            <>
              <div className="settings-command-preview">
                <span>Destination</span>
                <code>{agent.path}</code>
              </div>
              <pre className="settings-preview-block">{agentPreview(agent.rawContent)}</pre>
            </>
          )}
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

function agentPreview(value: string): string {
  const lines = value.trim() ? value.trim().split('\n') : ['No agent content available.']
  const preview = lines.slice(0, 16).join('\n')
  return lines.length > 16 ? `${preview}\n... ${lines.length - 16} more lines` : preview
}

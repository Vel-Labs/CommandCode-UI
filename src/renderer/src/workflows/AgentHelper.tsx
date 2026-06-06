import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { agentTemplates, buildAgentDraftPreview } from './agentDraft'
import type { AgentTemplateId } from './agentDraft'

export function AgentHelper({
  cwd,
  existingAgentPaths,
  creating,
  onCreate
}: {
  cwd: string
  existingAgentPaths: string[]
  creating: boolean
  onCreate: (destination: string, content: string) => Promise<void>
}): JSX.Element {
  const [templateId, setTemplateId] = useState<AgentTemplateId>('reviewer')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const preview = useMemo(
    () => buildAgentDraftPreview({ templateId, name, description, cwd }),
    [templateId, name, description, cwd]
  )
  const destinationExists = preview.destination ? existingAgentPaths.includes(preview.destination) : false
  const createDisabled = creating || !preview.destination

  const createAgent = async (): Promise<void> => {
    if (!preview.destination) return
    if (destinationExists) {
      const confirmed = window.confirm(`Replace existing project agent at ${preview.destination}?`)
      if (!confirmed) return
    }
    await onCreate(preview.destination, preview.content)
  }

  return (
    <section className="settings-card settings-card--wide agent-helper">
      <div className="settings-readonly-header">
        <strong>Create Project Agent</strong>
        <span className="settings-status-badge settings-status-badge--muted">Preview then create</span>
      </div>
      <p className="settings-muted">
        Build a project-scoped agent from a template, review the file content, then create it under the selected project's `.commandcode/agents/` directory.
      </p>
      <div className="settings-control-row">
        <span>Template</span>
        <select value={templateId} onChange={(event) => setTemplateId(event.target.value as AgentTemplateId)}>
          {agentTemplates.map((template) => (
            <option key={template.id} value={template.id}>{template.label}</option>
          ))}
        </select>
      </div>
      <label className="settings-control-row">
        <span>Name</span>
        <input
          className="native-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={agentTemplates.find((template) => template.id === templateId)?.label}
        />
      </label>
      <label className="settings-control-row settings-control-row--stacked">
        <span>Description</span>
        <textarea
          className="native-input agent-helper-textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional project agent description"
        />
      </label>
      <div className="settings-command-preview">
        <span>Scope</span>
        <code>{preview.scope}</code>
      </div>
      <div className="settings-command-preview">
        <span>Destination</span>
        <code>{preview.destination ?? 'Select a project first'}</code>
      </div>
      {destinationExists && (
        <p className="settings-muted settings-muted--warn">An agent already exists at this destination. Creating will ask before replacing it.</p>
      )}
      <pre className="settings-preview-block agent-helper-preview">{preview.content}</pre>
      <div className="settings-actions-row">
        <button className="primary-button" onClick={() => void createAgent()} disabled={createDisabled}>
          {creating ? 'Creating' : destinationExists ? 'Replace agent' : 'Create agent'}
        </button>
        {!preview.destination && <span className="settings-muted">Choose a project before creating a project agent.</span>}
      </div>
    </section>
  )
}

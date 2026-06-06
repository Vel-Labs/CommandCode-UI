import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { agentTemplates, buildAgentDraftPreview } from './agentDraft'
import type { AgentTemplateId } from './agentDraft'

export function AgentHelper({ cwd }: { cwd: string }): JSX.Element {
  const [templateId, setTemplateId] = useState<AgentTemplateId>('reviewer')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const preview = useMemo(
    () => buildAgentDraftPreview({ templateId, name, description, cwd }),
    [templateId, name, description, cwd]
  )

  return (
    <section className="settings-card settings-card--wide agent-helper">
      <div className="settings-readonly-header">
        <strong>Agent Draft Preview</strong>
        <span className="settings-status-badge settings-status-badge--muted">Preview-only</span>
      </div>
      <p className="settings-muted">
        Build a project-scoped draft before using the existing project agent editor. This helper does not save files or invent default agent routing.
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
      <pre className="settings-preview-block agent-helper-preview">{preview.content}</pre>
    </section>
  )
}

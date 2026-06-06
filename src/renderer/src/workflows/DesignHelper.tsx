import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import { buildDesignCommandPreview, designModes } from './designCommand'
import type { DesignMode } from './designCommand'

export function DesignHelper(): JSX.Element {
  const [mode, setMode] = useState<DesignMode>('surface')
  const [target, setTarget] = useState('')
  const [goal, setGoal] = useState('')
  const [selectedElement, setSelectedElement] = useState('')

  const preview = useMemo(
    () => buildDesignCommandPreview({
      mode,
      target,
      context: { goal, selectedElement }
    }),
    [mode, target, goal, selectedElement]
  )

  return (
    <div className="design-helper">
      <section className="settings-card settings-card--wide">
        <div className="settings-readonly-header">
          <strong>Design Command Preview</strong>
          <span className="settings-status-badge settings-status-badge--muted">Preview-only</span>
        </div>
        <div className="settings-control-row">
          <span>Mode</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as DesignMode)}>
            {designModes.map((candidate) => (
              <option key={candidate} value={candidate}>{candidate}</option>
            ))}
          </select>
        </div>
        <label className="settings-control-row">
          <span>Target</span>
          <input
            className="native-input"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="file, component, route, or surface"
          />
        </label>
        <label className="settings-control-row settings-control-row--stacked">
          <span>Goal</span>
          <textarea
            className="native-input design-helper-textarea"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="Optional design goal kept as visible helper context"
          />
        </label>
        <label className="settings-control-row">
          <span>Selected element</span>
          <input
            className="native-input"
            value={selectedElement}
            onChange={(event) => setSelectedElement(event.target.value)}
            placeholder="Future visual plugin context"
          />
        </label>
        <div className="settings-command-preview">
          <span>Command</span>
          <code>{preview.command}</code>
        </div>
        <div className="settings-command-preview">
          <span>Execution</span>
          <code>Not sent in this package</code>
        </div>
        <p className="settings-muted">
          Goal and selected-element context stay visible here and are not appended to the slash command. Sending this helper to an active session remains planned behind an explicit preview-and-confirm action.
        </p>
      </section>
    </div>
  )
}

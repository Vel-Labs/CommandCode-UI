import type { JSX } from 'react'
import { Search, Sparkles, SplitSquareHorizontal } from 'lucide-react'

export function ModelsSettings({
  model,
  onConfigureModels,
  openRuntimeSettings
}: {
  model: string
  onConfigureModels: () => Promise<void>
  openRuntimeSettings: () => void
}): JSX.Element {
  const activeModel = model.trim() || 'Default at next session start'

  return (
    <div className="models-settings-grid">
      <section className="settings-card settings-card--wide">
        <div className="settings-readonly-header">
          <strong>Model Boundaries</strong>
        </div>
        <div className="models-boundary-list">
          <ModelBoundaryRow
            icon={<Sparkles size={17} />}
            title="Single-session model"
            detail={`Current picker value: ${activeModel}`}
            status="GUI passes a documented --model value when a session starts. Existing session labels stay pinned to their start metadata."
          />
          <ModelBoundaryRow
            icon={<SplitSquareHorizontal size={17} />}
            title="Task routing"
            detail="/configure-models"
            status="Command Code owns compaction, title, and background task routing semantics. This GUI only opens the documented helper."
          />
          <ModelBoundaryRow
            icon={<Search size={17} />}
            title="Model catalog"
            detail="Search uses cmd --list-models output"
            status="The picker filters documented IDs, short names, providers, and descriptions without adding pricing or capability metadata."
          />
        </div>
        <div className="settings-inline-actions">
          <button className="ghost-button native-ghost settings-inline-action" onClick={openRuntimeSettings}>Open runtime picker</button>
          <button className="primary-button settings-inline-action" onClick={() => void onConfigureModels()}>Open /configure-models</button>
        </div>
      </section>

      <section className="settings-card settings-card--wide">
        <div className="settings-readonly-header">
          <strong>Task Routing Preview</strong>
        </div>
        <div className="settings-command-preview">
          <span>Command</span>
          <code>/configure-models</code>
        </div>
        <div className="settings-command-preview">
          <span>Apply behavior</span>
          <code>Command Code interactive helper</code>
        </div>
        <p className="settings-muted">
          Persistent routing edits are intentionally not implemented in this package. They are gated on documented config behavior and a scoped write path.
        </p>
      </section>

      <section className="settings-card settings-card--wide">
        <div className="settings-readonly-header">
          <strong>Vision Adapter Routing</strong>
          <span className="settings-status-badge settings-status-badge--muted">Future/plugin-owned</span>
        </div>
        <p className="settings-muted">
          No preferred vision-model route is configured here. The GUI will not claim a text-only coding model saw an image unless a future adapter produces visible text context first.
        </p>
      </section>
    </div>
  )
}

function ModelBoundaryRow({
  icon,
  title,
  detail,
  status
}: {
  icon: JSX.Element
  title: string
  detail: string
  status: string
}): JSX.Element {
  return (
    <div className="models-boundary-row">
      <span className="models-boundary-icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <small>{status}</small>
    </div>
  )
}

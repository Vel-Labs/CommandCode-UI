import type { JSX } from 'react'
import { ChevronDown, Folder, Play, Send, SlidersHorizontal } from 'lucide-react'

export function ComposerBar({
  active,
  prompt,
  setPrompt,
  onSubmit,
  onFocus,
  showPlanSuggestion,
  onPlanMode,
  projectLabel,
  modelLabel,
  permissionLabel,
  riskyPermission,
  onProject,
  onPermission,
  onModel,
  onSlash
}: {
  active: boolean
  prompt: string
  setPrompt: (value: string) => void
  onSubmit: () => Promise<void>
  onFocus?: () => void
  showPlanSuggestion: boolean
  onPlanMode: () => Promise<void>
  projectLabel: string
  modelLabel: string
  permissionLabel: string
  riskyPermission: boolean
  onProject: () => void
  onPermission: () => void
  onModel: () => void
  onSlash: () => void
}): JSX.Element {
  return (
    <div className={`composer-card ${active ? 'composer-card--active' : ''}`}>
      {showPlanSuggestion && (
        <div className="plan-suggestion">
          <div>
            <strong>Create a plan</strong>
            <span>Use Command Code plan mode for this prompt.</span>
          </div>
          <button className="chip-button" onClick={() => void onPlanMode()}>Use plan mode</button>
        </div>
      )}
      <textarea
        className="composer-input"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onFocus={onFocus}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void onSubmit()
          }
        }}
        placeholder="Do anything"
        rows={active ? 2 : 3}
      />
      <div className="composer-toolbar">
        <div className="composer-chip-row">
          <button className="chip-button icon-only-chip" onClick={onSlash} title="Slash commands">
            <SlidersHorizontal size={17} />
          </button>
          <button className={`chip-button ${riskyPermission ? 'chip-button--warn' : ''}`} onClick={onPermission}>
            <span className={riskyPermission ? 'warning-dot' : 'neutral-dot'} />
            {permissionLabel}
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="composer-chip-row composer-chip-row--right">
          <button className="chip-button" onClick={onProject}>
            <Folder size={15} />
            {projectLabel}
            <ChevronDown size={14} />
          </button>
          <button className="chip-button" onClick={onModel}>
            {modelLabel}
            <ChevronDown size={14} />
          </button>
          <button className="composer-send" onClick={() => void onSubmit()} title={active ? 'Send (Enter)' : 'Start (Enter)'}>
            {active ? <Send size={18} /> : <Play size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}

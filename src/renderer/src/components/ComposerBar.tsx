import type { JSX } from 'react'
import { ChevronDown, Folder, Paperclip, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'

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
  const [isExpanded, setIsExpanded] = useState(!active)
  const [showAttachments, setShowAttachments] = useState(false)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void onSubmit()
    }
  }

  return (
    <div className={`composer-bar ${active ? 'composer-bar--active' : ''}`}>
      {showPlanSuggestion && (
        <div className="plan-suggestion">
          <Sparkles size={14} />
          <span>Create a plan with <strong>plan mode</strong> for this prompt</span>
          <button className="plan-suggestion-action" onClick={() => void onPlanMode()}>Use plan mode</button>
        </div>
      )}

      <div className="composer-input-wrapper">
        <div className="composer-toolbar-top">
          <button className="composer-toolbar-btn" onClick={onSlash} title="Slash commands">
            <Paperclip size={16} />
          </button>
          <button className="composer-toolbar-btn" onClick={onPermission} title="Permission mode">
            <span className={`permission-dot ${riskyPermission ? 'risky' : ''}`} />
            <span className="permission-label">{permissionLabel}</span>
            <ChevronDown size={12} />
          </button>
          <div className="composer-spacer" />
          <button className="composer-toolbar-btn" onClick={onProject} title="Project">
            <Folder size={15} />
            <span className="project-label">{projectLabel}</span>
            <ChevronDown size={12} />
          </button>
          <button className="composer-toolbar-btn" onClick={onModel} title="Model">
            <span className="model-label">{modelLabel}</span>
            <ChevronDown size={12} />
          </button>
        </div>

        <textarea
          className="composer-input"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          placeholder={active ? "Message Command Code…" : "What would you like to do?"}
          rows={isExpanded ? 4 : 1}
          style={{ height: isExpanded ? 'auto' : '44px' }}
          onClick={() => setIsExpanded(true)}
        />

        <div className="composer-footer">
          <div className="composer-hint">
            <kbd>Enter</kbd> to send • <kbd>Shift+Enter</kbd> for new line
          </div>
          <button
            className="composer-send"
            onClick={() => void onSubmit()}
            disabled={!prompt.trim()}
            title="Send (Enter)"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

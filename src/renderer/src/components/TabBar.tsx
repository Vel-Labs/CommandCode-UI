import type { JSX } from 'react'
import type { SessionReadinessState } from '../services/sessionReadiness'
import { sessionModelLabel } from '../services/sessionModelIdentity'

type SessionTab = {
  id: string
  label: string
  mock: boolean
  model?: string
  stopRequested: boolean
  transcriptPath: string
  readiness: SessionReadinessState
}

type TabBarProps = {
  tabs: SessionTab[]
  activeId?: string
  onSelect: (id: string) => void
  onKill: (id: string) => void
}

export function TabBar({ tabs, activeId, onSelect, onKill }: TabBarProps): JSX.Element {
  if (tabs.length === 0) return <div />

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${tab.id === activeId ? 'tab--active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          <span className={`tab-dot ${tab.mock ? 'tab-dot--mock' : 'tab-dot--live'}`} />
          <span className="tab-label">{tab.label}</span>
          <span className="tab-model">{sessionModelLabel({ model: tab.model })}</span>
          {tab.readiness.unread && <span className="tab-readiness tab-readiness--unread">new</span>}
          {tab.readiness.inputRequired && <span className="tab-readiness tab-readiness--input">input</span>}
          {tab.readiness.responseReady && <span className="tab-readiness tab-readiness--ready">ready</span>}
          <span
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation()
              onKill(tab.id)
            }}
          >
            ×
          </span>
        </button>
      ))}
    </div>
  )
}

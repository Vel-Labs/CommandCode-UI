import type { JSX } from 'react'

type SessionTab = {
  id: string
  label: string
  mock: boolean
  stopRequested: boolean
  transcriptPath: string
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

import type { JSX } from 'react'
import { sessionReadinessDisplay, type SessionReadinessState } from '../services/sessionReadiness'
import { sessionModelLabel } from '../services/sessionModelIdentity'

type SessionTab = {
  id: string
  label: string
  mock: boolean
  model?: string
  stopRequested: boolean
  transcriptPath: string
  transcriptBindingStatus?: 'unbound' | 'binding' | 'bound' | 'ambiguous' | 'failed'
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
      {tabs.map((tab) => {
        const readiness = sessionReadinessDisplay(tab.readiness)
        const unread = unreadLabel(tab.readiness)
        const binding = bindingLabel(tab.transcriptBindingStatus)
        return (
          <button
            key={tab.id}
            className={`tab ${tab.id === activeId ? 'tab--active' : ''} ${tab.readiness.status === 'waiting-for-input' ? 'tab--input-required' : ''}`}
            onClick={() => onSelect(tab.id)}
            title={[readiness.title, binding?.title].filter(Boolean).join(' · ')}
          >
            <span className={`tab-dot tab-dot--${readiness.tone}`} />
            <span className="tab-label">{tab.label}</span>
            <span className="tab-model">{sessionModelLabel({ model: tab.model })}</span>
            <span className={`tab-readiness tab-readiness--${readiness.tone}`}>
              <span className="tab-readiness-symbol" aria-hidden="true">{readiness.symbol}</span>
              {readiness.label}
            </span>
            {binding && <span className={`tab-readiness tab-readiness--${binding.tone}`}>{binding.label}</span>}
            {unread && <span className={`tab-readiness tab-readiness--${unread.tone}`}>{unread.label}</span>}
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
        )
      })}
    </div>
  )
}

function unreadLabel(readiness: SessionReadinessState): { label: string; tone: 'purple' | 'warn' } | undefined {
  if (!readiness.unread) return undefined
  if (readiness.inputRequired) return { label: 'input needed', tone: 'warn' }
  if (readiness.responseReady || readiness.status === 'response-ready') return { label: 'response ready', tone: 'purple' }
  return undefined
}

function bindingLabel(status: SessionTab['transcriptBindingStatus']): { label: string; tone: 'default' | 'warn' | 'bad'; title: string } | undefined {
  if (!status || status === 'unbound' || status === 'bound') return undefined
  if (status === 'binding') return { label: 'binding', tone: 'warn', title: 'Associating this GUI session with a Command Code JSONL transcript' }
  if (status === 'ambiguous') return { label: 'ambiguous', tone: 'warn', title: 'Multiple Command Code transcripts match this prompt' }
  return { label: 'binding failed', tone: 'bad', title: 'The GUI could not associate this session with a Command Code transcript' }
}

import type { JSX, ReactNode } from 'react'
import type { SettingsRegistryItem } from './settingsRegistry'

type SettingsPageHeaderProps = {
  item: SettingsRegistryItem
  scope?: string
  status?: string
  action?: ReactNode
}

export function SettingsPageHeader({ item, scope, status, action }: SettingsPageHeaderProps): JSX.Element {
  return (
    <header className="settings-page-header">
      <div className="settings-page-header-copy">
        <div className="settings-page-kicker">{item.taskGroup} / {formatRole(item.role)}</div>
        <h2>{item.label}</h2>
        <p>{item.description}</p>
        <div className="settings-page-status-row">
          <span>{status || statusForRole(item.role)}</span>
          <span>{scope || item.primaryActionLabel || 'Review current settings'}</span>
        </div>
      </div>
      {action && <div className="settings-page-header-action">{action}</div>}
    </header>
  )
}

function formatRole(role: SettingsRegistryItem['role']): string {
  if (role === 'hub') return 'Overview'
  if (role === 'diagnostic') return 'Diagnostics'
  if (role === 'reference') return 'Reference'
  return 'Task'
}

function statusForRole(role: SettingsRegistryItem['role']): string {
  if (role === 'hub') return 'Task entry point'
  if (role === 'diagnostic') return 'Read-only diagnostics'
  if (role === 'reference') return 'Reference'
  return 'Actionable settings'
}

import type { JSX, ReactNode } from 'react'

export function SettingsReadOnlyCard({
  title,
  loading,
  onRefresh,
  children
}: {
  title: string
  loading: boolean
  onRefresh: () => Promise<void>
  children: ReactNode
}): JSX.Element {
  return (
    <div className="settings-card settings-card--wide">
      <div className="settings-readonly-header">
        <strong>{title}</strong>
        <button className="ghost-button native-ghost" onClick={() => void onRefresh()} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>
      {children}
    </div>
  )
}

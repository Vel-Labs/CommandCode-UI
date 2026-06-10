import type { JSX, ReactNode } from 'react'

export function SettingsReferenceCard({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="settings-card settings-card--wide">
      <div className="settings-readonly-header">
        <strong>{title}</strong>
      </div>
      {children}
    </div>
  )
}

export function ReferenceRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="settings-readonly-row">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  )
}

export function SettingsStackedRow({
  title,
  value,
  meta,
  actions
}: {
  title: string
  value?: string
  meta?: string
  actions?: ReactNode
}): JSX.Element {
  return (
    <div className="settings-stacked-row">
      <div className="settings-stacked-row-header">
        <strong>{title}</strong>
        {meta && <span>{meta}</span>}
      </div>
      {value && <code className="settings-stacked-row-value">{value}</code>}
      {actions && <div className="settings-stacked-row-actions">{actions}</div>}
    </div>
  )
}

export function formatBytes(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return '0 B'
  if (sizeBytes < 1024) return `${sizeBytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = sizeBytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

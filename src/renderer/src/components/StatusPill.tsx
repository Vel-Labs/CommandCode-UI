import type { JSX } from 'react'

type StatusPillProps = {
  label: string
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'purple'
}

export function StatusPill({ label, tone = 'default' }: StatusPillProps): JSX.Element {
  return <span className={`status-pill status-pill--${tone}`}>{label}</span>
}

import type { JSX } from 'react'

type StatusPillProps = {
  label: string
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'purple'
  size?: 'sm' | 'md'
}

export function StatusPill({ label, tone = 'default', size = 'md' }: StatusPillProps): JSX.Element {
  return <span className={`status-pill status-pill--${tone} ${size === 'sm' ? 'status-pill--sm' : ''}`}>{label}</span>
}

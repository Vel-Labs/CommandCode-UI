import type { JSX } from 'react'
import { Terminal } from 'lucide-react'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import { ptyHealthDisplay } from '../services/ptyHealthDisplay'

export function PtyHealthBadge({
  ptyHealth,
  compact = false,
  size = 'md'
}: {
  ptyHealth: PtyDoctorResult | null
  compact?: boolean
  size?: 'sm' | 'md'
}): JSX.Element {
  const display = ptyHealthDisplay(ptyHealth)

  return (
    <span className={`pty-health-badge pty-health-badge--${display.tone} ${size === 'sm' ? 'pty-health-badge--sm' : ''}`} title={display.title}>
      <Terminal size={size === 'sm' ? 11 : 13} />
      <span className="pty-health-label">{display.label}</span>
      {!compact && size !== 'sm' && <span className="pty-health-detail">{display.detail}</span>}
    </span>
  )
}

import type { JSX } from 'react'
import { Terminal } from 'lucide-react'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import { ptyHealthDisplay } from '../services/ptyHealthDisplay'

export function PtyHealthBadge({
  ptyHealth,
  compact = false
}: {
  ptyHealth: PtyDoctorResult | null
  compact?: boolean
}): JSX.Element {
  const display = ptyHealthDisplay(ptyHealth)

  return (
    <span className={`pty-health-badge pty-health-badge--${display.tone}`} title={display.title}>
      <Terminal size={13} />
      <span className="pty-health-label">{display.label}</span>
      {!compact && <span className="pty-health-detail">{display.detail}</span>}
    </span>
  )
}

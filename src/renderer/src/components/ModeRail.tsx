import type { JSX } from 'react'
import type { PermissionMode } from '../../../shared/types'

type ModeRailProps = {
  permissionMode: PermissionMode
  trust: boolean
  useMock: boolean
}

function railColor(props: ModeRailProps): string {
  if (props.permissionMode === 'auto-accept') return '#f59e0b'
  if (props.permissionMode === 'plan') return '#a78bfa'
  if (!props.trust) return '#fb7185'
  if (!props.useMock) return '#22d3ee'
  return '#a1a1aa'
}

function railLabel(props: ModeRailProps): string {
  const parts: string[] = []
  if (props.permissionMode !== 'standard') parts.push(props.permissionMode)
  if (!props.trust) parts.push('untrusted')
  if (!props.useMock) parts.push('live cli')
  if (parts.length === 0) return 'standard'
  return parts.join(' · ')
}

export function ModeRail(props: ModeRailProps): JSX.Element {
  const color = railColor(props)
  const label = railLabel(props)

  return (
    <div
      className="mode-rail"
      style={{ borderColor: color }}
      title={label}
    >
      <span className="mode-rail-label" style={{ color }}>{label}</span>
    </div>
  )
}

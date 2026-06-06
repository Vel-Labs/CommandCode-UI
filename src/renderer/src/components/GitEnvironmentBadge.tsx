import type { JSX } from 'react'
import { GitBranch } from 'lucide-react'
import type { GitEnvironmentStatus } from '../../../core/types'
import { gitEnvironmentDisplay } from '../services/gitEnvironmentDisplay'

export function GitEnvironmentBadge({
  status,
  loading = false,
  compact = false
}: {
  status: GitEnvironmentStatus | null
  loading?: boolean
  compact?: boolean
}): JSX.Element {
  const display = gitEnvironmentDisplay(status, loading)

  return (
    <span className={`git-environment-badge git-environment-badge--${display.tone}`} title={display.title}>
      <GitBranch size={13} />
      <span className="git-environment-branch">{display.label}</span>
      {!compact && <span className="git-environment-detail">{display.detail}</span>}
    </span>
  )
}

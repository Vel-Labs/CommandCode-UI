import type { GitEnvironmentStatus } from '../../../core/types'

export type GitEnvironmentDisplay = {
  label: string
  detail: string
  tone: 'default' | 'good' | 'warn' | 'bad' | 'purple'
  title: string
}

export function gitEnvironmentDisplay(status: GitEnvironmentStatus | null, loading = false): GitEnvironmentDisplay {
  if (loading && !status) {
    return {
      label: 'git checking',
      detail: 'reading project state',
      tone: 'default',
      title: 'Checking project git status'
    }
  }

  if (!status) {
    return {
      label: 'git unavailable',
      detail: 'no project state',
      tone: 'default',
      title: 'No git status has been loaded'
    }
  }

  if (!status.ok) {
    return {
      label: 'git unavailable',
      detail: status.error || 'not a git repository',
      tone: 'warn',
      title: status.error || 'Git status is unavailable for this project'
    }
  }

  const branch = status.branch || 'detached'
  const changes = status.filesChanged === 1 ? '1 file' : `${status.filesChanged} files`
  const remote = remoteLabel(status.ahead || 0, status.behind || 0)
  const dirty = status.filesChanged > 0
  const divergent = Boolean((status.ahead || 0) || (status.behind || 0))

  return {
    label: branch,
    detail: [dirty ? changes : 'clean', remote].filter(Boolean).join(' · '),
    tone: dirty ? 'warn' : divergent ? 'purple' : 'good',
    title: `Git ${branch}: ${dirty ? changes : 'clean'}${remote ? `, ${remote}` : ''}`
  }
}

function remoteLabel(ahead: number, behind: number): string {
  if (ahead && behind) return `${ahead} ahead · ${behind} behind`
  if (ahead) return `${ahead} ahead`
  if (behind) return `${behind} behind`
  return ''
}

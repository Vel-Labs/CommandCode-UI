import { useCallback, useEffect, useRef, useState } from 'react'
import type { GitEnvironmentStatus } from '../../../core/types'
import type { TransportAPI } from '../../../core/transport'

export function useGitStatus({ transport, cwd }: { transport: TransportAPI; cwd: string }) {
  const [gitStatus, setGitStatus] = useState<GitEnvironmentStatus | null>(null)
  const [gitStatusLoading, setGitStatusLoading] = useState(false)
  const gitStatusRequest = useRef(0)

  const refreshGitStatus = useCallback(async (): Promise<void> => {
    const requestId = gitStatusRequest.current + 1
    gitStatusRequest.current = requestId

    if (!cwd.trim()) {
      setGitStatus(null)
      setGitStatusLoading(false)
      return
    }

    setGitStatusLoading(true)
    try {
      const result = await transport.gitStatus(cwd)
      if (gitStatusRequest.current === requestId) {
        setGitStatus(result)
      }
    } catch (err) {
      if (gitStatusRequest.current === requestId) {
        setGitStatus({
          ok: false,
          cwd,
          filesChanged: 0,
          insertions: 0,
          deletions: 0,
          added: 0,
          modified: 0,
          deleted: 0,
          untracked: 0,
          files: [],
          raw: '',
          error: err instanceof Error ? err.message : 'Git status failed'
        })
      }
    } finally {
      if (gitStatusRequest.current === requestId) {
        setGitStatusLoading(false)
      }
    }
  }, [transport, cwd])

  useEffect(() => {
    void refreshGitStatus()
  }, [refreshGitStatus])

  return {
    gitStatus,
    gitStatusLoading,
    refreshGitStatus
  }
}

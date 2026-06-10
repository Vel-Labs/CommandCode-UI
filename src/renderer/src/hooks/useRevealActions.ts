import { useCallback } from 'react'
import type { TransportAPI } from '../../../core/transport'
import type { NativeRevealResult } from '../../../core/types'
import { notify } from '../components/ToastSystem'

export function useRevealActions({
  transport,
  cwd,
  setStatusLine
}: {
  transport: TransportAPI
  cwd: string
  setStatusLine: (value: string) => void
}) {
  const handleRevealResult = useCallback(async (result: NativeRevealResult, fallbackLabel: string): Promise<void> => {
    if (result.ok) return
    try {
      await navigator.clipboard?.writeText(result.path)
      setStatusLine(`${result.message || 'Native reveal is not available in this shell'} Path copied: ${result.path}`)
      notify(`${fallbackLabel} copied`, 'session-started')
    } catch {
      setStatusLine(`${result.message || 'Native reveal is not available in this shell'} ${fallbackLabel}: ${result.path}`)
      notify(`${fallbackLabel} available in status`, 'session-started')
    }
  }, [setStatusLine])

  const revealTranscriptPath = useCallback(async (transcriptPath: string): Promise<void> => {
    const result = await transport.revealTranscript(transcriptPath)
    await handleRevealResult(result, 'Transcript path')
  }, [handleRevealResult, transport])

  const revealProjectPath = useCallback(async (): Promise<void> => {
    if (!cwd.trim()) {
      setStatusLine('Choose a project before revealing its path.')
      return
    }
    const result = await transport.revealPath(cwd)
    await handleRevealResult(result, 'Project path')
  }, [cwd, handleRevealResult, setStatusLine, transport])

  return {
    revealTranscriptPath,
    revealProjectPath
  }
}

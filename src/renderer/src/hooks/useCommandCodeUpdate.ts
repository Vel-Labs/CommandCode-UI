import { useCallback, useEffect, useRef, useState } from 'react'
import type { TransportAPI } from '../../../core/transport'
import { releaseNotes } from '../commandPalette'
import type { UpdateState } from '../appTypes'
import { loadSeenReleaseNotes, updateStateFromResult } from '../services/appStorage'
import { hasNoteLikeUpdateDetails } from '../services/updateReleaseNotes'

export function useCommandCodeUpdate({
  transport,
  commandExecutable,
  cwd,
  setStatusLine
}: {
  transport: TransportAPI
  commandExecutable: string
  cwd: string
  setStatusLine: (value: string) => void
}) {
  const [updateState, setUpdateState] = useState<UpdateState>('idle')
  const [updateVersion, setUpdateVersion] = useState<string | undefined>()
  const [updateDetails, setUpdateDetails] = useState('')
  const [releaseNoteVersion, setReleaseNoteVersion] = useState<string | undefined>()
  const startupUpdateCheckStarted = useRef(false)

  const checkForUpdates = useCallback(async (): Promise<void> => {
    setUpdateState('checking')
    try {
      const result = await transport.update(commandExecutable, cwd || '.', true)
      setUpdateState(updateStateFromResult(result))
      setUpdateVersion(result.version)
      const details = (result.stdout || result.stderr).trim()
      setUpdateDetails(details)
      if (
        result.ok &&
        result.version &&
        !loadSeenReleaseNotes().includes(result.version) &&
        (releaseNotes[result.version] || hasNoteLikeUpdateDetails(details))
      ) {
        setReleaseNoteVersion(result.version)
      }
    } catch (err) {
      setUpdateState('failed')
      setUpdateDetails(err instanceof Error ? err.message : 'Update check failed')
    }
  }, [transport, commandExecutable, cwd])

  useEffect(() => {
    if (startupUpdateCheckStarted.current) return
    startupUpdateCheckStarted.current = true
    void checkForUpdates()
  }, [checkForUpdates])

  const runUpdate = useCallback(async (): Promise<void> => {
    setUpdateState('updating')
    setStatusLine('Updating Command Code...')
    try {
      const result = await transport.update(commandExecutable, cwd || '.', false)
      let finalResult = result
      if (result.ok) {
        try {
          finalResult = await transport.update(commandExecutable, cwd || '.', true)
        } catch {
          finalResult = {
            ...result,
            upToDate: !result.updateAvailable,
            updateAvailable: false
          }
        }
      }
      setUpdateState(updateStateFromResult(finalResult))
      setUpdateVersion(finalResult.version || result.version)
      setUpdateDetails((finalResult.stdout || finalResult.stderr || result.stdout || result.stderr).trim())
      const installedVersion = finalResult.version || result.version
      if (finalResult.ok && installedVersion && !loadSeenReleaseNotes().includes(installedVersion)) {
        setReleaseNoteVersion(installedVersion)
      }
      setStatusLine(finalResult.ok ? (finalResult.upToDate ? 'Command Code is up to date.' : (finalResult.stdout || result.stdout || 'Command Code update complete.').trim()) : (finalResult.stderr || finalResult.error || 'Command Code update failed.'))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Command Code update failed.'
      setUpdateState('failed')
      setUpdateDetails(message)
      setStatusLine(message)
    }
  }, [transport, commandExecutable, cwd, setStatusLine])

  return {
    updateState,
    updateVersion,
    updateDetails,
    releaseNoteVersion,
    setReleaseNoteVersion,
    checkForUpdates,
    runUpdate
  }
}

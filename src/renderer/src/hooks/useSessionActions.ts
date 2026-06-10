import type { SessionExitPayload } from '../../../shared/types'
import type { DiscoveredSession } from '../../../core/types'
import { buildPtySubmitChunks } from '../../../shared/ptyInput'
import {
  type CommandPaletteItem,
  type RightInspector,
  type RuntimeMode,
  type SessionTab
} from '../appTypes'
import { pushCommandHistory } from '../components/CommandHistory'
import { notify, playChime } from '../components/ToastSystem'
import { commandPaletteItems } from '../commandPalette'
import { PTY_KEYSTROKE_DELAY_MS, markReleaseNoteSeen } from '../services/appStorage'
import type { UseSessionActionsOptions } from './useSessionActionsTypes'

let tabCounter = 1

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function useSessionActions({
  transport,
  cwd,
  useMock,
  runtimeMode,
  setRuntimeModeState,
  realSessionDisabled,
  ptyHealth,
  commandExecutable,
  model,
  permissionMode,
  trust,
  skipOnboarding,
  projectLabel,
  tabs,
  setTabs,
  activeTabId,
  activeTab,
  composerPrompt,
  setComposerPrompt,
  setActiveTabId,
  setSelectedTranscript,
  setResumeFailure,
  setRightInspector,
  setOpenPopover,
  setTerminalInputEnabled,
  setSettingsOpen,
  setStatusLine,
  releaseNoteVersion,
  setReleaseNoteVersion,
  saveCurrentAppPreferences,
  addWorkEvent,
  createAttachedReadiness,
  backgroundExistingTabs,
  applySessionReadinessEvent,
  runHeadless,
  headlessMaxTurns,
  headlessYolo
}: UseSessionActionsOptions) {
  const cwdReady = Boolean(cwd.trim()) || useMock

  const updateTab = (id: string, update: Partial<SessionTab>) => {
    setTabs((prev) => prev.map((t) => t.id === id ? { ...t, ...update } : t))
  }

  const pollStructuredTranscriptBinding = async (sessionId: string, prompt: string, submittedAtMs: number): Promise<void> => {
    updateTab(sessionId, { transcriptBindingStatus: 'binding' })
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const result = await transport.matchStructuredTranscript({
        cwd: cwd || '.',
        prompt,
        submittedAtMs
      })
      if (result.status === 'bound' && result.match) {
        updateTab(sessionId, {
          structuredTranscriptPath: result.match.transcriptPath,
          commandCodeSessionId: result.match.sessionId,
          transcriptBindingStatus: 'bound'
        })
        addWorkEvent('Structured transcript bound', result.match.sessionId, 'good')
        return
      }
      if (result.status === 'ambiguous') {
        updateTab(sessionId, { transcriptBindingStatus: 'ambiguous' })
        addWorkEvent('Transcript binding ambiguous', `${result.candidates.length} matching Command Code transcripts`, 'warn')
        return
      }
      if (result.status === 'failed') {
        updateTab(sessionId, { transcriptBindingStatus: 'failed' })
        addWorkEvent('Transcript binding failed', result.error || 'Unknown binding error', 'warn')
        return
      }
      await delay(1500)
    }
    updateTab(sessionId, { transcriptBindingStatus: 'unbound' })
  }

  const removeTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id))
    setActiveTabId((prev) => prev === id ? undefined : prev)
  }

  const writeComposerSubmit = async (sessionId: string, prompt: string, mock: boolean): Promise<void> => {
    applySessionReadinessEvent(sessionId, { type: 'user-submit' })
    if (mock) {
      await transport.write(sessionId, `${prompt.trim()}\r`)
      return
    }

    for (const chunk of buildPtySubmitChunks(prompt)) {
      await transport.write(sessionId, chunk)
      await new Promise((resolve) => window.setTimeout(resolve, PTY_KEYSTROKE_DELAY_MS))
    }
  }

  const startSession = async (initialPrompt?: string, resumeSession?: DiscoveredSession, options?: { keepTranscriptInspector?: boolean }): Promise<void> => {
    const resume = resumeSession ? (resumeSession.title || resumeSession.id) : undefined
    const shouldUseMock = resume ? false : useMock
    const effectiveRuntimeMode: RuntimeMode = resume ? 'real-session' : runtimeMode
    if (!cwdReady) {
      setStatusLine('Choose a project directory first, or switch to Mock mode.')
      return
    }
    if (effectiveRuntimeMode === 'real-session' && realSessionDisabled) {
      setStatusLine(ptyHealth?.error || 'Real session is disabled because PTY is unhealthy.')
      return
    }
    if (resume && runtimeMode === 'mock') {
      setRuntimeModeState('real-session')
    }

    setStatusLine(resume ? `Resuming ${resumeSession?.title || resume}...` : 'Starting session...')
    try {
      const result = await transport.startSession({
        cwd: cwd || '.',
        commandExecutable,
        initialPrompt: initialPrompt?.trim() || undefined,
        resume: resume?.trim() || undefined,
        model: model || undefined,
        permissionMode,
        trust,
        skipOnboarding,
        cols: 120,
        rows: 34,
        useMock: shouldUseMock
      })

      const label = resume ? `resume ${tabCounter++}` : `session ${tabCounter++}`
      const readiness = createAttachedReadiness(result.id)
      const newTab: SessionTab = {
        id: result.id,
        label,
        mock: result.mock,
        model: result.model,
        stopRequested: false,
        stopStage: 0,
        transcriptPath: result.transcriptPath,
        structuredTranscriptPath: resumeSession?.transcriptPath,
        commandCodeSessionId: resumeSession?.id,
        transcriptBindingStatus: resumeSession ? 'bound' : 'unbound',
        projectLabel,
        runtimeMode: effectiveRuntimeMode,
        readiness,
        lastPrompt: initialPrompt?.trim() || undefined,
        resumedSession: resumeSession
      }

      setTabs((prev) => [
        ...backgroundExistingTabs(prev),
        newTab
      ])
      setActiveTabId(result.id)
      setSelectedTranscript(options?.keepTranscriptInspector ? resumeSession : undefined)
      if (options?.keepTranscriptInspector && resumeSession) {
        setRightInspector('transcript')
      }
      setResumeFailure('')
      notify(`${result.mock ? 'Mock' : 'Real'} session started`, 'session-started')
      playChime('session-started')
      addWorkEvent(resume ? 'Session resumed' : 'Session started', resume ? (resumeSession?.title || resume) : newTab.label, 'good')
      setStatusLine(`${result.mock ? 'Mock' : 'Real'} session ${resume ? 'resumed' : 'started'}: ${newTab.label}`)
      if (initialPrompt?.trim() && !result.mock && !resumeSession) {
        void pollStructuredTranscriptBinding(result.id, initialPrompt.trim(), Date.now())
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start session'
      setStatusLine(`Failed: ${message}`)
      if (resumeSession) {
        setSelectedTranscript(resumeSession)
        setResumeFailure(message)
        addWorkEvent('Resume failed', `${resumeSession.title || resumeSession.id}: ${message}`, 'warn')
      }
      notify(`Session start failed: ${message}`, 'session-error')
    }
  }

  const resumeProjectSession = async (session: DiscoveredSession): Promise<void> => {
    setSelectedTranscript(session)
    setRightInspector('none')
    await startSession(undefined, session)
  }

  const openTranscriptSession = (session: DiscoveredSession): void => {
    setSelectedTranscript(session)
    setResumeFailure('')
    setSettingsOpen(false)
    setOpenPopover(null)
    setRightInspector('none')
    addWorkEvent('Resuming context', session.title || session.id)
    void startSession(undefined, session)
  }

  const submitComposer = async (): Promise<void> => {
    const prompt = composerPrompt.trim()
    if (!prompt) return

    if (activeTabId) {
      const submittedAtMs = Date.now()
      updateTab(activeTabId, { lastPrompt: prompt })
      await writeComposerSubmit(activeTabId, prompt, Boolean(activeTab?.mock))
      if (activeTab && !activeTab.mock && !activeTab.structuredTranscriptPath) {
        void pollStructuredTranscriptBinding(activeTab.id, prompt, submittedAtMs)
      }
      pushCommandHistory(prompt)
      setComposerPrompt('')
      setTerminalInputEnabled(false)
      return
    }

    setComposerPrompt('')
    setOpenPopover(null)
    await startSession(prompt)
  }

  const usePlanMode = async (): Promise<void> => {
    const prompt = composerPrompt.trim()
    if (!prompt) return

    if (activeTabId) {
      const planPrompt = `/plan ${prompt}`
      updateTab(activeTabId, { lastPrompt: planPrompt })
      await writeComposerSubmit(activeTabId, planPrompt, Boolean(activeTab?.mock))
      pushCommandHistory(`/plan ${prompt}`)
      setComposerPrompt('')
      setOpenPopover(null)
      setTerminalInputEnabled(false)
      return
    }

    setComposerPrompt(`/plan ${prompt}`)
    setOpenPopover(null)
  }

  const stopSession = async (): Promise<void> => {
    if (!activeTabId) return
    const tab = tabs.find((t) => t.id === activeTabId)
    if (!tab) return

    if (tab.stopStage === 0) {
      await transport.stop(activeTabId)
      updateTab(activeTabId, { stopRequested: true, stopStage: 1 })
      setStatusLine('Sent graceful stop. Press Stop again to interrupt, or Force Stop to kill.')
      return
    }

    if (tab.stopStage === 1) {
      await transport.interrupt(activeTabId)
      updateTab(activeTabId, { stopStage: 2 })
      setStatusLine('Sent interrupt. Press Stop again to force kill.')
      return
    }

    await transport.forceKill(activeTabId)
    removeTab(activeTabId)
    setStatusLine('Session force-killed.')
  }

  const killTab = async (id: string) => {
    await transport.forceKill(id)
    removeTab(id)
  }

  const runHeadlessFromComposer = async (): Promise<void> => {
    const prompt = composerPrompt.trim()
    if (!prompt) {
      setStatusLine('Type a prompt before running headless.')
      return
    }

    setComposerPrompt('')
    setOpenPopover(null)
    await runHeadless(prompt, headlessMaxTurns, headlessYolo)
  }

  const runCommand = async (item: CommandPaletteItem): Promise<void> => {
    if (item.action === 'run-headless') {
      await runHeadlessFromComposer()
      return
    }

    if (activeTabId) {
      updateTab(activeTabId, { lastPrompt: item.command.trim() })
      await writeComposerSubmit(activeTabId, item.command, Boolean(activeTab?.mock))
      pushCommandHistory(item.command.trim())
      setOpenPopover(null)
      setTerminalInputEnabled(false)
      return
    }

    setComposerPrompt((current) => {
      const trimmed = current.trim()
      if (!trimmed || trimmed.startsWith('/')) return item.command
      return `${item.command} ${trimmed}`
    })
    setOpenPopover(null)
  }

  const openConfigureModels = async (): Promise<void> => {
    const item = commandPaletteItems.find((candidate) => candidate.id === 'configure-models')
    if (!item) return
    await runCommand(item)
    if (releaseNoteVersion) {
      markReleaseNoteSeen(releaseNoteVersion)
      saveCurrentAppPreferences()
      setReleaseNoteVersion(undefined)
    }
  }

  const runReleaseNoteCommand = async (command: string): Promise<void> => {
    const item = commandPaletteItems.find((candidate) => candidate.command === command)
    if (item) {
      await runCommand(item)
    } else {
      setComposerPrompt(command)
    }
    if (releaseNoteVersion) {
      markReleaseNoteSeen(releaseNoteVersion)
      saveCurrentAppPreferences()
      setReleaseNoteVersion(undefined)
    }
  }

  const dismissReleaseNotes = (): void => {
    if (releaseNoteVersion) {
      markReleaseNoteSeen(releaseNoteVersion)
      saveCurrentAppPreferences()
    }
    setReleaseNoteVersion(undefined)
  }

  const openTerminalExpansion = (): void => {
    if (!activeTab) return
    setSelectedTranscript(undefined)
    setRightInspector((current) => current === 'transcript' ? 'none' : 'transcript')
    addWorkEvent('Toggled thinking details', 'Ctrl/Cmd+O or Ctrl/Cmd+0 toggled the active transcript inspector.')
  }

  const openNewProjectSession = (): void => {
    setSettingsOpen(false)
    setSelectedTranscript(undefined)
    void startSession()
  }

  const onExit = (payload: SessionExitPayload): void => {
    const exitingTab = tabs.find((tab) => tab.id === payload.sessionId)
    if (exitingTab?.resumedSession && payload.exitCode !== 0) {
      setSelectedTranscript(exitingTab.resumedSession)
      setResumeFailure(`Resume exited with code=${payload.exitCode ?? 'null'} signal=${payload.signal ?? 'null'}`)
      setRightInspector('transcript')
      addWorkEvent('Resume exited', exitingTab.resumedSession.title || exitingTab.resumedSession.id, 'warn')
    } else {
      addWorkEvent('Session exited', exitingTab?.label || payload.sessionId)
    }
    removeTab(payload.sessionId)
    notify('Session exited', 'session-exited')
    playChime('session-exited')
    setStatusLine(`Session exited with code=${payload.exitCode ?? 'null'} signal=${payload.signal ?? 'null'}`)
  }

  return {
    resumeProjectSession,
    openTranscriptSession,
    submitComposer,
    usePlanMode,
    stopSession,
    killTab,
    runCommand,
    openConfigureModels,
    runReleaseNoteCommand,
    dismissReleaseNotes,
    openTerminalExpansion,
    openNewProjectSession,
    onExit
  }
}

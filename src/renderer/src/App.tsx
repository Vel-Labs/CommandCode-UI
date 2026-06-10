import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { PermissionMode } from '../../shared/types'
import type { AppGuiPreferences, DiscoveredSession } from '../../core/types'
import { useTransport } from './useTransport'
import { AppChrome } from './components/AppChrome'
import { useDismissiblePopover } from './hooks/useDismissiblePopover'
import { useAppLayoutGeometry } from './hooks/useAppLayoutGeometry'
import { useCommandCodeUpdate } from './hooks/useCommandCodeUpdate'
import { useGitStatus } from './hooks/useGitStatus'
import { useHeadlessJobs } from './hooks/useHeadlessJobs'
import { useGuiPreferences } from './hooks/useGuiPreferences'
import { usePtyHealth } from './hooks/usePtyHealth'
import { useRevealActions } from './hooks/useRevealActions'
import { useRuntimeCheck } from './hooks/useRuntimeCheck'
import { useSessionActions } from './hooks/useSessionActions'
import { useSessionReadiness } from './hooks/useSessionReadiness'
import { useShellTerminal } from './hooks/useShellTerminal'
import { useWorkEvents } from './hooks/useWorkEvents'
import { appShortcutForKey } from './services/appShortcuts'
import type {
  AppearanceTheme,
  ChatBubbleColors,
  PopoverKey,
  RightInspector,
  RuntimeMode,
  SessionTab,
  SettingsSection,
  SidebarSection,
  WorkspaceView
} from './appTypes'

import {
  defaultCommand,
  defaultCwd,
  displayPath,
  isRiskyPermission,
  loadAppearanceTheme,
  loadChatBubbleColors,
  loadRecentProjects,
  permissionLabel,
  looksPlanLike
} from './services/appStorage'

export function App(): JSX.Element {
  const transport = useTransport()
  const [cwd, setCwdState] = useState(defaultCwd)
  const [recentProjects, setRecentProjects] = useState<string[]>(loadRecentProjects)
  const [commandExecutable, setCommandExecutableState] = useState(defaultCommand)
  const [model, setModel] = useState(localStorage.getItem('ccgui.model') || '')
  const [permissionMode, setPermissionMode] = useState<PermissionMode>('standard')
  const [trust, setTrust] = useState(false)
  const [skipOnboarding, setSkipOnboarding] = useState(false)
  const [runtimeMode, setRuntimeModeState] = useState<RuntimeMode>('real-session')
  const [composerPrompt, setComposerPrompt] = useState('')
  const [headlessMaxTurns, setHeadlessMaxTurns] = useState(10)
  const [headlessYolo, setHeadlessYolo] = useState(false)
  const [tabs, setTabs] = useState<SessionTab[]>([])
  const [projectSessions, setProjectSessions] = useState<DiscoveredSession[]>([])
  const [activeTabId, setActiveTabId] = useState<string | undefined>()
  const [statusLine, setStatusLine] = useState('')
  const [viewingFile, setViewingFile] = useState<string | undefined>()
  const [viewingFileSource, setViewingFileSource] = useState<string | undefined>()
  const [rightInspector, setRightInspector] = useState<RightInspector>('none')
  const [terminalInputEnabled, setTerminalInputEnabled] = useState(false)
  const [showAllRecentChats, setShowAllRecentChats] = useState(false)
  const [collapsedSidebarSections, setCollapsedSidebarSections] = useState<Record<SidebarSection, boolean>>({
    projects: false,
    recentChats: false,
    activeSessions: false
  })
  const [selectedTranscript, setSelectedTranscript] = useState<DiscoveredSession | undefined>()
  const [resumeFailure, setResumeFailure] = useState('')
  const [openPopover, setOpenPopover] = useState<PopoverKey>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('profile')
  const [appearanceTheme, setAppearanceThemeState] = useState<AppearanceTheme>(loadAppearanceTheme)
  const [chatBubbleColors, setChatBubbleColorsState] = useState<ChatBubbleColors>(loadChatBubbleColors)
  const [startupProjectBehavior, setStartupProjectBehavior] = useState<AppGuiPreferences['startupProjectBehavior']>('restore-last')
  const {
    railCollapsed,
    setRailCollapsed,
    sidebarWidth,
    setSidebarWidth,
    rightInspectorWidth,
    setRightInspectorWidth,
    startSidebarResize,
    startInspectorResize
  } = useAppLayoutGeometry({ onInspectorCollapse: () => setRightInspector('none') })
  const { gitStatus, gitStatusLoading } = useGitStatus({ transport, cwd })
  const { ptyHealth, refreshPtyHealth } = usePtyHealth(transport)
  const { runCheck } = useRuntimeCheck({ transport, commandExecutable, refreshPtyHealth, setStatusLine })
  const { revealTranscriptPath, revealProjectPath } = useRevealActions({ transport, cwd, setStatusLine })
  const {
    updateState,
    updateVersion,
    updateDetails,
    releaseNoteVersion,
    setReleaseNoteVersion,
    checkForUpdates,
    runUpdate
  } = useCommandCodeUpdate({ transport, commandExecutable, cwd, setStatusLine })

  const useMock = runtimeMode === 'mock'
  const { workEvents, addWorkEvent } = useWorkEvents()
  const { headlessJobs, runHeadless, clearHeadlessJobs } = useHeadlessJobs({
    transport,
    cwd,
    useMock,
    commandExecutable,
    model,
    permissionMode,
    trust,
    skipOnboarding,
    setStatusLine
  })
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const activeTabTranscript: DiscoveredSession | undefined = activeTab ? {
    id: activeTab.id,
    timestamp: new Date().toISOString(),
    transcriptPath: activeTab.transcriptPath,
    sizeBytes: 0,
    title: activeTab.label,
    cwd,
    model: activeTab.model,
    source: 'global'
  } : undefined
  const workspaceView: WorkspaceView = settingsOpen ? 'settings' : activeTabId ? 'session' : selectedTranscript ? 'transcript' : 'home'
  const projectLabel = displayPath(cwd)
  const realSessionDisabled = Boolean(ptyHealth && (!ptyHealth.available || !ptyHealth.healthy))
  const riskyPermission = isRiskyPermission(permissionMode, trust)
  const showPlanSuggestion = looksPlanLike(composerPrompt) && !composerPrompt.trim().startsWith('/plan')
  const visibleRecentChats = showAllRecentChats ? projectSessions : projectSessions.slice(0, 4)
  const popoverRef = useDismissiblePopover(openPopover, setOpenPopover)
  const clearTabPrompt = (id: string): void => {
    setTabs((current) => current.map((tab) => tab.id === id ? { ...tab, lastPrompt: undefined } : tab))
  }
  const {
    setCwd,
    setCommandExecutable,
    setModelPersisted,
    setAppearanceTheme,
    setChatBubbleColors,
    saveCurrentAppPreferences
  } = useGuiPreferences({
    transport,
    cwd,
    setCwdState,
    recentProjects,
    setRecentProjects,
    commandExecutable,
    setCommandExecutableState,
    model,
    setModel,
    runtimeMode,
    setRuntimeModeState,
    permissionMode,
    setPermissionMode,
    trust,
    setTrust,
    skipOnboarding,
    setSkipOnboarding,
    headlessMaxTurns,
    setHeadlessMaxTurns,
    headlessYolo,
    setHeadlessYolo,
    appearanceTheme,
    setAppearanceThemeState,
    chatBubbleColors,
    setChatBubbleColorsState,
    startupProjectBehavior,
    setStartupProjectBehavior,
    sidebarWidth,
    setSidebarWidth,
    rightInspectorWidth,
    setRightInspectorWidth,
    setProjectSessions
  })

  useEffect(() => {
    if (ptyHealth && (!ptyHealth.available || !ptyHealth.healthy) && runtimeMode === 'real-session') {
      setStatusLine(ptyHealth.error || 'PTY unavailable. Real sessions are blocked until PTY health passes.')
    }
  }, [ptyHealth, runtimeMode])

  const {
    applySessionReadinessEvent,
    createAttachedReadiness,
    backgroundExistingTabs
  } = useSessionReadiness({ tabs, setTabs, activeTabId, transport, setTerminalInputEnabled })

  useEffect(() => {
    if (!cwd.trim()) {
      setProjectSessions([])
      return
    }

    let cancelled = false
    transport.discoverSessions(cwd)
      .then((result) => {
        if (!cancelled) {
          setProjectSessions(result.sessions.filter((session) => session.source === 'project').slice(0, 6))
        }
      })
      .catch(() => {
        if (!cancelled) setProjectSessions([])
      })

    return () => {
      cancelled = true
    }
  }, [transport, cwd])

  const setRuntimeMode = (mode: RuntimeMode): void => {
    if (mode === 'real-session' && realSessionDisabled) return
    setRuntimeModeState(mode)
    setOpenPopover(null)
  }

  const { bottomTerminalOpen, toggleShellTerminal } = useShellTerminal({
    transport,
    cwd,
    setStatusLine,
    addWorkEvent
  })

  const openRightInspector = (next: RightInspector): void => {
    setRightInspector(next)
  }

  const chooseProject = async (): Promise<void> => {
    const result = await transport.chooseDirectory()
    if (!result.canceled && result.path) {
      setCwd(result.path)
      setOpenPopover(null)
    }
  }

  const toggleSidebarSection = (section: SidebarSection): void => {
    setCollapsedSidebarSections((current) => ({ ...current, [section]: !current[section] }))
  }

  const {
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
  } = useSessionActions({
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
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const shortcut = appShortcutForKey(event)
      if (!shortcut) return
      event.preventDefault()
      if (shortcut === 'new-session') {
        openNewProjectSession()
        return
      }
      openTerminalExpansion()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  })

  return (
    <AppChrome
      {...{
        workspaceView, settingsSection, cwd, projectLabel, commandExecutable, setCommandExecutable,
        model, setModel: setModelPersisted, transport, ptyHealth, permissionMode, setPermissionMode,
        trust, setTrust, skipOnboarding, setSkipOnboarding, headlessJobs, clearHeadlessJobs,
        tabs, runtimeMode, appearanceTheme, setAppearanceTheme, chatBubbleColors, setChatBubbleColors,
        startupProjectBehavior, setStartupProjectBehavior, updateState, updateVersion, updateDetails,
        runCheck, openConfigureModels, resumeProjectSession, composerPrompt, setComposerPrompt,
        submitComposer, showPlanSuggestion, usePlanMode, permissionLabel: permissionLabel(permissionMode, trust),
        riskyPermission, statusLine, gitStatus, gitStatusLoading, openPopover, setOpenPopover,
        selectedTranscript, resumeFailure, workEvents, revealTranscriptPath, rightInspector,
        setRightInspector, viewingFile, viewingFileSource, setViewingFile, setViewingFileSource,
        addWorkEvent, displayPath, activeTab, activeTabId, activeTabTranscript, killTab, setActiveTabId,
        clearTabPrompt, onExit, stopSession, applySessionReadinessEvent, terminalInputEnabled, setTerminalInputEnabled,
        revealProjectPath, startInspectorResize, popoverRef, recentProjects, chooseProject, setCwd,
        setRuntimeMode, headlessYolo, setHeadlessYolo, headlessMaxTurns, setHeadlessMaxTurns,
        runCommand, releaseNoteVersion, dismissReleaseNotes, runReleaseNoteCommand, railCollapsed,
        setRailCollapsed, sidebarWidth, rightInspectorWidth, settingsOpen, setSettingsOpen,
        collapsedSidebarSections, projectSessions, visibleRecentChats, showAllRecentChats,
        setShowAllRecentChats, startSidebarResize, openTranscriptSession, setSelectedTranscript,
        setSettingsSection, toggleSidebarSection, checkForUpdates, runUpdate
      }}
    />
  )
}

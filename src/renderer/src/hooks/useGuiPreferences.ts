import { useEffect, useRef } from 'react'
import type { PermissionMode } from '../../../shared/types'
import type { AppGuiPreferences, DiscoveredSession, ProjectGuiPreferences } from '../../../core/types'
import type { TransportAPI } from '../../../core/transport'
import type { AppearanceTheme, ChatBubbleColors, RuntimeMode } from '../appTypes'
import {
  APPEARANCE_KEY,
  CHAT_ASSISTANT_COLOR_KEY,
  CHAT_USER_COLOR_KEY,
  INSPECTOR_MAX_WIDTH,
  INSPECTOR_MIN_WIDTH,
  INSPECTOR_WIDTH_KEY,
  PROJECT_MODEL_KEY,
  RECENT_KEY,
  RELEASE_NOTES_SEEN_KEY,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_WIDTH_KEY,
  defaultChatBubbleColors,
  loadProjectModels,
  normalizeHexColor,
  saveProjectModel,
  saveRecentProject
} from '../services/appStorage'
import { applyAppearancePreference, buildAppPreferences } from '../services/guiPreferencePersistence'

type StateSetter<T> = (value: T) => void
type FunctionalStateSetter<T> = (value: T | ((current: T) => T)) => void

type UseGuiPreferencesOptions = {
  transport: TransportAPI
  cwd: string
  setCwdState: StateSetter<string>
  recentProjects: string[]
  setRecentProjects: StateSetter<string[]>
  commandExecutable: string
  setCommandExecutableState: StateSetter<string>
  model: string
  setModel: StateSetter<string>
  runtimeMode: RuntimeMode
  setRuntimeModeState: StateSetter<RuntimeMode>
  permissionMode: PermissionMode
  setPermissionMode: StateSetter<PermissionMode>
  trust: boolean
  setTrust: StateSetter<boolean>
  skipOnboarding: boolean
  setSkipOnboarding: StateSetter<boolean>
  headlessMaxTurns: number
  setHeadlessMaxTurns: StateSetter<number>
  headlessYolo: boolean
  setHeadlessYolo: StateSetter<boolean>
  appearanceTheme: AppearanceTheme
  setAppearanceThemeState: StateSetter<AppearanceTheme>
  chatBubbleColors: ChatBubbleColors
  setChatBubbleColorsState: FunctionalStateSetter<ChatBubbleColors>
  startupProjectBehavior: AppGuiPreferences['startupProjectBehavior']
  setStartupProjectBehavior: StateSetter<AppGuiPreferences['startupProjectBehavior']>
  sidebarWidth: number
  setSidebarWidth: StateSetter<number>
  rightInspectorWidth: number
  setRightInspectorWidth: StateSetter<number>
  setProjectSessions: StateSetter<DiscoveredSession[]>
}

type GuiPreferenceActions = {
  setCwd: (value: string) => void
  setCommandExecutable: (value: string) => void
  setModelPersisted: (value: string) => void
  setAppearanceTheme: (value: AppearanceTheme) => void
  setChatBubbleColors: (value: ChatBubbleColors) => void
  saveCurrentAppPreferences: () => void
}

export function useGuiPreferences(options: UseGuiPreferencesOptions): GuiPreferenceActions {
  const {
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
  } = options

  const appPreferencesHydrated = useRef(false)
  const appPreferenceSaveTimer = useRef<number | undefined>(undefined)
  const hydratedProjectRef = useRef<string | undefined>(undefined)
  const projectPreferenceSaveTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    transport.loadAppPreferences()
      .then((result) => {
        if (cancelled || !result.ok || !result.preferences) return
        const prefs = result.preferences
        const nextStartupProjectBehavior = prefs.startupProjectBehavior === 'empty' ? 'empty' : 'restore-last'
        setStartupProjectBehavior(nextStartupProjectBehavior)
        if (nextStartupProjectBehavior === 'empty') {
          setCwdState('')
          localStorage.removeItem('ccgui.cwd')
        } else if (typeof prefs.cwd === 'string') {
          setCwdState(prefs.cwd)
          localStorage.setItem('ccgui.cwd', prefs.cwd)
        }
        if (Array.isArray(prefs.recentProjects)) {
          setRecentProjects(prefs.recentProjects)
          localStorage.setItem(RECENT_KEY, JSON.stringify(prefs.recentProjects))
        }
        if (typeof prefs.commandExecutable === 'string' && prefs.commandExecutable.trim()) {
          setCommandExecutableState(prefs.commandExecutable)
          localStorage.setItem('ccgui.command', prefs.commandExecutable)
        }
        if (typeof prefs.model === 'string') {
          setModel(prefs.model)
          localStorage.setItem('ccgui.model', prefs.model)
        }
        if (prefs.projectModels && typeof prefs.projectModels === 'object') {
          localStorage.setItem(PROJECT_MODEL_KEY, JSON.stringify(prefs.projectModels))
        }
        applyAppearancePreference(prefs, setAppearanceThemeState, setChatBubbleColorsState)
        if (Array.isArray(prefs.releaseNotesSeen)) {
          localStorage.setItem(RELEASE_NOTES_SEEN_KEY, JSON.stringify(prefs.releaseNotesSeen))
        }
        if (typeof prefs.sidebarWidth === 'number') {
          const width = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, prefs.sidebarWidth))
          setSidebarWidth(width)
          localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width))
        }
        if (typeof prefs.rightInspectorWidth === 'number') {
          const width = Math.min(INSPECTOR_MAX_WIDTH, Math.max(INSPECTOR_MIN_WIDTH, prefs.rightInspectorWidth))
          setRightInspectorWidth(width)
          localStorage.setItem(INSPECTOR_WIDTH_KEY, String(width))
        }
      })
      .catch(() => {
        // Keep renderer-local defaults if the file-backed app preference read fails.
      })
      .finally(() => {
        if (!cancelled) appPreferencesHydrated.current = true
      })

    return () => {
      cancelled = true
    }
  }, [transport])

  useEffect(() => {
    if (!cwd.trim()) {
      hydratedProjectRef.current = undefined
      setProjectSessions([])
      return
    }

    let cancelled = false
    hydratedProjectRef.current = undefined

    transport.loadProjectPreferences(cwd)
      .then((result) => {
        if (cancelled) return
        const prefs = result.preferences
        if (result.ok && prefs) {
          if (typeof prefs.model === 'string') {
            setModel(prefs.model)
            localStorage.setItem('ccgui.model', prefs.model)
          }
          if (prefs.runtimeMode === 'real-session') {
            setRuntimeModeState('real-session')
          }
          if (prefs.permissionMode === 'standard' || prefs.permissionMode === 'plan' || prefs.permissionMode === 'auto-accept') {
            setPermissionMode(prefs.permissionMode)
          }
          if (typeof prefs.trust === 'boolean') setTrust(prefs.trust)
          if (typeof prefs.skipOnboarding === 'boolean') setSkipOnboarding(prefs.skipOnboarding)
          if (typeof prefs.headlessMaxTurns === 'number') setHeadlessMaxTurns(prefs.headlessMaxTurns)
          if (typeof prefs.headlessYolo === 'boolean') setHeadlessYolo(prefs.headlessYolo)
          applyAppearancePreference(prefs, setAppearanceThemeState, setChatBubbleColorsState)
        }
      })
      .catch(() => {
        // Project preferences are additive. Local renderer cache remains the fallback.
      })
      .finally(() => {
        if (!cancelled) hydratedProjectRef.current = cwd
      })

    return () => {
      cancelled = true
    }
  }, [transport, cwd])

  useEffect(() => {
    if (!cwd.trim() || hydratedProjectRef.current !== cwd) return

    if (projectPreferenceSaveTimer.current) {
      window.clearTimeout(projectPreferenceSaveTimer.current)
    }

    const preferences: ProjectGuiPreferences = {
      version: 1,
      projectPath: cwd,
      model,
      runtimeMode: runtimeMode === 'mock' ? 'real-session' : runtimeMode,
      permissionMode,
      trust,
      skipOnboarding,
      headlessMaxTurns,
      headlessYolo,
      appearanceTheme,
      chatBubbleUserColor: chatBubbleColors.user,
      chatBubbleAssistantColor: chatBubbleColors.assistant,
      updatedAt: new Date().toISOString()
    }

    projectPreferenceSaveTimer.current = window.setTimeout(() => {
      void transport.saveProjectPreferences(cwd, preferences)
    }, 500)

    return () => {
      if (projectPreferenceSaveTimer.current) window.clearTimeout(projectPreferenceSaveTimer.current)
    }
  }, [transport, cwd, model, runtimeMode, permissionMode, trust, skipOnboarding, headlessMaxTurns, headlessYolo, appearanceTheme, chatBubbleColors])

  useEffect(() => {
    if (!appPreferencesHydrated.current) return

    if (appPreferenceSaveTimer.current) {
      window.clearTimeout(appPreferenceSaveTimer.current)
    }

    const preferences = buildAppPreferences({
      cwd,
      recentProjects,
      commandExecutable,
      model,
      appearanceTheme,
      chatBubbleColors,
      startupProjectBehavior,
      sidebarWidth,
      rightInspectorWidth
    })

    appPreferenceSaveTimer.current = window.setTimeout(() => {
      void transport.saveAppPreferences(preferences)
    }, 500)

    return () => {
      if (appPreferenceSaveTimer.current) window.clearTimeout(appPreferenceSaveTimer.current)
    }
  }, [transport, cwd, recentProjects, commandExecutable, model, appearanceTheme, chatBubbleColors, startupProjectBehavior, sidebarWidth, rightInspectorWidth])

  const setCwd = (value: string): void => {
    setCwdState(value)
    localStorage.setItem('ccgui.cwd', value)
    setRecentProjects(saveRecentProject(value))
    const savedModel = loadProjectModels()[value]
    if (savedModel !== undefined) {
      setModel(savedModel)
      localStorage.setItem('ccgui.model', savedModel)
    }
  }

  const setCommandExecutable = (value: string): void => {
    setCommandExecutableState(value)
    localStorage.setItem('ccgui.command', value)
  }

  const setModelPersisted = (value: string): void => {
    setModel(value)
    localStorage.setItem('ccgui.model', value)
    saveProjectModel(cwd, value)
  }

  const setAppearanceTheme = (value: AppearanceTheme): void => {
    const previousDefaults = defaultChatBubbleColors(appearanceTheme)
    const nextDefaults = defaultChatBubbleColors(value)
    setAppearanceThemeState(value)
    localStorage.setItem(APPEARANCE_KEY, value)
    setChatBubbleColorsState((current) => {
      const followsTheme = current.user === previousDefaults.user && current.assistant === previousDefaults.assistant
      if (!followsTheme) return current
      localStorage.removeItem(CHAT_USER_COLOR_KEY)
      localStorage.removeItem(CHAT_ASSISTANT_COLOR_KEY)
      return nextDefaults
    })
  }

  const setChatBubbleColors = (value: ChatBubbleColors): void => {
    const next = {
      user: normalizeHexColor(value.user) || chatBubbleColors.user,
      assistant: normalizeHexColor(value.assistant) || chatBubbleColors.assistant
    }
    setChatBubbleColorsState(next)
    localStorage.setItem(CHAT_USER_COLOR_KEY, next.user)
    localStorage.setItem(CHAT_ASSISTANT_COLOR_KEY, next.assistant)
  }

  const saveCurrentAppPreferences = (): void => {
    void transport.saveAppPreferences(buildAppPreferences({
      cwd,
      recentProjects,
      commandExecutable,
      model,
      appearanceTheme,
      chatBubbleColors,
      startupProjectBehavior,
      sidebarWidth,
      rightInspectorWidth
    }))
  }

  return {
    setCwd,
    setCommandExecutable,
    setModelPersisted,
    setAppearanceTheme,
    setChatBubbleColors,
    saveCurrentAppPreferences
  }
}

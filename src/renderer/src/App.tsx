import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { JSX } from 'react'
import {
  Activity,
  ChevronDown,
  Folder,
  FolderOpen,
  GitBranch,
  HardDrive,
  Keyboard,
  PanelBottom,
  PanelRightOpen,
  Play,
  Route,
  Send,
  Sparkles,
  SlidersHorizontal,
  Terminal,
  X
} from 'lucide-react'
import type { PermissionMode, SessionExitPayload, HeadlessRunResult } from '../../shared/types'
import type { AppGuiPreferences, CommandCodeUpdateResult, DiscoveredSession, ProjectGuiPreferences } from '../../core/types'
import type { PtyDoctorResult } from '../../core/ptyDoctor'
import type { TransportAPI } from '../../core/transport'
import { useTransport } from './useTransport'
import { ModelDropdown } from './components/ModelDropdown'
import { AuthCard } from './components/AuthCard'
import { TerminalPane } from './components/TerminalPane'
import { TabBar } from './components/TabBar'
import { pushCommandHistory } from './components/CommandHistory'
import { HeadlessHistory, type HeadlessJob } from './components/HeadlessHistory'
import { notify, playChime } from './components/ToastSystem'
import { IdePanel } from './components/IdePanel'
import { AdvancedPanel } from './components/AdvancedPanel'
import { StatusPill } from './components/StatusPill'
import { buildPtySubmitChunks } from '../../shared/ptyInput'
import { RightInspectorPanel } from './inspectors/RightInspectorPanel'
import { TranscriptWorkspace } from './workspaces/TranscriptWorkspace'
import { ShellLayout } from './layout/ShellLayout'
import type {
  AppearanceTheme,
  CommandPaletteItem,
  PopoverKey,
  RightInspector,
  RuntimeMode,
  SessionTab,
  SettingsSection,
  SidebarSection,
  UpdateState,
  WorkEvent,
  WorkspaceView
} from './appTypes'

const RECENT_KEY = 'ccgui.recent-dirs'
const APPEARANCE_KEY = 'ccgui.appearance-theme'
const PROJECT_MODEL_KEY = 'ccgui.project-models'
const RELEASE_NOTES_SEEN_KEY = 'ccgui.release-notes-seen'
const SIDEBAR_WIDTH_KEY = 'ccgui.sidebar-width'
const INSPECTOR_WIDTH_KEY = 'ccgui.right-inspector-width'
const SIDEBAR_MIN_WIDTH = 220
const SIDEBAR_MAX_WIDTH = 420
const SIDEBAR_COLLAPSE_WIDTH = 170
const DEFAULT_SIDEBAR_WIDTH = 292
const INSPECTOR_MIN_WIDTH = 320
const INSPECTOR_MAX_WIDTH = 720
const INSPECTOR_COLLAPSE_WIDTH = 280
const DEFAULT_INSPECTOR_WIDTH = 420
const PTY_KEYSTROKE_DELAY_MS = 20
const commandPaletteItems: CommandPaletteItem[] = [
  { id: 'help', label: 'Help', command: '/help', group: 'Session', description: 'Show available Command Code commands.' },
  { id: 'status', label: 'Status', command: '/status', group: 'Session', description: 'Inspect current runtime and authentication state.' },
  { id: 'clear', label: 'Clear', command: '/clear', group: 'Session', description: 'Clear the interactive conversation view.' },
  { id: 'exit', label: 'Exit', command: '/exit', group: 'Session', description: 'Ask the current session to exit cleanly.' },
  { id: 'plan', label: 'Create a plan', command: '/plan', group: 'Planning', description: 'Enter Command Code plan mode for the current task.' },
  { id: 'headless', label: 'Run headless', command: 'cmd --print', group: 'Planning', description: 'Run the current prompt once with cmd --print and record the result.', action: 'run-headless' },
  { id: 'design', label: 'Design surface', command: '/design surface', group: 'Design', description: 'Run a design-surface pass for UI and product work.' },
  { id: 'agents', label: 'Agents', command: '/agents', group: 'Agents', description: 'Manage Command Code agent configurations.' },
  { id: 'skills', label: 'Skills', command: '/skills', group: 'Agents', description: 'Browse and use available skills.' },
  { id: 'model', label: 'Model', command: '/model', group: 'Runtime', description: 'Switch or inspect the active model.' },
  { id: 'configure-models', label: 'Configure models', command: '/configure-models', group: 'Runtime', description: 'Route background tasks like compaction and session titles to specific models.' },
  { id: 'usage', label: 'Usage', command: '/usage', group: 'Runtime', description: 'Show credits and usage information.' },
  { id: 'context', label: 'Context', command: '/context', group: 'Runtime', description: 'Inspect context window usage.' },
  { id: 'memory', label: 'Memory', command: '/memory', group: 'Project', description: 'Manage project memory files.' },
  { id: 'taste', label: 'Taste', command: '/taste', group: 'Project', description: 'Manage taste learning packages.' },
  { id: 'mcp', label: 'MCP', command: '/mcp', group: 'Project', description: 'Manage MCP servers.' }
]
const commandGroups: CommandPaletteItem['group'][] = ['Session', 'Planning', 'Design', 'Agents', 'Runtime', 'Project']
const releaseNotes: Record<string, {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  command?: string
}> = {
  '0.32.3': {
    eyebrow: 'New in v0.32.3',
    title: '/configure-models',
    body: 'Routes background requests to a model of your choice, so the expensive work and the lightweight housekeeping work can use different models.',
    bullets: [
      'Run compaction on MiniMax M2.5.',
      'Assign session titles with DeepSeek V4 Flash.',
      'Pick a model for each task, then press r to reset.'
    ],
    command: '/configure-models'
  }
}
const appearanceOptions: Array<{
  id: AppearanceTheme
  name: string
  description: string
  swatch: string
}> = [
  {
    id: 'cc-spectrum',
    name: 'CC Spectrum',
    description: 'Black canvas, blueprint grid, and spectral Command Code runtime texture.',
    swatch: 'spectrum'
  },
  {
    id: 'terminal-minimal',
    name: 'Terminal Minimal',
    description: 'Quiet dark desktop surface with the least visual motion around the composer.',
    swatch: 'minimal'
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Crisp technical grid with cooler cyan and blue runtime blocks.',
    swatch: 'blueprint'
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Sharper borders, stronger text, and reduced color for long operating sessions.',
    swatch: 'contrast'
  }
]

function loadAppearanceTheme(): AppearanceTheme {
  const stored = localStorage.getItem(APPEARANCE_KEY)
  if (stored === 'terminal-minimal' || stored === 'blueprint' || stored === 'high-contrast') return stored
  return 'cc-spectrum'
}

function defaultCwd(): string {
  return localStorage.getItem('ccgui.cwd') || ''
}

function defaultCommand(): string {
  return localStorage.getItem('ccgui.command') || 'cmd'
}

function displayPath(input: string): string {
  if (!input.trim()) return 'No project selected'
  const parts = input.split('/').filter(Boolean)
  return parts.at(-1) || input
}

function loadRecentProjects(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[]
  } catch {
    return []
  }
}

function saveRecentProject(dir: string): string[] {
  if (!dir.trim()) return loadRecentProjects()
  const dirs = loadRecentProjects().filter((entry) => entry !== dir)
  dirs.unshift(dir)
  const next = dirs.slice(0, 8)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

function loadProjectModels(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_MODEL_KEY) || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function saveProjectModel(project: string, model: string): void {
  if (!project.trim()) return
  const projectModels = loadProjectModels()
  if (model.trim()) {
    projectModels[project] = model
  } else {
    delete projectModels[project]
  }
  localStorage.setItem(PROJECT_MODEL_KEY, JSON.stringify(projectModels))
}

function loadSeenReleaseNotes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RELEASE_NOTES_SEEN_KEY) || '[]') as string[]
  } catch {
    return []
  }
}

function loadNumberPreference(key: string, fallback: number, min: number, max: number): number {
  const raw = Number(localStorage.getItem(key))
  if (!Number.isFinite(raw)) return fallback
  return Math.min(max, Math.max(min, raw))
}

function markReleaseNoteSeen(version: string): void {
  const seen = loadSeenReleaseNotes()
  if (seen.includes(version)) return
  localStorage.setItem(RELEASE_NOTES_SEEN_KEY, JSON.stringify([...seen, version]))
}

function modeLabel(mode: RuntimeMode): string {
  return mode === 'mock' ? 'Demo mode' : 'Real session'
}

function permissionLabel(permissionMode: PermissionMode, trust: boolean): string {
  if (trust || permissionMode === 'auto-accept') return 'Full access'
  return 'Standard'
}

function isRiskyPermission(permissionMode: PermissionMode, trust: boolean): boolean {
  return trust || permissionMode === 'auto-accept'
}

function ptyHealthLabel(ptyHealth: PtyDoctorResult | null): string {
  if (!ptyHealth) return 'checking PTY'
  if (ptyHealth.healthy) return 'PTY connected'
  if (ptyHealth.available) return 'PTY unhealthy'
  return 'PTY unavailable'
}

function sessionModelLabel(model?: string): string {
  return model?.trim() || 'Default at start'
}

function looksPlanLike(input: string): boolean {
  return /\b(plan|planning|roadmap|approach|strategy)\b/i.test(input)
}

function updateStateFromResult(result: CommandCodeUpdateResult): UpdateState {
  if (!result.ok) return 'failed'
  if (result.updateAvailable) return 'available'
  return 'current'
}

function updateLabel(state: UpdateState, version?: string): string {
  if (state === 'checking') return 'Checking updates'
  if (state === 'updating') return 'Updating'
  if (state === 'available') return 'Update available'
  if (state === 'failed') return 'Update check failed'
  if (state === 'current') return version || 'Up to date'
  return 'Check updates'
}

let tabCounter = 1

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
  const [headlessJobs, setHeadlessJobs] = useState<HeadlessJob[]>([])
  const [viewingFile, setViewingFile] = useState<string | undefined>()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [rightInspector, setRightInspector] = useState<RightInspector>('none')
  const [bottomTerminalOpen, setBottomTerminalOpen] = useState(false)
  const [shellSessionId, setShellSessionId] = useState<string | undefined>()
  const [terminalInputEnabled, setTerminalInputEnabled] = useState(false)
  const [showAllRecentChats, setShowAllRecentChats] = useState(false)
  const [collapsedSidebarSections, setCollapsedSidebarSections] = useState<Record<SidebarSection, boolean>>({
    projects: false,
    recentChats: false,
    activeSessions: false
  })
  const [selectedTranscript, setSelectedTranscript] = useState<DiscoveredSession | undefined>()
  const [resumeFailure, setResumeFailure] = useState('')
  const [workEvents, setWorkEvents] = useState<WorkEvent[]>([])
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => loadNumberPreference(SIDEBAR_WIDTH_KEY, DEFAULT_SIDEBAR_WIDTH, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH))
  const [rightInspectorWidth, setRightInspectorWidth] = useState(() => loadNumberPreference(INSPECTOR_WIDTH_KEY, DEFAULT_INSPECTOR_WIDTH, INSPECTOR_MIN_WIDTH, INSPECTOR_MAX_WIDTH))
  const [openPopover, setOpenPopover] = useState<PopoverKey>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('profile')
  const [appearanceTheme, setAppearanceThemeState] = useState<AppearanceTheme>(loadAppearanceTheme)
  const [ptyHealth, setPtyHealth] = useState<PtyDoctorResult | null>(null)
  const [updateState, setUpdateState] = useState<UpdateState>('idle')
  const [updateVersion, setUpdateVersion] = useState<string | undefined>()
  const [updateDetails, setUpdateDetails] = useState('')
  const [releaseNoteVersion, setReleaseNoteVersion] = useState<string | undefined>()
  const jobCounter = useRef(1)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const startupUpdateCheckStarted = useRef(false)
  const appPreferencesHydrated = useRef(false)
  const appPreferenceSaveTimer = useRef<number | undefined>(undefined)
  const hydratedProjectRef = useRef<string | undefined>(undefined)
  const projectPreferenceSaveTimer = useRef<number | undefined>(undefined)

  const useMock = runtimeMode === 'mock'
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const workspaceView: WorkspaceView = settingsOpen ? 'settings' : activeTabId ? 'session' : selectedTranscript ? 'transcript' : 'home'
  const projectLabel = displayPath(cwd)
  const realSessionDisabled = Boolean(ptyHealth && (!ptyHealth.available || !ptyHealth.healthy))
  const riskyPermission = isRiskyPermission(permissionMode, trust)
  const showPlanSuggestion = looksPlanLike(composerPrompt) && !composerPrompt.trim().startsWith('/plan')
  const visibleRecentChats = showAllRecentChats ? projectSessions : projectSessions.slice(0, 4)

  const refreshPtyHealth = useCallback(async (): Promise<PtyDoctorResult> => {
    const result = await transport.ptyHealth()
    setPtyHealth(result)
    return result
  }, [transport])

  useEffect(() => {
    let cancelled = false
    refreshPtyHealth()
      .then((result) => {
        if (!cancelled) setPtyHealth(result)
      })
      .catch(() => {
        if (!cancelled) {
          setPtyHealth({
            healthy: false,
            shell: '',
            output: '',
            error: 'PTY health check failed',
            exitCode: null,
            signal: null,
            available: false
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [refreshPtyHealth])

  const checkForUpdates = useCallback(async (): Promise<void> => {
    setUpdateState('checking')
    try {
      const result = await transport.update(commandExecutable, cwd || '.', true)
      setUpdateState(updateStateFromResult(result))
      setUpdateVersion(result.version)
      setUpdateDetails((result.stdout || result.stderr).trim())
      if (result.ok && result.version && releaseNotes[result.version] && !loadSeenReleaseNotes().includes(result.version)) {
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

  useEffect(() => {
    let cancelled = false

    transport.loadAppPreferences()
      .then((result) => {
        if (cancelled || !result.ok || !result.preferences) return
        const prefs = result.preferences
        if (typeof prefs.cwd === 'string') {
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
        if (prefs.appearanceTheme === 'cc-spectrum' || prefs.appearanceTheme === 'terminal-minimal' || prefs.appearanceTheme === 'blueprint' || prefs.appearanceTheme === 'high-contrast') {
          setAppearanceThemeState(prefs.appearanceTheme)
          localStorage.setItem(APPEARANCE_KEY, prefs.appearanceTheme)
        }
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
    if (ptyHealth && (!ptyHealth.available || !ptyHealth.healthy) && runtimeMode === 'real-session') {
      setRuntimeModeState('mock')
      setStatusLine(ptyHealth.error || 'PTY unavailable. Using Demo mode.')
    }
  }, [ptyHealth, runtimeMode])

  useEffect(() => {
    if (!openPopover) return

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target
      if (target instanceof Node && popoverRef.current?.contains(target)) return
      setOpenPopover(null)
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpenPopover(null)
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openPopover])

  useEffect(() => {
    setTerminalInputEnabled(false)
  }, [activeTabId])

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
          if (prefs.runtimeMode === 'mock' || prefs.runtimeMode === 'real-session') {
            setRuntimeModeState(prefs.runtimeMode)
          }
          if (prefs.permissionMode === 'standard' || prefs.permissionMode === 'plan' || prefs.permissionMode === 'auto-accept') {
            setPermissionMode(prefs.permissionMode)
          }
          if (typeof prefs.trust === 'boolean') setTrust(prefs.trust)
          if (typeof prefs.skipOnboarding === 'boolean') setSkipOnboarding(prefs.skipOnboarding)
          if (typeof prefs.headlessMaxTurns === 'number') setHeadlessMaxTurns(prefs.headlessMaxTurns)
          if (typeof prefs.headlessYolo === 'boolean') setHeadlessYolo(prefs.headlessYolo)
          if (prefs.appearanceTheme === 'cc-spectrum' || prefs.appearanceTheme === 'terminal-minimal' || prefs.appearanceTheme === 'blueprint' || prefs.appearanceTheme === 'high-contrast') {
            setAppearanceThemeState(prefs.appearanceTheme)
            localStorage.setItem(APPEARANCE_KEY, prefs.appearanceTheme)
          }
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
    if (!cwd.trim()) {
      setProjectSessions([])
      if (shellSessionId) {
        void transport.forceKill(shellSessionId)
        setShellSessionId(undefined)
        setBottomTerminalOpen(false)
      }
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

  useEffect(() => {
    if (!cwd.trim() || hydratedProjectRef.current !== cwd) return

    if (projectPreferenceSaveTimer.current) {
      window.clearTimeout(projectPreferenceSaveTimer.current)
    }

    const preferences: ProjectGuiPreferences = {
      version: 1,
      projectPath: cwd,
      model,
      runtimeMode,
      permissionMode,
      trust,
      skipOnboarding,
      headlessMaxTurns,
      headlessYolo,
      appearanceTheme,
      updatedAt: new Date().toISOString()
    }

    projectPreferenceSaveTimer.current = window.setTimeout(() => {
      void transport.saveProjectPreferences(cwd, preferences)
    }, 500)

    return () => {
      if (projectPreferenceSaveTimer.current) window.clearTimeout(projectPreferenceSaveTimer.current)
    }
  }, [transport, cwd, model, runtimeMode, permissionMode, trust, skipOnboarding, headlessMaxTurns, headlessYolo, appearanceTheme])

  useEffect(() => {
    if (!appPreferencesHydrated.current) return

    if (appPreferenceSaveTimer.current) {
      window.clearTimeout(appPreferenceSaveTimer.current)
    }

    const preferences: AppGuiPreferences = {
      version: 1,
      cwd,
      recentProjects,
      commandExecutable,
      model,
      projectModels: loadProjectModels(),
      appearanceTheme,
      releaseNotesSeen: loadSeenReleaseNotes(),
      sidebarWidth,
      rightInspectorWidth,
      updatedAt: new Date().toISOString()
    }

    appPreferenceSaveTimer.current = window.setTimeout(() => {
      void transport.saveAppPreferences(preferences)
    }, 500)

    return () => {
      if (appPreferenceSaveTimer.current) window.clearTimeout(appPreferenceSaveTimer.current)
    }
  }, [transport, cwd, recentProjects, commandExecutable, model, appearanceTheme, sidebarWidth, rightInspectorWidth])

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
    setAppearanceThemeState(value)
    localStorage.setItem(APPEARANCE_KEY, value)
  }

  const setRuntimeMode = (mode: RuntimeMode): void => {
    if (mode === 'real-session' && realSessionDisabled) return
    setRuntimeModeState(mode)
    setOpenPopover(null)
  }

  const writeComposerSubmit = async (sessionId: string, prompt: string, mock: boolean): Promise<void> => {
    if (mock) {
      await transport.write(sessionId, `${prompt.trim()}\r`)
      return
    }

    for (const chunk of buildPtySubmitChunks(prompt)) {
      await transport.write(sessionId, chunk)
      await new Promise((resolve) => window.setTimeout(resolve, PTY_KEYSTROKE_DELAY_MS))
    }
  }

  const addWorkEvent = (label: string, detail: string, tone: WorkEvent['tone'] = 'default'): void => {
    setWorkEvents((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, label, detail, tone },
      ...prev
    ].slice(0, 12))
  }

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

  const cwdReady = useMemo(() => Boolean(cwd.trim()) || useMock, [cwd, useMock])

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
      const newTab: SessionTab = {
        id: result.id,
        label,
        mock: result.mock,
        model: result.model,
        stopRequested: false,
        stopStage: 0,
        transcriptPath: result.transcriptPath,
        projectLabel,
        runtimeMode: effectiveRuntimeMode,
        resumedSession: resumeSession
      }

      setTabs((prev) => [...prev, newTab])
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
    setRightInspector('transcript')
    await startSession(undefined, session, { keepTranscriptInspector: true })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 't') return
      event.preventDefault()
      openNewProjectSession()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  })

  const openTranscriptSession = (session: DiscoveredSession): void => {
    setSelectedTranscript(session)
    setResumeFailure('')
    setSettingsOpen(false)
    setOpenPopover(null)
    setRightInspector('transcript')
    addWorkEvent('Resuming context', session.title || session.id)
    void startSession(undefined, session, { keepTranscriptInspector: true })
  }

  const runHeadless = async (prompt: string, maxTurns: number, yolo: boolean, plan = false): Promise<void> => {
    if (!prompt.trim()) return
    if (!cwd.trim() && !useMock) {
      setStatusLine('Choose a project directory before running headless.')
      return
    }

    const job: HeadlessJob = {
      id: `job-${jobCounter.current++}`,
      timestamp: Date.now(),
      prompt,
      model: model || undefined,
      mock: useMock
    }
    setHeadlessJobs((prev) => [job, ...prev].slice(0, 30))
    setStatusLine('Running headless job...')

    try {
      const result: HeadlessRunResult = await transport.runHeadless({
        cwd: cwd || '.',
        commandExecutable,
        prompt,
        model: model || undefined,
        permissionMode,
        maxTurns,
        yolo,
        plan,
        trust,
        skipOnboarding,
        timeoutMs: 10 * 60 * 1000,
        useMock
      })
      setHeadlessJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, result } : j))
      notify('Headless job complete', 'headless-complete')
      playChime('headless-complete')
      setStatusLine(`Headless job exited with code=${result.exitCode ?? 'null'}`)
    } catch {
      notify('Headless job failed', 'headless-error')
      playChime('headless-error')
      setStatusLine('Headless job failed.')
      setHeadlessJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, result: {
        command: commandExecutable,
        args: [],
        cwd: cwd || '.',
        exitCode: 1,
        signal: null,
        stdout: '',
        stderr: 'Failed to execute headless job',
        timedOut: false,
        durationMs: 0
      }} : j))
    }
  }

  const submitComposer = async (): Promise<void> => {
    const prompt = composerPrompt.trim()
    if (!prompt) return

    if (activeTabId) {
      await writeComposerSubmit(activeTabId, prompt, Boolean(activeTab?.mock))
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

  const updateTab = (id: string, update: Partial<SessionTab>) => {
    setTabs((prev) => prev.map((t) => t.id === id ? { ...t, ...update } : t))
  }

  const removeTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id))
    setActiveTabId((prev) => prev === id ? undefined : prev)
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

  const runCheck = async (): Promise<void> => {
    const [result, pty] = await Promise.all([
      transport.check(commandExecutable),
      refreshPtyHealth().catch(() => null)
    ])
    const ptySuffix = pty ? ` · ${ptyHealthLabel(pty)}` : ''
    setStatusLine(result.ok ? `OK ${result.command}: ${result.version || result.stdout.trim()}${ptySuffix}` : `Failed: ${result.stderr || result.error}${ptySuffix}`)
  }

  const toggleSidebarSection = (section: SidebarSection): void => {
    setCollapsedSidebarSections((current) => ({ ...current, [section]: !current[section] }))
  }

  const closeShellTerminal = async (): Promise<void> => {
    if (shellSessionId) {
      await transport.forceKill(shellSessionId)
    }
    setShellSessionId(undefined)
    setBottomTerminalOpen(false)
  }

  const openShellTerminal = async (): Promise<void> => {
    if (!cwd.trim()) {
      setStatusLine('Choose a project directory before opening a terminal.')
      return
    }

    setBottomTerminalOpen(true)
    if (shellSessionId) return

    try {
      const result = await transport.startSession({
        cwd,
        terminalMode: 'shell',
        cols: 120,
        rows: 22,
        useMock: false
      })
      setShellSessionId(result.id)
      setStatusLine(`Terminal opened in ${displayPath(result.cwd)}.`)
      addWorkEvent('Terminal opened', `Shell session in ${displayPath(result.cwd)}`)
    } catch (err) {
      setBottomTerminalOpen(false)
      const message = err instanceof Error ? err.message : 'Failed to open terminal'
      setStatusLine(message)
      notify(`Terminal failed: ${message}`, 'session-error')
    }
  }

  const toggleShellTerminal = async (): Promise<void> => {
    if (bottomTerminalOpen) {
      await closeShellTerminal()
      return
    }
    await openShellTerminal()
  }

  const runUpdate = async (): Promise<void> => {
    setUpdateState('updating')
    setStatusLine('Updating Command Code...')
    try {
      const result = await transport.update(commandExecutable, cwd || '.', false)
      setUpdateState(updateStateFromResult(result))
      setUpdateVersion(result.version)
      setUpdateDetails((result.stdout || result.stderr).trim())
      if (result.ok && result.version && releaseNotes[result.version]) {
        setReleaseNoteVersion(result.version)
      }
      setStatusLine(result.ok ? (result.stdout || 'Command Code update complete.').trim() : (result.stderr || result.error || 'Command Code update failed.'))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Command Code update failed.'
      setUpdateState('failed')
      setUpdateDetails(message)
      setStatusLine(message)
    }
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

  const saveCurrentAppPreferences = (): void => {
    void transport.saveAppPreferences({
      version: 1,
      cwd,
      recentProjects,
      commandExecutable,
      model,
      projectModels: loadProjectModels(),
      appearanceTheme,
      releaseNotesSeen: loadSeenReleaseNotes(),
      sidebarWidth,
      rightInspectorWidth,
      updatedAt: new Date().toISOString()
    })
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

  const dismissReleaseNotes = (): void => {
    if (releaseNoteVersion) {
      markReleaseNoteSeen(releaseNoteVersion)
      saveCurrentAppPreferences()
    }
    setReleaseNoteVersion(undefined)
  }

  const startSidebarResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = sidebarWidth

    const onMove = (moveEvent: PointerEvent): void => {
      const rawWidth = startWidth + moveEvent.clientX - startX
      if (rawWidth <= SIDEBAR_COLLAPSE_WIDTH) {
        setRailCollapsed(true)
        return
      }
      const nextWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, rawWidth))
      setRailCollapsed(false)
      setSidebarWidth(nextWidth)
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(nextWidth))
    }

    const onUp = (): void => {
      document.body.classList.remove('is-resizing-panel')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    document.body.classList.add('is-resizing-panel')
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }

  const startInspectorResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = rightInspectorWidth

    const onMove = (moveEvent: PointerEvent): void => {
      const rawWidth = startWidth - (moveEvent.clientX - startX)
      if (rawWidth <= INSPECTOR_COLLAPSE_WIDTH) {
        setRightInspector('none')
        return
      }
      const nextWidth = Math.min(INSPECTOR_MAX_WIDTH, Math.max(INSPECTOR_MIN_WIDTH, rawWidth))
      setRightInspectorWidth(nextWidth)
      localStorage.setItem(INSPECTOR_WIDTH_KEY, String(nextWidth))
    }

    const onUp = (): void => {
      document.body.classList.remove('is-resizing-panel')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    document.body.classList.add('is-resizing-panel')
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
  }

  const openTerminalExpansion = (): void => {
    if (!activeTab) return
    setRightInspector('transcript')
    addWorkEvent('Opened terminal details', 'Ctrl+O opened the active transcript in the inspector.')
  }

  const openNewProjectSession = (): void => {
    setSettingsOpen(false)
    setSelectedTranscript(undefined)
    void startSession()
  }

  const onExit = useCallback((payload: SessionExitPayload): void => {
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
  }, [tabs])

  return (
    <ShellLayout
      appearanceTheme={appearanceTheme}
      railCollapsed={railCollapsed}
      sidebarWidth={sidebarWidth}
      rightInspectorWidth={rightInspectorWidth}
      settingsOpen={settingsOpen}
      settingsSection={settingsSection}
      collapsedSidebarSections={collapsedSidebarSections}
      projectLabel={projectLabel}
      cwd={cwd}
      recentProjects={recentProjects}
      projectSessions={projectSessions}
      visibleRecentChats={visibleRecentChats}
      tabs={tabs}
      activeTabId={activeTabId}
      showAllRecentChats={showAllRecentChats}
      openPopover={openPopover}
      updateState={updateState}
      updateVersion={updateVersion}
      updateDetails={updateDetails}
      onSidebarResizeStart={startSidebarResize}
      onToggleRailCollapsed={() => setRailCollapsed((value) => !value)}
      onBackFromSettings={() => setSettingsOpen(false)}
      onSettingsSectionChange={setSettingsSection}
      onNewSession={() => { setSettingsOpen(false); setOpenPopover(null); setActiveTabId(undefined); setSelectedTranscript(undefined); setRightInspector('none') }}
      onSearch={() => setOpenPopover(null)}
      onToggleProjectPopover={() => { setSettingsOpen(false); setOpenPopover(openPopover === 'project' ? null : 'project') }}
      onToggleRuntimePopover={() => { setSettingsOpen(false); setOpenPopover(openPopover === 'runtime' ? null : 'runtime') }}
      onToggleSidebarSection={toggleSidebarSection}
      onOpenProjectPopover={() => { setSettingsOpen(false); setOpenPopover('project') }}
      onSelectRecentProject={(project) => { setSettingsOpen(false); setCwd(project) }}
      onOpenTranscriptSession={openTranscriptSession}
      onToggleRecentChats={() => setShowAllRecentChats((value) => !value)}
      onSelectActiveTab={(id) => { setSettingsOpen(false); setActiveTabId(id) }}
      onOpenSettings={() => { setRailCollapsed(false); setOpenPopover(null); setSettingsOpen(true); setSettingsSection('profile') }}
      onUpdateClick={() => { setOpenPopover(null); updateState === 'available' ? void runUpdate() : void checkForUpdates() }}
      updateLabel={updateLabel}
    >
        {workspaceView === 'settings' ? (
          <SettingsWorkspace
            section={settingsSection}
            cwd={cwd}
            projectLabel={projectLabel}
            commandExecutable={commandExecutable}
            setCommandExecutable={setCommandExecutable}
            model={model}
            setModel={setModelPersisted}
            transport={transport}
            ptyHealth={ptyHealth}
            permissionMode={permissionMode}
            setPermissionMode={setPermissionMode}
            trust={trust}
            setTrust={setTrust}
            skipOnboarding={skipOnboarding}
            setSkipOnboarding={setSkipOnboarding}
            headlessYolo={headlessYolo}
            setHeadlessYolo={setHeadlessYolo}
            headlessMaxTurns={headlessMaxTurns}
            setHeadlessMaxTurns={setHeadlessMaxTurns}
            headlessJobs={headlessJobs}
            clearHeadlessJobs={() => setHeadlessJobs([])}
            sessionCount={tabs.length}
            runtimeMode={runtimeMode}
            appearanceTheme={appearanceTheme}
            setAppearanceTheme={setAppearanceTheme}
            runCheck={runCheck}
            openConfigureModels={openConfigureModels}
            openDocs={() => openRightInspector('docs')}
            openAdvanced={() => setAdvancedOpen(true)}
          />
        ) : workspaceView === 'home' ? (
          <section className="home-workspace" aria-label="New session">
            <div className="home-composer-wrap">
              <h1>What should Command Code do?</h1>
              <ComposerBar
                active={false}
                prompt={composerPrompt}
                setPrompt={setComposerPrompt}
                onSubmit={submitComposer}
                showPlanSuggestion={showPlanSuggestion}
                onPlanMode={usePlanMode}
                projectLabel={projectLabel}
                modelLabel={model || 'Default'}
                permissionLabel={permissionLabel(permissionMode, trust)}
                riskyPermission={riskyPermission}
                onProject={() => setOpenPopover(openPopover === 'project' ? null : 'project')}
                onPermission={() => setOpenPopover(openPopover === 'permission' ? null : 'permission')}
                onModel={() => setOpenPopover(openPopover === 'model' ? null : 'model')}
                onSlash={() => setOpenPopover(openPopover === 'slash' ? null : 'slash')}
              />
              <div className="home-status-row">
                <span>{runtimeMode === 'mock' ? 'demo runtime' : 'real session'}</span>
                <span>{ptyHealthLabel(ptyHealth)}</span>
                <span>{model || 'default model'}</span>
                <span>{statusLine || 'idle'}</span>
              </div>
            </div>
          </section>
        ) : workspaceView === 'transcript' && selectedTranscript ? (
          <div className={`workbench-shell ${rightInspector !== 'none' ? 'workbench-shell--with-inspector' : ''}`}>
            <TranscriptWorkspace
              session={selectedTranscript}
              transport={transport}
              statusLine={statusLine}
              resumeFailure={resumeFailure}
              workEvents={workEvents}
              onResume={() => void resumeProjectSession(selectedTranscript)}
              onReveal={() => transport.revealTranscript(selectedTranscript.transcriptPath)}
              onOpenTranscript={() => openRightInspector('transcript')}
            />
            <RightInspectorPanel
              mode={rightInspector}
              transport={transport}
              cwd={cwd}
              commandExecutable={commandExecutable}
              filePath={viewingFile}
              transcript={selectedTranscript}
              onClose={() => setRightInspector('none')}
              onSelectFile={(path) => { setViewingFile(path); setRightInspector('file'); addWorkEvent('Opened file', displayPath(path)) }}
              onOpenFiles={() => setRightInspector('files')}
              onOpenTranscript={() => setRightInspector('transcript')}
              onOpenDocs={() => setRightInspector('docs')}
              onOpenAdvanced={() => setRightInspector('advanced')}
              onRevealTranscript={() => transport.revealTranscript(selectedTranscript.transcriptPath)}
              onOpenSettings={() => { setRailCollapsed(false); setOpenPopover(null); setSettingsOpen(true); setSettingsSection('profile') }}
              onResizeStart={startInspectorResize}
            />
          </div>
        ) : (
          <div className={`workbench-shell ${rightInspector !== 'none' ? 'workbench-shell--with-inspector' : ''}`}>
            <section className={`session-workspace ${bottomTerminalOpen ? 'session-workspace--bottom-terminal' : ''}`} aria-label="Active session">
              <header className="session-header session-header--compact">
                <div className="session-title-group">
                  <div className="session-title">{activeTab?.label || 'Session'}</div>
                  <div className="session-context">
                    <span>{activeTab?.projectLabel || projectLabel}</span>
                    <StatusPill label={sessionModelLabel(activeTab?.model)} tone="default" />
                    <StatusPill label={activeTab?.mock ? 'mock' : 'real cli'} tone={activeTab?.mock ? 'purple' : 'warn'} />
                    <StatusPill label={permissionLabel(permissionMode, trust)} tone={riskyPermission ? 'warn' : permissionMode === 'plan' ? 'purple' : 'default'} />
                  </div>
                </div>
                <WorkbenchToolRail
                  rightInspector={rightInspector}
                  bottomTerminalOpen={bottomTerminalOpen}
                  onOpenIde={() => openRightInspector('ide')}
                  onOpenEnvironment={() => openRightInspector('environment')}
                  onToggleTerminal={() => void toggleShellTerminal()}
                  onToggleInspector={() => openRightInspector(rightInspector === 'none' ? 'files' : 'none')}
                />
              </header>

              <TabBar tabs={tabs} activeId={activeTabId} onSelect={setActiveTabId} onKill={killTab} />

              <section className="terminal-card native-terminal-card">
                <TerminalPane
                  transport={transport}
                  sessionId={activeTabId}
                  inputEnabled={terminalInputEnabled}
                  onInputRequest={() => setTerminalInputEnabled(true)}
                  onInputCommit={() => setTerminalInputEnabled(false)}
                  onExit={onExit}
                  onExpandRequest={openTerminalExpansion}
                />
              </section>

              {bottomTerminalOpen && shellSessionId && (
                <section className="bottom-terminal-panel" aria-label="Bottom terminal">
                  <header className="bottom-terminal-header">
                    <span>Terminal · {projectLabel}</span>
                    <button className="icon-button" onClick={() => void closeShellTerminal()} title="Close bottom terminal"><X size={15} /></button>
                  </header>
                  <TerminalPane
                    transport={transport}
                    sessionId={shellSessionId}
                    compact
                    notifyResponses={false}
                    onExit={() => {
                      setShellSessionId(undefined)
                      setBottomTerminalOpen(false)
                      setStatusLine('Terminal exited.')
                    }}
                  />
                </section>
              )}

              <div className="session-composer">
                <div className="session-utility-row">
                  <button className="ghost-button native-ghost" onClick={stopSession}>Stop</button>
                  <span>{terminalInputEnabled ? 'Menu input enabled. Use terminal menus, then return to the composer.' : (statusLine || 'Click terminal for menus; use composer for prompts.')}</span>
                  <button
                    className={`ghost-button native-ghost terminal-input-toggle ${terminalInputEnabled ? 'terminal-input-toggle--active' : ''}`}
                    onClick={() => setTerminalInputEnabled((value) => !value)}
                    title="Temporarily route keyboard input to Command Code terminal menus"
                  >
                    <Keyboard size={14} />
                    Menu input
                  </button>
                </div>
                <ComposerBar
                  active
                  prompt={composerPrompt}
                  setPrompt={setComposerPrompt}
                  onSubmit={submitComposer}
                  onFocus={() => setTerminalInputEnabled(false)}
                  showPlanSuggestion={showPlanSuggestion}
                  onPlanMode={usePlanMode}
                  projectLabel={projectLabel}
                  modelLabel={sessionModelLabel(activeTab?.model)}
                  permissionLabel={permissionLabel(permissionMode, trust)}
                  riskyPermission={riskyPermission}
                  onProject={() => setOpenPopover(openPopover === 'project' ? null : 'project')}
                  onPermission={() => setOpenPopover(openPopover === 'permission' ? null : 'permission')}
                  onModel={() => setOpenPopover(openPopover === 'model' ? null : 'model')}
                  onSlash={() => setOpenPopover(openPopover === 'slash' ? null : 'slash')}
                />
              </div>
            </section>
            <RightInspectorPanel
              mode={rightInspector}
              transport={transport}
              cwd={cwd}
              commandExecutable={commandExecutable}
              filePath={viewingFile}
              transcript={selectedTranscript || projectSessions[0] || (activeTab ? {
                id: activeTab.id,
                timestamp: new Date().toISOString(),
                transcriptPath: activeTab.transcriptPath,
                sizeBytes: 0,
                title: activeTab.label,
                cwd,
                model: activeTab.model,
                source: 'global'
              } : undefined)}
              onClose={() => setRightInspector('none')}
              onSelectFile={(path) => { setViewingFile(path); setRightInspector('file'); addWorkEvent('Opened file', displayPath(path)) }}
              onOpenFiles={() => setRightInspector('files')}
              onOpenTranscript={() => setRightInspector('transcript')}
              onOpenDocs={() => setRightInspector('docs')}
              onOpenAdvanced={() => setRightInspector('advanced')}
              onRevealTranscript={() => activeTab?.transcriptPath && transport.revealTranscript(activeTab.transcriptPath)}
              onOpenSettings={() => { setRailCollapsed(false); setOpenPopover(null); setSettingsOpen(true); setSettingsSection('profile') }}
              onResizeStart={startInspectorResize}
            />
          </div>
        )}

        {openPopover === 'project' && (
          <div ref={popoverRef} className="native-popover project-popover">
            <div className="popover-title">Project</div>
            <button className="popover-row" onClick={chooseProject}><FolderOpen size={16} /> Choose folder...</button>
            {recentProjects.map((project) => (
              <button key={project} className="popover-row" onClick={() => { setCwd(project); setOpenPopover(null) }} title={project}>
                <Folder size={16} /> {displayPath(project)}
              </button>
            ))}
          </div>
        )}

        {openPopover === 'mode' && (
          <div ref={popoverRef} className="native-popover mode-popover">
            <div className="popover-title">Session</div>
            <button
              className={`popover-row ${runtimeMode === 'real-session' ? 'popover-row--active' : ''}`}
              disabled={realSessionDisabled}
              onClick={() => setRuntimeMode('real-session')}
              title={realSessionDisabled ? (ptyHealth?.error || 'PTY is unhealthy') : 'Start a real PTY session'}
            >
              Real session
            </button>
            <button className={`popover-row ${runtimeMode === 'mock' ? 'popover-row--active' : ''}`} onClick={() => setRuntimeMode('mock')}>Demo mode</button>
            <div className="popover-note">Headless runs now live in the command menu as Run headless.</div>
            {realSessionDisabled && <div className="popover-note">{ptyHealth?.error || 'Real session disabled until PTY is healthy.'}</div>}
          </div>
        )}

        {openPopover === 'permission' && (
          <div ref={popoverRef} className="native-popover permission-popover">
            <div className="popover-title">Access</div>
            <button className={`popover-row ${permissionMode === 'standard' && !trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('standard'); setTrust(false); setOpenPopover(null) }}>
              Standard
              <span className="popover-row-description">Prompt before risky tool use.</span>
            </button>
            <button className={`popover-row popover-row--warn ${permissionMode === 'auto-accept' && !trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('auto-accept'); setTrust(false); setOpenPopover(null) }}>
              Full access
              <span className="popover-row-description">Auto-accept Command Code tool prompts.</span>
            </button>
            <button className={`popover-row popover-row--warn ${trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('standard'); setTrust(true); setOpenPopover(null) }}>
              Trust project
              <span className="popover-row-description">Pass --trust for this project.</span>
            </button>
          </div>
        )}

        {openPopover === 'runtime' && (
          <div ref={popoverRef} className="native-popover runtime-popover">
            <div className="popover-title">Runtime</div>
            <label className="field-label">Command binary</label>
            <input className="native-input" value={commandExecutable} onChange={(event) => setCommandExecutable(event.target.value)} />
            <div className="runtime-grid">
              <button className="ghost-button native-ghost" onClick={runCheck}>Check CLI</button>
              <button className="ghost-button native-ghost" onClick={() => transport.openExternal('https://commandcode.ai/docs/reference/cli')}>CLI docs</button>
              <button className="ghost-button native-ghost" onClick={() => openRightInspector('docs')}>Docs</button>
              <button className="ghost-button native-ghost" onClick={() => setAdvancedOpen(true)}>Advanced</button>
            </div>
            <label className="checkbox-row"><input type="checkbox" checked={skipOnboarding} onChange={(event) => setSkipOnboarding(event.target.checked)} /> Skip onboarding</label>
            <label className="checkbox-row"><input type="checkbox" checked={runtimeMode === 'mock'} onChange={(event) => setRuntimeMode(event.target.checked ? 'mock' : 'real-session')} disabled={!ptyHealth?.healthy && runtimeMode === 'mock'} /> Use Demo mode</label>
            <label className="checkbox-row"><input type="checkbox" checked={headlessYolo} onChange={(event) => setHeadlessYolo(event.target.checked)} /> Allow write tools in headless commands</label>
            <label className="field-label">Headless max turns</label>
            <input className="native-input" type="number" min={1} max={100} value={headlessMaxTurns} onChange={(event) => setHeadlessMaxTurns(Number(event.target.value) || 1)} />
            <ModelDropdown transport={transport} model={model} setModel={setModelPersisted} commandExecutable={commandExecutable} cwd={cwd} onConfigureModels={openConfigureModels} />
            <AuthCard transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
            <IdePanel transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
            <HeadlessHistory jobs={headlessJobs} onClear={() => setHeadlessJobs([])} />
          </div>
        )}

        {openPopover === 'model' && (
          <div ref={popoverRef} className="native-popover model-popover">
            <div className="popover-title">Model</div>
            <ModelDropdown transport={transport} model={model} setModel={(value) => { setModelPersisted(value); setOpenPopover(null) }} commandExecutable={commandExecutable} cwd={cwd} onConfigureModels={openConfigureModels} />
          </div>
        )}

        {openPopover === 'slash' && (
          <div ref={popoverRef} className="native-popover slash-popover">
            <div className="popover-title">Commands</div>
            {commandGroups.map((group) => (
              <div key={group} className="command-group">
                <div className="command-group-title">{group}</div>
                {commandPaletteItems.filter((item) => item.group === group).map((item) => (
                  <button key={item.id} className="popover-row command-row" onClick={() => void runCommand(item)}>
                    <span className="command-row-main">
                      <strong>{item.label}</strong>
                      <code>{item.command}</code>
                    </span>
                    <span className="popover-row-description">{item.description}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <AdvancedPanel
          transport={transport}
          commandExecutable={commandExecutable}
          cwd={cwd}
          onResumeSession={resumeProjectSession}
          visible={advancedOpen}
          onClose={() => setAdvancedOpen(false)}
        />
        {releaseNoteVersion && releaseNotes[releaseNoteVersion] && (
          <ReleaseNotesModal
            version={releaseNoteVersion}
            note={releaseNotes[releaseNoteVersion]}
            onClose={dismissReleaseNotes}
            onConfigureModels={openConfigureModels}
          />
        )}
    </ShellLayout>
  )
}

function WorkbenchToolRail({
  rightInspector,
  bottomTerminalOpen,
  onOpenIde,
  onOpenEnvironment,
  onToggleTerminal,
  onToggleInspector
}: {
  rightInspector: RightInspector
  bottomTerminalOpen: boolean
  onOpenIde: () => void
  onOpenEnvironment: () => void
  onToggleTerminal: () => void
  onToggleInspector: () => void
}): JSX.Element {
  return (
    <div className="workbench-tool-rail" aria-label="Workbench tools">
      <button className={`icon-button ${rightInspector === 'ide' ? 'icon-button--active' : ''}`} onClick={onOpenIde} title="IDE and Finder">
        <HardDrive size={17} />
      </button>
      <button className={`icon-button ${rightInspector === 'environment' ? 'icon-button--active' : ''}`} onClick={onOpenEnvironment} title="Environment">
        <GitBranch size={17} />
      </button>
      <button className={`icon-button ${bottomTerminalOpen ? 'icon-button--active' : ''}`} onClick={onToggleTerminal} title="Bottom terminal">
        <PanelBottom size={17} />
      </button>
      <button className={`icon-button ${rightInspector !== 'none' ? 'icon-button--active' : ''}`} onClick={onToggleInspector} title="Right sidebar">
        <PanelRightOpen size={17} />
      </button>
    </div>
  )
}

function ReleaseNotesModal({
  version,
  note,
  onClose,
  onConfigureModels
}: {
  version: string
  note: typeof releaseNotes[string]
  onClose: () => void
  onConfigureModels: () => Promise<void>
}): JSX.Element {
  return (
    <div className="release-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="release-modal" role="dialog" aria-modal="true" aria-labelledby="release-title" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button release-close" onClick={onClose} title="Dismiss release notes"><X size={18} /></button>
        <div className="release-eyebrow"><Sparkles size={16} /> {note.eyebrow}</div>
        <h2 id="release-title">{note.title}</h2>
        <p>{note.body}</p>
        <ul>
          {note.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
        <div className="release-actions">
          {note.command && (
            <button className="primary-button release-primary" onClick={() => void onConfigureModels()}>
              <Route size={16} /> Open {note.command}
            </button>
          )}
          <button className="ghost-button native-ghost" onClick={onClose}>Not now</button>
        </div>
        <div className="release-footnote">Command Code {version} is installed. These notes are stored locally after dismissal.</div>
      </section>
    </div>
  )
}

type SettingsWorkspaceProps = {
  section: SettingsSection
  cwd: string
  projectLabel: string
  commandExecutable: string
  setCommandExecutable: (value: string) => void
  model: string
  setModel: (value: string) => void
  transport: TransportAPI
  ptyHealth: PtyDoctorResult | null
  permissionMode: PermissionMode
  setPermissionMode: (value: PermissionMode) => void
  trust: boolean
  setTrust: (value: boolean) => void
  skipOnboarding: boolean
  setSkipOnboarding: (value: boolean) => void
  headlessYolo: boolean
  setHeadlessYolo: (value: boolean) => void
  headlessMaxTurns: number
  setHeadlessMaxTurns: (value: number) => void
  headlessJobs: HeadlessJob[]
  clearHeadlessJobs: () => void
  sessionCount: number
  runtimeMode: RuntimeMode
  appearanceTheme: AppearanceTheme
  setAppearanceTheme: (value: AppearanceTheme) => void
  runCheck: () => Promise<void>
  openConfigureModels: () => Promise<void>
  openDocs: () => void
  openAdvanced: () => void
}

function SettingsWorkspace({
  section,
  cwd,
  projectLabel,
  commandExecutable,
  setCommandExecutable,
  model,
  setModel,
  transport,
  ptyHealth,
  permissionMode,
  setPermissionMode,
  trust,
  setTrust,
  skipOnboarding,
  setSkipOnboarding,
  headlessYolo,
  setHeadlessYolo,
  headlessMaxTurns,
  setHeadlessMaxTurns,
  headlessJobs,
  clearHeadlessJobs,
  sessionCount,
  runtimeMode,
  appearanceTheme,
  setAppearanceTheme,
  runCheck,
  openConfigureModels,
  openDocs,
  openAdvanced
}: SettingsWorkspaceProps): JSX.Element {
  const runtimeHealth = ptyHealth ? (ptyHealth.healthy ? 'Healthy' : 'Unavailable') : 'Checking'
  const completedHeadless = headlessJobs.filter((job) => job.result).length
  const failedHeadless = headlessJobs.filter((job) => job.result && job.result.exitCode !== 0).length

  return (
    <section className="settings-workspace" aria-label="Settings">
      <main className="settings-page">
        {section === 'profile' && (
          <div className="settings-profile-page">
            <div className="settings-page-title">Profile</div>
            <div className="profile-hero">
              <div className="profile-avatar">CC</div>
              <div className="profile-name">Command Code</div>
              <div className="profile-meta">Local desktop adapter · {model || 'Default model'}</div>
            </div>
            <div className="profile-stat-strip">
              <div><strong>{sessionCount}</strong><span>Open sessions</span></div>
              <div><strong>{headlessJobs.length}</strong><span>Headless runs</span></div>
              <div><strong>{completedHeadless}</strong><span>Completed runs</span></div>
              <div><strong>{runtimeHealth}</strong><span>PTY health</span></div>
              <div><strong>{permissionLabel(permissionMode, trust)}</strong><span>Permissions</span></div>
            </div>
            <div className="settings-profile-grid">
              <section>
                <h3>Activity insights</h3>
                <dl>
                  <div><dt>Runtime mode</dt><dd>{modeLabel(runtimeMode)}</dd></div>
                  <div><dt>Current project</dt><dd>{projectLabel}</dd></div>
                  <div><dt>Command binary</dt><dd>{commandExecutable}</dd></div>
                  <div><dt>Failed headless runs</dt><dd>{failedHeadless}</dd></div>
                </dl>
              </section>
              <section>
                <h3>Runtime receipts</h3>
                <dl>
                  <div><dt>PTY shell</dt><dd>{ptyHealth?.shell || 'Not available'}</dd></div>
                  <div><dt>Project path</dt><dd>{cwd || 'No project selected'}</dd></div>
                  <div><dt>Model override</dt><dd>{model || 'Default'}</dd></div>
                  <div><dt>Trust flag</dt><dd>{trust ? 'Enabled' : 'Disabled'}</dd></div>
                </dl>
              </section>
            </div>
          </div>
        )}

        {section === 'general' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">General</div>
            <div className="settings-card">
              <label className="field-label">Command binary</label>
              <input className="native-input" value={commandExecutable} onChange={(event) => setCommandExecutable(event.target.value)} />
              <label className="checkbox-row"><input type="checkbox" checked={skipOnboarding} onChange={(event) => setSkipOnboarding(event.target.checked)} /> Skip Command Code onboarding prompts</label>
              <button className="ghost-button native-ghost settings-inline-action" onClick={() => void runCheck()}>Check CLI</button>
            </div>
          </div>
        )}

        {section === 'runtime' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Runtime</div>
            <div className="settings-card settings-card--wide">
              <div className="settings-status-row">
                <span>Mode</span><strong>{modeLabel(runtimeMode)}</strong>
                <span>PTY</span><strong>{runtimeHealth}</strong>
              </div>
              <div className="settings-permission-grid">
                {(['standard', 'auto-accept'] as PermissionMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={`popover-row ${permissionMode === mode && !trust ? 'popover-row--active' : ''} ${mode === 'auto-accept' ? 'popover-row--warn' : ''}`}
                    onClick={() => { setPermissionMode(mode); setTrust(false) }}
                  >
                    {mode}
                  </button>
                ))}
                <button className={`popover-row popover-row--warn ${trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('standard'); setTrust(true) }}>trust</button>
              </div>
              <ModelDropdown transport={transport} model={model} setModel={setModel} commandExecutable={commandExecutable} cwd={cwd} onConfigureModels={openConfigureModels} />
              <AuthCard transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
              <IdePanel transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
            </div>
          </div>
        )}

        {section === 'appearance' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Appearance</div>
            <div className="settings-card settings-card--wide">
              <div className="appearance-options" role="radiogroup" aria-label="Appearance theme">
                {appearanceOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`appearance-option ${appearanceTheme === option.id ? 'appearance-option--selected' : ''}`}
                    onClick={() => setAppearanceTheme(option.id)}
                    role="radio"
                    aria-checked={appearanceTheme === option.id}
                  >
                    <span className={`appearance-preview appearance-preview--${option.swatch}`} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className="appearance-option-copy">
                      <strong>{option.name}</strong>
                      <span>{option.description}</span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="settings-muted">Theme changes are saved on this machine and only affect the desktop adapter presentation. Command Code CLI behavior and permission semantics stay unchanged.</p>
            </div>
          </div>
        )}

        {section === 'usage' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Usage</div>
            <div className="settings-card settings-card--wide">
              <div className="settings-status-row">
                <span>Open sessions</span><strong>{sessionCount}</strong>
                <span>Headless runs</span><strong>{headlessJobs.length}</strong>
              </div>
              <HeadlessHistory jobs={headlessJobs} onClear={clearHeadlessJobs} />
            </div>
          </div>
        )}

        {section === 'integrations' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Integrations</div>
            <div className="settings-card">
              <button className="ghost-button native-ghost settings-inline-action" onClick={openDocs}><Keyboard size={16} /> Docs</button>
              <button className="ghost-button native-ghost settings-inline-action" onClick={() => transport.openExternal('https://commandcode.ai/docs/reference/cli')}><Terminal size={16} /> CLI docs</button>
              <div className="settings-muted">MCP, skills, memory, and agent controls stay in Advanced so runtime-sensitive tools remain explicit.</div>
            </div>
          </div>
        )}

        {section === 'advanced' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Advanced</div>
            <div className="settings-card">
              <button className="ghost-button native-ghost settings-inline-action" onClick={openAdvanced}><Activity size={16} /> Open Advanced tools</button>
              <div className="settings-muted"><GitBranch size={16} /> Advanced surfaces include MCP servers, skills, memory, agents, usage, and command history.</div>
            </div>
          </div>
        )}
      </main>
    </section>
  )
}

type ComposerBarProps = {
  active: boolean
  prompt: string
  setPrompt: (value: string) => void
  onSubmit: () => Promise<void>
  onFocus?: () => void
  showPlanSuggestion: boolean
  onPlanMode: () => Promise<void>
  projectLabel: string
  modelLabel: string
  permissionLabel: string
  riskyPermission: boolean
  onProject: () => void
  onPermission: () => void
  onModel: () => void
  onSlash: () => void
}

function ComposerBar({
  active,
  prompt,
  setPrompt,
  onSubmit,
  onFocus,
  showPlanSuggestion,
  onPlanMode,
  projectLabel,
  modelLabel,
  permissionLabel,
  riskyPermission,
  onProject,
  onPermission,
  onModel,
  onSlash
}: ComposerBarProps): JSX.Element {
  return (
    <div className={`composer-card ${active ? 'composer-card--active' : ''}`}>
      {showPlanSuggestion && (
        <div className="plan-suggestion">
          <div>
            <strong>Create a plan</strong>
            <span>Use Command Code plan mode for this prompt.</span>
          </div>
          <button className="chip-button" onClick={() => void onPlanMode()}>Use plan mode</button>
        </div>
      )}
      <textarea
        className="composer-input"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onFocus={onFocus}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void onSubmit()
          }
        }}
        placeholder="Do anything"
        rows={active ? 2 : 3}
      />
      <div className="composer-toolbar">
        <div className="composer-chip-row">
          <button className="chip-button icon-only-chip" onClick={onSlash} title="Slash commands">
            <SlidersHorizontal size={17} />
          </button>
          <button className={`chip-button ${riskyPermission ? 'chip-button--warn' : ''}`} onClick={onPermission}>
            <span className={riskyPermission ? 'warning-dot' : 'neutral-dot'} />
            {permissionLabel}
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="composer-chip-row composer-chip-row--right">
          <button className="chip-button" onClick={onProject}>
            <Folder size={15} />
            {projectLabel}
            <ChevronDown size={14} />
          </button>
          <button className="chip-button" onClick={onModel}>
            {modelLabel}
            <ChevronDown size={14} />
          </button>
          <button className="composer-send" onClick={() => void onSubmit()} title={active ? 'Send' : 'Start'}>
            {active ? <Send size={18} /> : <Play size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}

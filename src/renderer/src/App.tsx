import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import {
  ChevronDown,
  Activity,
  CreditCard,
  Folder,
  FolderOpen,
  Gauge,
  GitBranch,
  HardDrive,
  Keyboard,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Play,
  Plug,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  SquarePen,
  Terminal,
  UserCircle,
  Wrench,
  X
} from 'lucide-react'
import type { PermissionMode, SessionExitPayload, HeadlessRunResult } from '../../shared/types'
import type { PtyDoctorResult } from '../../core/ptyDoctor'
import type { TransportAPI } from '../../core/transport'
import { useTransport } from './useTransport'
import { ModelDropdown } from './components/ModelDropdown'
import { AuthCard } from './components/AuthCard'
import { TerminalPane } from './components/TerminalPane'
import { TabBar } from './components/TabBar'
import { pushCommandHistory } from './components/CommandHistory'
import { HeadlessHistory, type HeadlessJob } from './components/HeadlessHistory'
import { ToastContainer, notify, playChime } from './components/ToastSystem'
import { IdePanel } from './components/IdePanel'
import { FileBrowser } from './components/FileBrowser'
import { FileViewer } from './components/FileViewer'
import { DocsSidecar } from './components/DocsSidecar'
import { AdvancedPanel } from './components/AdvancedPanel'
import { StatusPill } from './components/StatusPill'

type WorkspaceView = 'home' | 'session' | 'settings'
type RuntimeMode = 'mock' | 'real-session' | 'headless'
type PopoverKey = 'project' | 'mode' | 'permission' | 'runtime' | 'slash' | null
type SettingsSection = 'profile' | 'general' | 'runtime' | 'appearance' | 'usage' | 'integrations' | 'advanced'
type AppearanceTheme = 'cc-spectrum' | 'terminal-minimal' | 'blueprint' | 'high-contrast'

type SessionTab = {
  id: string
  label: string
  mock: boolean
  stopRequested: boolean
  stopStage: 0 | 1 | 2
  transcriptPath: string
  projectLabel: string
  runtimeMode: RuntimeMode
}

const RECENT_KEY = 'ccgui.recent-dirs'
const APPEARANCE_KEY = 'ccgui.appearance-theme'
const quickCommands = ['/status', '/help', '/clear', '/exit']
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

function modeLabel(mode: RuntimeMode): string {
  if (mode === 'real-session') return 'Real session'
  if (mode === 'headless') return 'Headless'
  return 'Mock'
}

function permissionLabel(permissionMode: PermissionMode, trust: boolean): string {
  if (trust) return 'trust'
  return permissionMode
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
  const [runtimeMode, setRuntimeModeState] = useState<RuntimeMode>('mock')
  const [composerPrompt, setComposerPrompt] = useState('')
  const [headlessMaxTurns, setHeadlessMaxTurns] = useState(10)
  const [headlessYolo, setHeadlessYolo] = useState(false)
  const [tabs, setTabs] = useState<SessionTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | undefined>()
  const [statusLine, setStatusLine] = useState('')
  const [headlessJobs, setHeadlessJobs] = useState<HeadlessJob[]>([])
  const [viewingFile, setViewingFile] = useState<string | undefined>()
  const [docsOpen, setDocsOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [filesOpen, setFilesOpen] = useState(false)
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [openPopover, setOpenPopover] = useState<PopoverKey>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('profile')
  const [appearanceTheme, setAppearanceThemeState] = useState<AppearanceTheme>(loadAppearanceTheme)
  const [ptyHealth, setPtyHealth] = useState<PtyDoctorResult | null>(null)
  const jobCounter = useRef(1)

  const useMock = runtimeMode === 'mock'
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const workspaceView: WorkspaceView = settingsOpen ? 'settings' : activeTabId ? 'session' : 'home'
  const projectLabel = displayPath(cwd)
  const realSessionDisabled = Boolean(ptyHealth && (!ptyHealth.available || !ptyHealth.healthy))
  const riskyPermission = isRiskyPermission(permissionMode, trust)

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

  const setCwd = (value: string): void => {
    setCwdState(value)
    localStorage.setItem('ccgui.cwd', value)
    setRecentProjects(saveRecentProject(value))
  }

  const setCommandExecutable = (value: string): void => {
    setCommandExecutableState(value)
    localStorage.setItem('ccgui.command', value)
  }

  const setModelPersisted = (value: string): void => {
    setModel(value)
    localStorage.setItem('ccgui.model', value)
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

  const chooseProject = async (): Promise<void> => {
    const result = await transport.chooseDirectory()
    if (!result.canceled && result.path) {
      setCwd(result.path)
      setOpenPopover(null)
    }
  }

  const cwdReady = useMemo(() => Boolean(cwd.trim()) || useMock, [cwd, useMock])

  const startSession = async (initialPrompt?: string): Promise<void> => {
    if (!cwdReady) {
      setStatusLine('Choose a project directory first, or switch to Mock mode.')
      return
    }
    if (runtimeMode === 'real-session' && realSessionDisabled) {
      setStatusLine(ptyHealth?.error || 'Real session is disabled because PTY is unhealthy.')
      return
    }

    setStatusLine('Starting session...')
    try {
      const result = await transport.startSession({
        cwd: cwd || '.',
        commandExecutable,
        initialPrompt: initialPrompt?.trim() || undefined,
        model: model || undefined,
        permissionMode,
        trust,
        skipOnboarding,
        cols: 120,
        rows: 34,
        useMock
      })

      const label = `session ${tabCounter++}`
      const newTab: SessionTab = {
        id: result.id,
        label,
        mock: result.mock,
        stopRequested: false,
        stopStage: 0,
        transcriptPath: result.transcriptPath,
        projectLabel,
        runtimeMode
      }

      setTabs((prev) => [...prev, newTab])
      setActiveTabId(result.id)
      notify(`${result.mock ? 'Mock' : 'Real'} session started`, 'session-started')
      playChime('session-started')
      setStatusLine(`${result.mock ? 'Mock' : 'Real'} session started: ${newTab.label}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start session'
      setStatusLine(`Failed: ${message}`)
      notify(`Session start failed: ${message}`, 'session-error')
    }
  }

  const runHeadless = async (prompt: string, maxTurns: number, yolo: boolean): Promise<void> => {
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
      await transport.write(activeTabId, `${prompt}\r`)
      pushCommandHistory(prompt)
      setComposerPrompt('')
      return
    }

    setComposerPrompt('')
    if (runtimeMode === 'headless') {
      await runHeadless(prompt, headlessMaxTurns, headlessYolo)
      return
    }

    await startSession(prompt)
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

  const sendSlash = async (command: string): Promise<void> => {
    if (activeTabId) {
      await transport.write(activeTabId, `${command}\r`)
      pushCommandHistory(command.trim())
      return
    }
    setComposerPrompt(command)
    setOpenPopover(null)
  }

  const onExit = useCallback((payload: SessionExitPayload): void => {
    removeTab(payload.sessionId)
    notify('Session exited', 'session-exited')
    playChime('session-exited')
    setStatusLine(`Session exited with code=${payload.exitCode ?? 'null'} signal=${payload.signal ?? 'null'}`)
  }, [])

  return (
    <main className={`app-shell native-shell theme-${appearanceTheme} ${railCollapsed ? 'native-shell--collapsed' : ''}`}>
      <ToastContainer />

      <aside className={`sidebar-shell ${railCollapsed ? 'sidebar-shell--collapsed' : ''}`}>
        <div className="sidebar-top">
          <button
            className="icon-button sidebar-collapse"
            onClick={() => setRailCollapsed((value) => !value)}
            title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {railCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          {!railCollapsed && <div className="sidebar-app-title">Command Code</div>}
        </div>

        {settingsOpen ? (
          !railCollapsed && (
            <div className="sidebar-settings-mode">
              <button className="settings-back sidebar-settings-back" onClick={() => setSettingsOpen(false)}>
                Back to app
              </button>
              <div className="settings-search">Search settings...</div>
              {settingsGroups.map((group) => (
                <div key={group.label} className="settings-nav-group">
                  <div className="settings-nav-heading">{group.label}</div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      className={`settings-nav-row ${settingsSection === item.id ? 'settings-nav-row--active' : ''}`}
                      onClick={() => setSettingsSection(item.id)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            <nav className="sidebar-nav" aria-label="Primary">
              <button className="sidebar-row" onClick={() => { setSettingsOpen(false); setOpenPopover(null); setActiveTabId(undefined) }} title="New session">
                <SquarePen size={18} />
                {!railCollapsed && <span>New session</span>}
              </button>
              <button className="sidebar-row" title="Search">
                <Search size={18} />
                {!railCollapsed && <span>Search</span>}
              </button>
              <button className="sidebar-row" onClick={() => { setSettingsOpen(false); setOpenPopover(openPopover === 'project' ? null : 'project') }} title="Projects">
                <Folder size={18} />
                {!railCollapsed && <span>Projects</span>}
              </button>
              <button className="sidebar-row" onClick={() => { setSettingsOpen(false); setOpenPopover(openPopover === 'runtime' ? null : 'runtime') }} title="Runtime">
                <Gauge size={18} />
                {!railCollapsed && <span>Runtime</span>}
              </button>
            </nav>

            {!railCollapsed && (
          <div className="sidebar-projects">
            <div className="sidebar-heading">Projects</div>
            <button className={`project-row ${cwd ? 'project-row--active' : ''}`} onClick={() => { setSettingsOpen(false); setOpenPopover('project') }} title={cwd || 'Choose a project'}>
              <FolderOpen size={16} />
              <span>{projectLabel}</span>
            </button>
            {recentProjects.filter((project) => project !== cwd).slice(0, 5).map((project) => (
              <button key={project} className="project-row" onClick={() => { setSettingsOpen(false); setCwd(project) }} title={project}>
                <Folder size={16} />
                <span>{displayPath(project)}</span>
              </button>
            ))}

            {tabs.length > 0 && (
              <>
                <div className="sidebar-heading sidebar-heading--sessions">Sessions</div>
                {tabs.slice(-6).reverse().map((tab) => (
                  <button key={tab.id} className={`project-row ${tab.id === activeTabId ? 'project-row--active' : ''}`} onClick={() => { setSettingsOpen(false); setActiveTabId(tab.id) }} title={tab.transcriptPath}>
                    <Terminal size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </>
            )}
          </div>
            )}
          </>
        )}

        <div className="sidebar-bottom">
          <button
            className={`sidebar-row ${settingsOpen ? 'sidebar-row--active' : ''}`}
            onClick={() => { setRailCollapsed(false); setOpenPopover(null); setSettingsOpen(true); setSettingsSection('profile') }}
            title="Settings"
          >
            <Settings size={18} />
            {!railCollapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>

      <section className="native-main">
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
            openDocs={() => setDocsOpen(true)}
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
                projectLabel={projectLabel}
                runtimeMode={runtimeMode}
                modelLabel={model || 'Default'}
                permissionLabel={permissionLabel(permissionMode, trust)}
                riskyPermission={riskyPermission}
                onProject={() => setOpenPopover(openPopover === 'project' ? null : 'project')}
                onMode={() => setOpenPopover(openPopover === 'mode' ? null : 'mode')}
                onPermission={() => setOpenPopover(openPopover === 'permission' ? null : 'permission')}
                onRuntime={() => setOpenPopover(openPopover === 'runtime' ? null : 'runtime')}
                onSlash={() => setOpenPopover(openPopover === 'slash' ? null : 'slash')}
              />
              <div className="home-status-row">
                <span>{runtimeMode === 'mock' ? 'mock runtime' : runtimeMode === 'headless' ? 'headless run' : 'real session'}</span>
                <span>{ptyHealthLabel(ptyHealth)}</span>
                <span>{model || 'default model'}</span>
                <span>{statusLine || 'idle'}</span>
              </div>
            </div>
          </section>
        ) : (
          <section className="session-workspace" aria-label="Active session">
            <header className="session-header">
              <div className="session-title-group">
                <div className="session-title">{activeTab?.label || 'Session'}</div>
                <div className="session-context">{activeTab?.projectLabel || projectLabel}</div>
              </div>
              <div className="session-actions">
                <StatusPill label={activeTab?.mock ? 'mock' : 'real cli'} tone={activeTab?.mock ? 'purple' : 'warn'} />
                <StatusPill label={permissionLabel(permissionMode, trust)} tone={riskyPermission ? 'warn' : permissionMode === 'plan' ? 'purple' : 'default'} />
                <button className="ghost-button native-ghost" onClick={() => setFilesOpen(true)}><FolderOpen size={16} /> Files</button>
                {activeTab?.transcriptPath && (
                  <button className="ghost-button native-ghost" onClick={() => transport.revealTranscript(activeTab.transcriptPath)} title={activeTab.transcriptPath}>Transcript</button>
                )}
                <button className="ghost-button native-ghost" onClick={stopSession}>Stop</button>
                <button className="ghost-button native-ghost" onClick={() => setAdvancedOpen(true)}>Advanced</button>
                <button className="ghost-button native-ghost" onClick={() => { setRailCollapsed(false); setOpenPopover(null); setSettingsOpen(true); setSettingsSection('profile') }}>
                  <Settings size={16} /> Settings
                </button>
              </div>
            </header>

            <TabBar tabs={tabs} activeId={activeTabId} onSelect={setActiveTabId} onKill={killTab} />

            <section className="terminal-card native-terminal-card">
              <TerminalPane transport={transport} sessionId={activeTabId} onExit={onExit} />
            </section>

            <div className="session-composer">
              <ComposerBar
                active
                prompt={composerPrompt}
                setPrompt={setComposerPrompt}
                onSubmit={submitComposer}
                projectLabel={projectLabel}
                runtimeMode={runtimeMode}
                modelLabel={model || 'Default'}
                permissionLabel={permissionLabel(permissionMode, trust)}
                riskyPermission={riskyPermission}
                onProject={() => setOpenPopover(openPopover === 'project' ? null : 'project')}
                onMode={() => setOpenPopover(openPopover === 'mode' ? null : 'mode')}
                onPermission={() => setOpenPopover(openPopover === 'permission' ? null : 'permission')}
                onRuntime={() => setOpenPopover(openPopover === 'runtime' ? null : 'runtime')}
                onSlash={() => setOpenPopover(openPopover === 'slash' ? null : 'slash')}
              />
            </div>
          </section>
        )}

        {openPopover === 'project' && (
          <div className="native-popover project-popover">
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
          <div className="native-popover mode-popover">
            <div className="popover-title">Mode</div>
            <button className={`popover-row ${runtimeMode === 'mock' ? 'popover-row--active' : ''}`} onClick={() => setRuntimeMode('mock')}>Mock</button>
            <button
              className={`popover-row ${runtimeMode === 'real-session' ? 'popover-row--active' : ''}`}
              disabled={realSessionDisabled}
              onClick={() => setRuntimeMode('real-session')}
              title={realSessionDisabled ? (ptyHealth?.error || 'PTY is unhealthy') : 'Start a real PTY session'}
            >
              Real session
            </button>
            <button className={`popover-row ${runtimeMode === 'headless' ? 'popover-row--active' : ''}`} onClick={() => setRuntimeMode('headless')}>Headless</button>
            {realSessionDisabled && <div className="popover-note">{ptyHealth?.error || 'Real session disabled until PTY is healthy.'}</div>}
          </div>
        )}

        {openPopover === 'permission' && (
          <div className="native-popover permission-popover">
            <div className="popover-title">Permissions</div>
            <button className={`popover-row ${permissionMode === 'standard' && !trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('standard'); setTrust(false); setOpenPopover(null) }}>standard</button>
            <button className={`popover-row ${permissionMode === 'plan' && !trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('plan'); setTrust(false); setOpenPopover(null) }}>plan</button>
            <button className={`popover-row popover-row--warn ${permissionMode === 'auto-accept' && !trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('auto-accept'); setTrust(false); setOpenPopover(null) }}>auto-accept</button>
            <button className={`popover-row popover-row--warn ${trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('standard'); setTrust(true); setOpenPopover(null) }}>trust</button>
          </div>
        )}

        {openPopover === 'runtime' && (
          <div className="native-popover runtime-popover">
            <div className="popover-title">Runtime</div>
            <label className="field-label">Command binary</label>
            <input className="native-input" value={commandExecutable} onChange={(event) => setCommandExecutable(event.target.value)} />
            <div className="runtime-grid">
              <button className="ghost-button native-ghost" onClick={runCheck}>Check CLI</button>
              <button className="ghost-button native-ghost" onClick={() => transport.openExternal('https://commandcode.ai/docs/reference/cli')}>CLI docs</button>
              <button className="ghost-button native-ghost" onClick={() => setDocsOpen(true)}>Docs</button>
              <button className="ghost-button native-ghost" onClick={() => setAdvancedOpen(true)}>Advanced</button>
            </div>
            <label className="checkbox-row"><input type="checkbox" checked={skipOnboarding} onChange={(event) => setSkipOnboarding(event.target.checked)} /> Skip onboarding</label>
            <label className="checkbox-row"><input type="checkbox" checked={headlessYolo} onChange={(event) => setHeadlessYolo(event.target.checked)} /> Allow write tools in headless commands</label>
            <label className="field-label">Headless max turns</label>
            <input className="native-input" type="number" min={1} max={100} value={headlessMaxTurns} onChange={(event) => setHeadlessMaxTurns(Number(event.target.value) || 1)} />
            <ModelDropdown transport={transport} model={model} setModel={setModelPersisted} commandExecutable={commandExecutable} cwd={cwd} />
            <AuthCard transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
            <IdePanel transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
            <HeadlessHistory jobs={headlessJobs} onClear={() => setHeadlessJobs([])} />
          </div>
        )}

        {openPopover === 'slash' && (
          <div className="native-popover slash-popover">
            <div className="popover-title">Commands</div>
            {quickCommands.map((command) => (
              <button key={command} className="popover-row" onClick={() => sendSlash(command)}>{command}</button>
            ))}
          </div>
        )}

        {filesOpen && (
          <div className="drawer-backdrop" onClick={() => setFilesOpen(false)}>
            <aside className="native-drawer" onClick={(event) => event.stopPropagation()}>
              <div className="drawer-header">
                <div>Files</div>
                <button className="icon-button" onClick={() => setFilesOpen(false)} title="Close files"><X size={18} /></button>
              </div>
              <FileBrowser transport={transport} cwd={cwd} onSelectFile={setViewingFile} />
            </aside>
          </div>
        )}

        <FileViewer transport={transport} filePath={viewingFile} onClose={() => setViewingFile(undefined)} />
        <DocsSidecar visible={docsOpen} onClose={() => setDocsOpen(false)} />
        <AdvancedPanel
          transport={transport}
          commandExecutable={commandExecutable}
          cwd={cwd}
          visible={advancedOpen}
          onClose={() => setAdvancedOpen(false)}
        />
      </section>
    </main>
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
  openDocs: () => void
  openAdvanced: () => void
}

const settingsGroups: Array<{ label: string; items: Array<{ id: SettingsSection; label: string; icon: JSX.Element }> }> = [
  {
    label: 'Personal',
    items: [
      { id: 'profile', label: 'Profile', icon: <UserCircle size={17} /> },
      { id: 'general', label: 'General', icon: <Settings size={17} /> },
      { id: 'appearance', label: 'Appearance', icon: <Palette size={17} /> },
      { id: 'runtime', label: 'Runtime', icon: <Wrench size={17} /> },
      { id: 'usage', label: 'Usage', icon: <CreditCard size={17} /> }
    ]
  },
  {
    label: 'Integrations',
    items: [
      { id: 'integrations', label: 'Integrations', icon: <Plug size={17} /> },
      { id: 'advanced', label: 'Advanced', icon: <HardDrive size={17} /> }
    ]
  }
]

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
                {(['standard', 'plan', 'auto-accept'] as PermissionMode[]).map((mode) => (
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
              <ModelDropdown transport={transport} model={model} setModel={setModel} commandExecutable={commandExecutable} cwd={cwd} />
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
  projectLabel: string
  runtimeMode: RuntimeMode
  modelLabel: string
  permissionLabel: string
  riskyPermission: boolean
  onProject: () => void
  onMode: () => void
  onPermission: () => void
  onRuntime: () => void
  onSlash: () => void
}

function ComposerBar({
  active,
  prompt,
  setPrompt,
  onSubmit,
  projectLabel,
  runtimeMode,
  modelLabel,
  permissionLabel,
  riskyPermission,
  onProject,
  onMode,
  onPermission,
  onRuntime,
  onSlash
}: ComposerBarProps): JSX.Element {
  return (
    <div className={`composer-card ${active ? 'composer-card--active' : ''}`}>
      <textarea
        className="composer-input"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
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
          <button className="chip-button" onClick={onPermission}>
            <span className={riskyPermission ? 'warning-dot' : 'neutral-dot'} />
            {permissionLabel}
            <ChevronDown size={14} />
          </button>
          <button className="chip-button" onClick={onMode}>
            {modeLabel(runtimeMode)}
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="composer-chip-row composer-chip-row--right">
          <button className="chip-button" onClick={onProject}>
            <Folder size={15} />
            {projectLabel}
            <ChevronDown size={14} />
          </button>
          <button className="chip-button" onClick={onRuntime}>
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

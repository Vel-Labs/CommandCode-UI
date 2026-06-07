import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { Activity, Bot, Braces, CreditCard, Database, GitBranch, History, Keyboard, MemoryStick, Monitor, Plug, Settings, Sparkles, Terminal, Wrench } from 'lucide-react'
import type { PermissionMode } from '../../../shared/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { UsageSummary } from '../../../core/types'
import type { AppearanceTheme, RuntimeMode, SettingsSection } from '../appTypes'
import type { HeadlessJob } from '../components/HeadlessHistory'
import { AuthCard } from '../components/AuthCard'
import { HeadlessHistory } from '../components/HeadlessHistory'
import { IdePanel } from '../components/IdePanel'
import { ModelDropdown } from '../components/ModelDropdown'
import { SettingsPageHeader } from './SettingsPageHeader'
import { settingsItem } from './settingsRegistry'

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

const profileActions: Array<{
  section: SettingsSection
  label: string
  description: string
  icon: JSX.Element
}> = [
  { section: 'general', label: 'Choose Command Code binary', description: 'Confirm the CLI path and startup behavior.', icon: <Settings size={16} /> },
  { section: 'runtime', label: 'Review runtime health', description: 'Check PTY, auth, model, permissions, and IDE state.', icon: <Wrench size={16} /> },
  { section: 'integrations', label: 'Set up integrations', description: 'Open MCP, hooks, agents, memory, design, skills, and taste tasks.', icon: <Plug size={16} /> }
]

const settingsTaskGroups: Array<{
  label: string
  description: string
  actions: Array<{ section: SettingsSection; label: string; icon: JSX.Element }>
}> = [
  {
    label: 'Project tools',
    description: 'Work with project-scoped sessions, memory, agents, and data.',
    actions: [
      { section: 'sessions', label: 'Sessions', icon: <History size={15} /> },
      { section: 'memory', label: 'Memory', icon: <MemoryStick size={15} /> },
      { section: 'agents', label: 'Agents', icon: <Bot size={15} /> },
      { section: 'data', label: 'Data', icon: <Database size={15} /> }
    ]
  },
  {
    label: 'Integration setup',
    description: 'Configure or inspect Command Code extension surfaces.',
    actions: [
      { section: 'mcp', label: 'MCP', icon: <Plug size={15} /> },
      { section: 'hooks', label: 'Hooks', icon: <Braces size={15} /> },
      { section: 'design', label: 'Design', icon: <Monitor size={15} /> },
      { section: 'skills', label: 'Skills', icon: <MemoryStick size={15} /> }
    ]
  },
  {
    label: 'Reference and diagnostics',
    description: 'Check usage, shortcuts, terminal presentation, notifications, and release state.',
    actions: [
      { section: 'usage', label: 'Usage', icon: <CreditCard size={15} /> },
      { section: 'keyboard', label: 'Keyboard', icon: <Keyboard size={15} /> },
      { section: 'terminal', label: 'Terminal', icon: <Terminal size={15} /> },
      { section: 'about', label: 'About', icon: <Activity size={15} /> }
    ]
  }
]

export function ProfileSettings({
  cwd,
  projectLabel,
  commandExecutable,
  model,
  ptyHealth,
  permissionMode,
  trust,
  headlessJobs,
  sessionCount,
  runtimeMode,
  openSection
}: {
  cwd: string
  projectLabel: string
  commandExecutable: string
  model: string
  ptyHealth: PtyDoctorResult | null
  permissionMode: PermissionMode
  trust: boolean
  headlessJobs: HeadlessJob[]
  sessionCount: number
  runtimeMode: RuntimeMode
  openSection: (section: SettingsSection) => void
}): JSX.Element {
  const runtimeHealth = ptyHealth ? (ptyHealth.healthy ? 'Healthy' : 'Unavailable') : 'Checking'
  const completedHeadless = headlessJobs.filter((job) => job.result).length
  const failedHeadless = headlessJobs.filter((job) => job.result && job.result.exitCode !== 0).length

  return (
    <div className="settings-profile-page">
      <SettingsPageHeader
        item={settingsItem('profile')}
        status={`${runtimeHealth} PTY / ${modeLabel(runtimeMode)}`}
        scope={cwd ? projectLabel : 'No project selected'}
      />
      <div className="profile-stat-strip">
        <div><strong>{sessionCount}</strong><span>Open sessions</span></div>
        <div><strong>{headlessJobs.length}</strong><span>Headless runs</span></div>
        <div><strong>{completedHeadless}</strong><span>Completed runs</span></div>
        <div><strong>{runtimeHealth}</strong><span>PTY health</span></div>
        <div><strong>{permissionLabel(permissionMode, trust)}</strong><span>Permissions</span></div>
      </div>
      <div className="settings-card settings-card--wide settings-setup-card">
        <div className="settings-readonly-header">
          <strong>Setup checklist</strong>
          <span className="settings-state-pill">{failedHeadless ? `${failedHeadless} failed run${failedHeadless === 1 ? '' : 's'}` : 'No failed runs'}</span>
        </div>
        <div className="settings-checklist-grid">
          <SetupCheck label="Command binary" value={commandExecutable} state={commandExecutable ? 'Set' : 'Missing'} />
          <SetupCheck label="PTY" value={ptyHealth?.shell || 'Not available'} state={runtimeHealth} />
          <SetupCheck label="Project" value={projectLabel} state={cwd ? 'Selected' : 'Not selected'} />
          <SetupCheck label="Model" value={model || 'Default at start'} state={model ? 'Override' : 'Default'} />
          <SetupCheck label="Permissions" value={permissionLabel(permissionMode, trust)} state={trust || permissionMode === 'auto-accept' ? 'Risk visible' : 'Standard'} />
        </div>
      </div>
      <div className="settings-card settings-card--wide profile-action-card">
        <div className="settings-readonly-header">
          <strong>Recommended next actions</strong>
        </div>
        <div className="settings-action-grid profile-action-grid">
          {profileActions.map((item) => (
            <button key={item.section} className="settings-action-tile" onClick={() => openSection(item.section)}>
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="settings-task-group-grid">
        {settingsTaskGroups.map((group) => (
          <section key={group.label} className="settings-task-group">
            <strong>{group.label}</strong>
            <p>{group.description}</p>
            <div className="settings-task-link-row">
              {group.actions.map((action) => (
                <button key={action.section} className="settings-task-link" onClick={() => openSection(action.section)}>
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function GeneralSettings({
  commandExecutable,
  setCommandExecutable,
  skipOnboarding,
  setSkipOnboarding,
  startupProjectBehavior,
  setStartupProjectBehavior,
  runCheck
}: {
  commandExecutable: string
  setCommandExecutable: (value: string) => void
  skipOnboarding: boolean
  setSkipOnboarding: (value: boolean) => void
  startupProjectBehavior: 'restore-last' | 'empty'
  setStartupProjectBehavior: (value: 'restore-last' | 'empty') => void
  runCheck: () => Promise<void>
}): JSX.Element {
  return (
    <div className="settings-detail-page">
      <SettingsPageHeader item={settingsItem('general')} status="GUI app/project preferences" scope="No Command Code config mutation" />
      <div className="settings-card">
        <label className="field-label">Command binary</label>
        <input className="native-input" value={commandExecutable} onChange={(event) => setCommandExecutable(event.target.value)} />
        <SettingsDestinationNote
          scope="GUI app preference"
          path="~/.commandcode/gui-preferences.json"
          fields="commandExecutable"
        />
        <label className="checkbox-row"><input type="checkbox" checked={skipOnboarding} onChange={(event) => setSkipOnboarding(event.target.checked)} /> Skip Command Code onboarding prompts</label>
        <SettingsDestinationNote
          scope="GUI project preference"
          path="<project>/.commandcode/gui-preferences.json"
          fields="skipOnboarding"
        />
        <label className="field-label">Startup project</label>
        <select className="native-input" value={startupProjectBehavior} onChange={(event) => setStartupProjectBehavior(event.target.value === 'empty' ? 'empty' : 'restore-last')}>
          <option value="restore-last">Restore last selected project</option>
          <option value="empty">Open without a selected project</option>
        </select>
        <SettingsDestinationNote
          scope="GUI app preference"
          path="~/.commandcode/gui-preferences.json"
          fields="startupProjectBehavior"
        />
        <p className="settings-muted">This only controls project selection on app preference hydration. It does not auto-start or resume Command Code sessions.</p>
        <button className="ghost-button native-ghost settings-inline-action" onClick={() => void runCheck()}>Check CLI</button>
      </div>
    </div>
  )
}

export function RuntimeSettings({
  cwd,
  commandExecutable,
  model,
  setModel,
  transport,
  ptyHealth,
  permissionMode,
  setPermissionMode,
  trust,
  setTrust,
  runtimeMode,
  openConfigureModels
}: {
  cwd: string
  commandExecutable: string
  model: string
  setModel: (value: string) => void
  transport: TransportAPI
  ptyHealth: PtyDoctorResult | null
  permissionMode: PermissionMode
  setPermissionMode: (value: PermissionMode) => void
  trust: boolean
  setTrust: (value: boolean) => void
  runtimeMode: RuntimeMode
  openConfigureModels: () => Promise<void>
}): JSX.Element {
  const runtimeHealth = ptyHealth ? (ptyHealth.healthy ? 'Healthy' : 'Unavailable') : 'Checking'

  return (
    <div className="settings-detail-page">
      <SettingsPageHeader item={settingsItem('runtime')} status={`${runtimeHealth} PTY / ${modeLabel(runtimeMode)}`} scope={cwd ? 'Project preference scope available' : 'No project selected'} />
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
        <SettingsDestinationNote
          scope="GUI project preference"
          path="<project>/.commandcode/gui-preferences.json"
          fields="permissionMode, trust"
        />
        <ModelDropdown transport={transport} model={model} setModel={setModel} commandExecutable={commandExecutable} cwd={cwd} onConfigureModels={openConfigureModels} />
        <SettingsDestinationNote
          scope="GUI app and project preferences"
          path="~/.commandcode/gui-preferences.json and <project>/.commandcode/gui-preferences.json"
          fields="model, projectModels"
        />
        <AuthCard transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
        <IdePanel transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
      </div>
    </div>
  )
}

export function AppearanceSettings({
  appearanceTheme,
  setAppearanceTheme
}: {
  appearanceTheme: AppearanceTheme
  setAppearanceTheme: (value: AppearanceTheme) => void
}): JSX.Element {
  return (
    <div className="settings-detail-page">
      <SettingsPageHeader item={settingsItem('appearance')} status="Adapter presentation only" scope="Saved as GUI preference" />
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
        <SettingsDestinationNote
          scope="GUI app and project preferences"
          path="~/.commandcode/gui-preferences.json and <project>/.commandcode/gui-preferences.json"
          fields="appearanceTheme"
        />
        <p className="settings-muted">Theme changes are saved on this machine and only affect the desktop adapter presentation. Command Code CLI behavior and permission semantics stay unchanged.</p>
      </div>
    </div>
  )
}

export function UsageSettings({
  cwd,
  commandExecutable,
  transport,
  headlessJobs,
  clearHeadlessJobs,
  sessionCount
}: {
  cwd: string
  commandExecutable: string
  transport: TransportAPI
  headlessJobs: HeadlessJob[]
  clearHeadlessJobs: () => void
  sessionCount: number
}): JSX.Element {
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(false)

  const loadUsage = async (): Promise<void> => {
    setLoadingUsage(true)
    try {
      setUsage(await transport.usage(commandExecutable || undefined, cwd || undefined))
    } catch {
      setUsage(null)
    } finally {
      setLoadingUsage(false)
    }
  }

  useEffect(() => { void loadUsage() }, [commandExecutable, cwd])

  return (
    <div className="settings-detail-page">
      <SettingsPageHeader item={settingsItem('usage')} status="Read-only usage diagnostics" scope={cwd ? 'Project context selected' : 'Global/default context'} />
      <div className="settings-card settings-card--wide">
        <div className="settings-status-row">
          <span>Open sessions</span><strong>{sessionCount}</strong>
          <span>Headless runs</span><strong>{headlessJobs.length}</strong>
        </div>
        <HeadlessHistory jobs={headlessJobs} onClear={clearHeadlessJobs} />
      </div>
      <div className="settings-card settings-card--wide">
        <div className="settings-readonly-header">
          <strong>Command Code usage summary</strong>
          <button className="ghost-button native-ghost" onClick={() => void loadUsage()} disabled={loadingUsage}>{loadingUsage ? 'Loading...' : 'Refresh'}</button>
        </div>
        {usage && (
          <>
            <div className="usage-grid">
              <div className="usage-stat">
                <div className="usage-value">{usage.totalTokens.toLocaleString()}</div>
                <div className="usage-label">Total tokens</div>
              </div>
              <div className="usage-stat">
                <div className="usage-value">${usage.totalCost.toFixed(2)}</div>
                <div className="usage-label">Total cost</div>
              </div>
              <div className="usage-stat">
                <div className="usage-value">{usage.totalRuns.toLocaleString()}</div>
                <div className="usage-label">Total runs</div>
              </div>
            </div>
            <pre className="advanced-raw settings-usage-raw">{usage.raw}</pre>
          </>
        )}
        {!usage && !loadingUsage && <p className="settings-muted">Refresh reads the existing Command Code usage summary through the current command binary and project. No GUI preference or Command Code config is written.</p>}
      </div>
    </div>
  )
}

const integrationSections: Array<{
  group: 'Set up' | 'Create or edit' | 'Inspect'
  section: SettingsSection
  label: string
  description: string
  icon: JSX.Element
}> = [
  { group: 'Set up', section: 'mcp', label: 'MCP', description: 'Inspect servers and run explicit connect or disconnect commands.', icon: <Plug size={16} /> },
  { group: 'Set up', section: 'hooks', label: 'Hooks', description: 'Review hook scopes, logs, dry-run diagnostics, and preview-confirmed edits.', icon: <Braces size={16} /> },
  { group: 'Create or edit', section: 'agents', label: 'Agents', description: 'Create project agents or edit project-scoped agent files.', icon: <Bot size={16} /> },
  { group: 'Create or edit', section: 'memory', label: 'Memory', description: 'Inspect and edit scoped project memory files.', icon: <MemoryStick size={16} /> },
  { group: 'Create or edit', section: 'design', label: 'Design', description: 'Preview /design helper commands before sending them.', icon: <Monitor size={16} /> },
  { group: 'Inspect', section: 'skills', label: 'Skills', description: 'Inspect installed skills and source paths.', icon: <MemoryStick size={16} /> },
  { group: 'Inspect', section: 'taste', label: 'Taste', description: 'Inspect taste profile discovery without editing internals.', icon: <Sparkles size={16} /> }
]

const advancedDiagnosticSections: Array<{
  section: SettingsSection
  label: string
  description: string
  icon: JSX.Element
}> = [
  { section: 'data', label: 'Project state', description: 'Inspect project .commandcode paths and local adapter state.', icon: <Database size={16} /> },
  { section: 'usage', label: 'Usage', description: 'Read local headless history and Command Code usage summaries.', icon: <CreditCard size={16} /> },
  { section: 'about', label: 'About', description: 'Confirm version, release history, update status, and local docs.', icon: <Activity size={16} /> },
  { section: 'keyboard', label: 'Keyboard', description: 'Use shortcut references for navigation and command palette work.', icon: <Keyboard size={16} /> }
]

export function IntegrationsSettings({
  openDocs,
  transport,
  openSection
}: {
  openDocs: () => void
  transport: TransportAPI
  openSection: (section: SettingsSection) => void
}): JSX.Element {
  return (
    <div className="settings-detail-page">
      <SettingsPageHeader item={settingsItem('integrations')} status="Grouped by operator task" scope="Command Code remains execution owner" />
      <div className="settings-card settings-card--wide">
        {(['Set up', 'Create or edit', 'Inspect'] as const).map((group) => (
          <section key={group} className="settings-flow-section">
            <div className="settings-readonly-header">
              <strong>{group}</strong>
              <span className="settings-state-pill">{integrationSections.filter((item) => item.group === group).length} tasks</span>
            </div>
            <div className="settings-action-grid">
              {integrationSections.filter((item) => item.group === group).map((item) => (
                <button key={item.section} className="settings-action-tile" onClick={() => openSection(item.section)}>
                  <span>{item.icon}</span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </section>
        ))}
        <div className="settings-inline-actions">
          <button className="ghost-button native-ghost settings-inline-action" onClick={openDocs}><Keyboard size={16} /> Local docs</button>
          <button className="ghost-button native-ghost settings-inline-action" onClick={() => transport.openExternal('https://commandcode.ai/docs/reference/cli')}><Terminal size={16} /> CLI docs</button>
        </div>
        <p className="settings-muted">Each integration page shows what is implemented now and what remains gated before any config or runtime-affecting action.</p>
      </div>
    </div>
  )
}

export function AdvancedSettings({ openSection }: { openSection: (section: SettingsSection) => void }): JSX.Element {
  return (
    <div className="settings-detail-page">
      <SettingsPageHeader item={settingsItem('advanced')} status="Low-level diagnostics" scope="Integration setup lives under Integrations" />
      <div className="settings-card settings-card--wide">
        <div className="settings-readonly-header">
          <strong>Diagnostics and references</strong>
        </div>
        <div className="settings-action-grid">
          {advancedDiagnosticSections.map((item) => (
            <button key={item.section} className="settings-action-tile" onClick={() => openSection(item.section)}>
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </button>
          ))}
        </div>
        <div className="settings-muted"><GitBranch size={16} /> Use this page for low-level local state and reference checks. MCP, hooks, agents, memory, skills, taste, and design now live under Integrations or Project task groups.</div>
      </div>
    </div>
  )
}

function SetupCheck({ label, value, state }: { label: string; value: string; state: string }): JSX.Element {
  return (
    <div className="settings-check-item">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{state}</small>
    </div>
  )
}

function modeLabel(mode: RuntimeMode): string {
  return mode === 'mock' ? 'Demo mode' : 'Real session'
}

function permissionLabel(permissionMode: PermissionMode, trust: boolean): string {
  if (trust || permissionMode === 'auto-accept') return 'Full access'
  return 'Standard'
}

function SettingsDestinationNote({
  scope,
  path,
  fields
}: {
  scope: string
  path: string
  fields: string
}): JSX.Element {
  return (
    <div className="settings-destination-note">
      <span>{scope}</span>
      <code>{path}</code>
      <small>{fields}</small>
    </div>
  )
}

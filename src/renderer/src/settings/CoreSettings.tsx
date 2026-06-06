import type { JSX } from 'react'
import { Activity, Bot, Braces, CreditCard, Database, GitBranch, Keyboard, MemoryStick, Monitor, Plug, Settings, Sparkles, Terminal, Wrench } from 'lucide-react'
import type { PermissionMode } from '../../../shared/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { AppearanceTheme, RuntimeMode, SettingsSection } from '../appTypes'
import type { HeadlessJob } from '../components/HeadlessHistory'
import { AuthCard } from '../components/AuthCard'
import { HeadlessHistory } from '../components/HeadlessHistory'
import { IdePanel } from '../components/IdePanel'
import { ModelDropdown } from '../components/ModelDropdown'

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
  { section: 'general', label: 'General', description: 'Command binary and onboarding behavior.', icon: <Settings size={16} /> },
  { section: 'runtime', label: 'Runtime', description: 'PTY health, mode, permissions, model, auth, and IDE diagnostics.', icon: <Wrench size={16} /> },
  { section: 'usage', label: 'Usage', description: 'Headless history and local run counters.', icon: <CreditCard size={16} /> },
  { section: 'data', label: 'Project state', description: 'Read project .commandcode paths and local state.', icon: <Database size={16} /> },
  { section: 'integrations', label: 'Integrations', description: 'Open MCP, hooks, agents, skills, design, memory, and taste.', icon: <Plug size={16} /> }
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
      <div className="settings-page-title">Profile</div>
      <div className="profile-hero">
        <div className="profile-avatar">CC</div>
        <div className="profile-name">Command Code</div>
        <div className="profile-meta">Local desktop adapter - {model || 'Default model'}</div>
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
      <div className="settings-card settings-card--wide profile-action-card">
        <div className="settings-readonly-header">
          <strong>Settings shortcuts</strong>
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
    </div>
  )
}

export function GeneralSettings({
  commandExecutable,
  setCommandExecutable,
  skipOnboarding,
  setSkipOnboarding,
  runCheck
}: {
  commandExecutable: string
  setCommandExecutable: (value: string) => void
  skipOnboarding: boolean
  setSkipOnboarding: (value: boolean) => void
  runCheck: () => Promise<void>
}): JSX.Element {
  return (
    <div className="settings-detail-page">
      <div className="settings-page-title">General</div>
      <div className="settings-card">
        <label className="field-label">Command binary</label>
        <input className="native-input" value={commandExecutable} onChange={(event) => setCommandExecutable(event.target.value)} />
        <label className="checkbox-row"><input type="checkbox" checked={skipOnboarding} onChange={(event) => setSkipOnboarding(event.target.checked)} /> Skip Command Code onboarding prompts</label>
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
  )
}

export function UsageSettings({
  headlessJobs,
  clearHeadlessJobs,
  sessionCount
}: {
  headlessJobs: HeadlessJob[]
  clearHeadlessJobs: () => void
  sessionCount: number
}): JSX.Element {
  return (
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
  )
}

const integrationSections: Array<{
  section: SettingsSection
  label: string
  description: string
  icon: JSX.Element
}> = [
  { section: 'mcp', label: 'MCP', description: 'Read configured MCP servers and tool visibility.', icon: <Plug size={16} /> },
  { section: 'hooks', label: 'Hooks', description: 'Review documented hook scopes before write support lands.', icon: <Braces size={16} /> },
  { section: 'agents', label: 'Agents', description: 'Inspect discovered project and global agent files.', icon: <Bot size={16} /> },
  { section: 'skills', label: 'Skills', description: 'Inspect installed skills and source paths.', icon: <MemoryStick size={16} /> },
  { section: 'design', label: 'Design', description: 'Review the staged /design helper entry point.', icon: <Monitor size={16} /> },
  { section: 'memory', label: 'Memory', description: 'Inspect memory scopes and ownership warnings.', icon: <MemoryStick size={16} /> },
  { section: 'taste', label: 'Taste', description: 'Inspect taste profile discovery without editing internals.', icon: <Sparkles size={16} /> }
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
      <div className="settings-page-title">Integrations</div>
      <div className="settings-card settings-card--wide">
        <div className="settings-readonly-header">
          <strong>Integration surfaces</strong>
        </div>
        <div className="settings-action-grid">
          {integrationSections.map((item) => (
            <button key={item.section} className="settings-action-tile" onClick={() => openSection(item.section)}>
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </button>
          ))}
        </div>
        <div className="settings-inline-actions">
          <button className="ghost-button native-ghost settings-inline-action" onClick={openDocs}><Keyboard size={16} /> Local docs</button>
          <button className="ghost-button native-ghost settings-inline-action" onClick={() => transport.openExternal('https://commandcode.ai/docs/reference/cli')}><Terminal size={16} /> CLI docs</button>
        </div>
        <p className="settings-muted">This hub only routes to existing read-only Settings sections. Connect, edit, save, auth, and config mutation actions remain gated until command previews, scopes, and write destinations are explicit.</p>
      </div>
    </div>
  )
}

export function AdvancedSettings({ openAdvanced }: { openAdvanced: () => void }): JSX.Element {
  return (
    <div className="settings-detail-page">
      <div className="settings-page-title">Advanced</div>
      <div className="settings-card">
        <button className="ghost-button native-ghost settings-inline-action" onClick={openAdvanced}><Activity size={16} /> Open Advanced tools</button>
        <div className="settings-muted"><GitBranch size={16} /> Advanced surfaces include MCP servers, skills, memory, agents, usage, and command history.</div>
      </div>
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

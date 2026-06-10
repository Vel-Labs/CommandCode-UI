import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { Activity, Bot, Braces, CreditCard, Database, GitBranch, Keyboard, MemoryStick, Monitor, Plug, Sparkles, Terminal } from 'lucide-react'
import type { PermissionMode } from '../../../shared/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { UsageSummary } from '../../../core/types'
import type { RuntimeMode, SettingsSection } from '../appTypes'
import type { HeadlessJob } from '../components/HeadlessHistory'
import { AuthCard } from '../components/AuthCard'
import { HeadlessHistory } from '../components/HeadlessHistory'
import { IdePanel } from '../components/IdePanel'
import { ModelDropdown } from '../components/ModelDropdown'
import { SettingsPageHeader } from './SettingsPageHeader'
import { settingsItem } from './settingsRegistry'

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

function modeLabel(mode: RuntimeMode): string {
  return mode === 'mock' ? 'Demo mode' : 'Real session'
}

function permissionLabel(permissionMode: PermissionMode, trust: boolean): string {
  if (trust || permissionMode === 'auto-accept') return 'Full access'
  return 'Standard'
}

export function SettingsDestinationNote({
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

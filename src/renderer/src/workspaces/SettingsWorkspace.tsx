import type { JSX } from 'react'
import { Activity, GitBranch, Keyboard, Terminal } from 'lucide-react'
import type { PermissionMode } from '../../../shared/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { AppearanceTheme, RuntimeMode, SettingsSection } from '../appTypes'
import type { HeadlessJob } from '../components/HeadlessHistory'
import { AuthCard } from '../components/AuthCard'
import { HeadlessHistory } from '../components/HeadlessHistory'
import { IdePanel } from '../components/IdePanel'
import { ModelDropdown } from '../components/ModelDropdown'
import {
  AgentsSettingsReadOnly,
  McpSettingsReadOnly,
  MemorySettingsReadOnly,
  ProjectStateSettings,
  SkillsSettingsReadOnly,
  TasteSettingsReadOnly
} from '../settings/AdvancedReadOnlySettings'
import { settingsItem } from '../settings/settingsRegistry'

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

export function SettingsWorkspace({
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
}: {
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
}): JSX.Element {
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

        {section === 'data' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Data</div>
            <ProjectStateSettings transport={transport} cwd={cwd} />
          </div>
        )}

        {section === 'mcp' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">MCP</div>
            <McpSettingsReadOnly transport={transport} commandExecutable={commandExecutable} />
          </div>
        )}

        {section === 'agents' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Agents</div>
            <AgentsSettingsReadOnly transport={transport} />
          </div>
        )}

        {section === 'skills' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Skills</div>
            <SkillsSettingsReadOnly transport={transport} />
          </div>
        )}

        {section === 'memory' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Memory</div>
            <MemorySettingsReadOnly transport={transport} cwd={cwd} />
          </div>
        )}

        {section === 'taste' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Taste</div>
            <TasteSettingsReadOnly transport={transport} />
          </div>
        )}

        {!['profile', 'general', 'runtime', 'appearance', 'usage', 'integrations', 'advanced', 'data', 'mcp', 'agents', 'skills', 'memory', 'taste'].includes(section) && (
          <SettingsPlaceholder section={section} />
        )}
      </main>
    </section>
  )
}

function modeLabel(mode: RuntimeMode): string {
  return mode === 'mock' ? 'Demo mode' : 'Real session'
}

function permissionLabel(permissionMode: PermissionMode, trust: boolean): string {
  if (trust || permissionMode === 'auto-accept') return 'Full access'
  return 'Standard'
}

function SettingsPlaceholder({ section }: { section: SettingsSection }): JSX.Element {
  const item = settingsItem(section)
  return (
    <div className="settings-detail-page">
      <div className="settings-page-title">{item.label}</div>
      <div className="settings-card settings-card--wide">
        <div className="settings-placeholder-heading">
          {item.icon}
          <strong>{item.description}</strong>
        </div>
        <p className="settings-muted">
          This section is registered for Phase 2 navigation and search. It is read-only in this package; no config files, Command Code settings, or GUI preferences are written from this placeholder.
        </p>
      </div>
    </div>
  )
}

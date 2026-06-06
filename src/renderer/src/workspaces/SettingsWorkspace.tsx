import type { JSX } from 'react'
import type { PermissionMode } from '../../../shared/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { AppearanceTheme, RuntimeMode, SettingsSection, UpdateState } from '../appTypes'
import type { HeadlessJob } from '../components/HeadlessHistory'
import {
  AgentsSettingsReadOnly,
  McpSettingsReadOnly,
  MemorySettingsReadOnly,
  ProjectStateSettings,
  SkillsSettingsReadOnly,
  TasteSettingsReadOnly
} from '../settings/AdvancedReadOnlySettings'
import {
  AdvancedSettings,
  AppearanceSettings,
  GeneralSettings,
  IntegrationsSettings,
  ProfileSettings,
  RuntimeSettings,
  UsageSettings
} from '../settings/CoreSettings'
import {
  AboutSettingsReadOnly,
  DesignSettingsReadOnly,
  HooksSettingsReadOnly,
  KeyboardSettingsReadOnly,
  ModelsSettingsReadOnly,
  NotificationsSettingsReadOnly,
  TerminalSettingsReadOnly
} from '../settings/ReferenceSettings'
import { settingsItem } from '../settings/settingsRegistry'

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
  updateState,
  updateVersion,
  updateDetails,
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
  updateState: UpdateState
  updateVersion?: string
  updateDetails: string
  runCheck: () => Promise<void>
  openConfigureModels: () => Promise<void>
  openDocs: () => void
  openAdvanced: () => void
}): JSX.Element {
  return (
    <section className="settings-workspace" aria-label="Settings">
      <main className="settings-page">
        {section === 'profile' && (
          <ProfileSettings
            cwd={cwd}
            projectLabel={projectLabel}
            commandExecutable={commandExecutable}
            model={model}
            ptyHealth={ptyHealth}
            permissionMode={permissionMode}
            trust={trust}
            headlessJobs={headlessJobs}
            sessionCount={sessionCount}
            runtimeMode={runtimeMode}
          />
        )}

        {section === 'general' && (
          <GeneralSettings
            commandExecutable={commandExecutable}
            setCommandExecutable={setCommandExecutable}
            skipOnboarding={skipOnboarding}
            setSkipOnboarding={setSkipOnboarding}
            runCheck={runCheck}
          />
        )}

        {section === 'runtime' && (
          <RuntimeSettings
            cwd={cwd}
            commandExecutable={commandExecutable}
            model={model}
            setModel={setModel}
            transport={transport}
            ptyHealth={ptyHealth}
            permissionMode={permissionMode}
            setPermissionMode={setPermissionMode}
            trust={trust}
            setTrust={setTrust}
            runtimeMode={runtimeMode}
            openConfigureModels={openConfigureModels}
          />
        )}

        {section === 'appearance' && (
          <AppearanceSettings appearanceTheme={appearanceTheme} setAppearanceTheme={setAppearanceTheme} />
        )}

        {section === 'usage' && (
          <UsageSettings headlessJobs={headlessJobs} clearHeadlessJobs={clearHeadlessJobs} sessionCount={sessionCount} />
        )}

        {section === 'integrations' && (
          <IntegrationsSettings openDocs={openDocs} transport={transport} />
        )}

        {section === 'advanced' && (
          <AdvancedSettings openAdvanced={openAdvanced} />
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

        {section === 'keyboard' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Keyboard</div>
            <KeyboardSettingsReadOnly />
          </div>
        )}

        {section === 'notifications' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Notifications</div>
            <NotificationsSettingsReadOnly />
          </div>
        )}

        {section === 'terminal' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Terminal</div>
            <TerminalSettingsReadOnly />
          </div>
        )}

        {section === 'models' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Models</div>
            <ModelsSettingsReadOnly onConfigureModels={openConfigureModels} />
          </div>
        )}

        {section === 'design' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Design</div>
            <DesignSettingsReadOnly />
          </div>
        )}

        {section === 'hooks' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">Hooks</div>
            <HooksSettingsReadOnly />
          </div>
        )}

        {section === 'about' && (
          <div className="settings-detail-page">
            <div className="settings-page-title">About</div>
            <AboutSettingsReadOnly
              updateState={updateState}
              updateVersion={updateVersion}
              updateDetails={updateDetails}
              commandExecutable={commandExecutable}
            />
          </div>
        )}

        {![
          'profile',
          'general',
          'runtime',
          'appearance',
          'usage',
          'integrations',
          'advanced',
          'data',
          'mcp',
          'agents',
          'skills',
          'memory',
          'taste',
          'keyboard',
          'notifications',
          'terminal',
          'models',
          'design',
          'hooks',
          'about'
        ].includes(section) && (
          <SettingsPlaceholder section={section} />
        )}
      </main>
    </section>
  )
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

import type { JSX } from 'react'
import type { PermissionMode } from '../../../shared/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { DiscoveredSession } from '../../../core/types'
import type { AppearanceTheme, RuntimeMode, SettingsSection, UpdateState } from '../appTypes'
import type { HeadlessJob } from '../components/HeadlessHistory'
import {
  AgentsSettingsReadOnly,
  MemorySettingsReadOnly,
  ProjectStateSettings,
  SessionsSettingsReadOnly,
  SkillsSettingsReadOnly,
  TasteSettingsReadOnly
} from './AdvancedReadOnlySettings'
import {
  AdvancedSettings,
  AppearanceSettings,
  GeneralSettings,
  IntegrationsSettings,
  ProfileSettings,
  RuntimeSettings,
  UsageSettings
} from './CoreSettings'
import {
  AboutSettingsReadOnly,
  HooksSettingsReadOnly,
  KeyboardSettingsReadOnly,
  NotificationsSettings,
  TerminalSettings
} from './ReferenceSettings'
import { ModelsSettings } from './ModelsSettings'
import { McpSettings } from './McpSettings'
import { settingsItem } from './settingsRegistry'
import { DesignHelper } from '../workflows/DesignHelper'

const implementedSettingsSections: SettingsSection[] = [
  'profile',
  'general',
  'runtime',
  'appearance',
  'usage',
  'integrations',
  'advanced',
  'data',
  'sessions',
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
]

export type SettingsRouteProps = {
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
  headlessJobs: HeadlessJob[]
  clearHeadlessJobs: () => void
  sessionCount: number
  runtimeMode: RuntimeMode
  appearanceTheme: AppearanceTheme
  setAppearanceTheme: (value: AppearanceTheme) => void
  startupProjectBehavior: 'restore-last' | 'empty'
  setStartupProjectBehavior: (value: 'restore-last' | 'empty') => void
  updateState: UpdateState
  updateVersion?: string
  updateDetails: string
  runCheck: () => Promise<void>
  openConfigureModels: () => Promise<void>
  openDocs: () => void
  openSection: (section: SettingsSection) => void
  onResumeSession: (session: DiscoveredSession) => Promise<void>
}

export function SettingsRoute(props: SettingsRouteProps): JSX.Element {
  const {
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
    startupProjectBehavior,
    setStartupProjectBehavior,
    updateState,
    updateVersion,
    updateDetails,
    runCheck,
    openConfigureModels,
    openDocs,
    openSection,
    onResumeSession
  } = props

  switch (section) {
    case 'profile':
      return (
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
          openSection={openSection}
        />
      )
    case 'general':
      return (
        <GeneralSettings
          commandExecutable={commandExecutable}
          setCommandExecutable={setCommandExecutable}
          skipOnboarding={skipOnboarding}
          setSkipOnboarding={setSkipOnboarding}
          startupProjectBehavior={startupProjectBehavior}
          setStartupProjectBehavior={setStartupProjectBehavior}
          runCheck={runCheck}
        />
      )
    case 'runtime':
      return (
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
      )
    case 'appearance':
      return <AppearanceSettings appearanceTheme={appearanceTheme} setAppearanceTheme={setAppearanceTheme} />
    case 'usage':
      return (
        <UsageSettings
          cwd={cwd}
          commandExecutable={commandExecutable}
          transport={transport}
          headlessJobs={headlessJobs}
          clearHeadlessJobs={clearHeadlessJobs}
          sessionCount={sessionCount}
        />
      )
    case 'integrations':
      return <IntegrationsSettings openDocs={openDocs} transport={transport} openSection={openSection} />
    case 'advanced':
      return <AdvancedSettings openSection={openSection} />
    case 'data':
      return <SettingsFrame title="Data"><ProjectStateSettings transport={transport} cwd={cwd} /></SettingsFrame>
    case 'sessions':
      return <SettingsFrame title="Sessions"><SessionsSettingsReadOnly transport={transport} cwd={cwd} onResumeSession={onResumeSession} /></SettingsFrame>
    case 'mcp':
      return <SettingsFrame title="MCP"><McpSettings transport={transport} commandExecutable={commandExecutable} /></SettingsFrame>
    case 'agents':
      return <SettingsFrame title="Agents"><AgentsSettingsReadOnly transport={transport} cwd={cwd} /></SettingsFrame>
    case 'skills':
      return <SettingsFrame title="Skills"><SkillsSettingsReadOnly transport={transport} /></SettingsFrame>
    case 'memory':
      return <SettingsFrame title="Memory"><MemorySettingsReadOnly transport={transport} cwd={cwd} /></SettingsFrame>
    case 'taste':
      return <SettingsFrame title="Taste"><TasteSettingsReadOnly transport={transport} /></SettingsFrame>
    case 'keyboard':
      return <SettingsFrame title="Keyboard"><KeyboardSettingsReadOnly /></SettingsFrame>
    case 'notifications':
      return <SettingsFrame title="Notifications"><NotificationsSettings /></SettingsFrame>
    case 'terminal':
      return <SettingsFrame title="Terminal"><TerminalSettings /></SettingsFrame>
    case 'models':
      return <SettingsFrame title="Models"><ModelsSettings model={model} onConfigureModels={openConfigureModels} openRuntimeSettings={() => openSection('runtime')} /></SettingsFrame>
    case 'design':
      return <SettingsFrame title="Design"><DesignHelper /></SettingsFrame>
    case 'hooks':
      return <SettingsFrame title="Hooks"><HooksSettingsReadOnly transport={transport} cwd={cwd} /></SettingsFrame>
    case 'about':
      return (
        <SettingsFrame title="About">
          <AboutSettingsReadOnly
            updateState={updateState}
            updateVersion={updateVersion}
            updateDetails={updateDetails}
            commandExecutable={commandExecutable}
          />
        </SettingsFrame>
      )
    default:
      return <SettingsPlaceholder section={section} />
  }
}

export function isImplementedSettingsSection(section: SettingsSection): boolean {
  return implementedSettingsSections.includes(section)
}

function SettingsFrame({ title, children }: { title: string; children: JSX.Element }): JSX.Element {
  return (
    <div className="settings-detail-page">
      <div className="settings-page-title">{title}</div>
      {children}
    </div>
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

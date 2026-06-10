import type { JSX } from 'react'
import type { PermissionMode } from '../../../shared/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { DiscoveredSession } from '../../../core/types'
import type { AppearanceTheme, ChatBubbleColors, RuntimeMode, SettingsSection, UpdateState } from '../appTypes'
import type { HeadlessJob } from '../components/HeadlessHistory'
import {
  ProjectStateSettings,
  SessionsSettingsReadOnly
} from './AdvancedReadOnlySettings'
import { AgentsSettingsReadOnly } from './AgentsSettings'
import {
  AdvancedSettings,
  GeneralSettings,
  IntegrationsSettings,
  RuntimeSettings,
  UsageSettings
} from './CoreSettings'
import { AppearanceSettings } from './AppearanceSettings'
import { ProfileSettings } from './ProfileSettings'
import { MemorySettingsReadOnly } from './MemorySettings'
import {
  AboutSettingsReadOnly,
  KeyboardSettingsReadOnly,
  NotificationsSettings,
  TerminalSettings
} from './ReferenceSettings'
import { HooksSettingsReadOnly } from './HooksSettings'
import { SkillsSettingsReadOnly } from './SkillsSettings'
import { TasteSettingsReadOnly } from './TasteSettings'
import { ModelsSettings } from './ModelsSettings'
import { McpSettings } from './McpSettings'
import { settingsItem } from './settingsRegistry'
import { SettingsPageHeader } from './SettingsPageHeader'
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
  chatBubbleColors: ChatBubbleColors
  setChatBubbleColors: (value: ChatBubbleColors) => void
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
    chatBubbleColors,
    setChatBubbleColors,
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
          transport={transport}
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
      return <AppearanceSettings appearanceTheme={appearanceTheme} setAppearanceTheme={setAppearanceTheme} chatBubbleColors={chatBubbleColors} setChatBubbleColors={setChatBubbleColors} />
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
      return <SettingsFrame section="data" scope={cwd ? 'Project scope selected' : 'No project selected'}><ProjectStateSettings transport={transport} cwd={cwd} /></SettingsFrame>
    case 'sessions':
      return <SettingsFrame section="sessions" scope={cwd ? 'Project transcripts available' : 'Choose a project to resume sessions'}><SessionsSettingsReadOnly transport={transport} cwd={cwd} onResumeSession={onResumeSession} /></SettingsFrame>
    case 'mcp':
      return <SettingsFrame section="mcp" status="Command Code-owned commands"><McpSettings transport={transport} commandExecutable={commandExecutable} /></SettingsFrame>
    case 'agents':
      return <SettingsFrame section="agents" scope={cwd ? 'Project agents editable' : 'Choose a project to create agents'}><AgentsSettingsReadOnly transport={transport} cwd={cwd} /></SettingsFrame>
    case 'skills':
      return <SettingsFrame section="skills"><SkillsSettingsReadOnly transport={transport} /></SettingsFrame>
    case 'memory':
      return <SettingsFrame section="memory" scope={cwd ? 'Project memory editable' : 'Choose a project to edit memory'}><MemorySettingsReadOnly transport={transport} cwd={cwd} /></SettingsFrame>
    case 'taste':
      return <SettingsFrame section="taste"><TasteSettingsReadOnly transport={transport} /></SettingsFrame>
    case 'keyboard':
      return <SettingsFrame section="keyboard"><KeyboardSettingsReadOnly /></SettingsFrame>
    case 'notifications':
      return <SettingsFrame section="notifications" status="GUI feedback preferences"><NotificationsSettings /></SettingsFrame>
    case 'terminal':
      return <SettingsFrame section="terminal" status="Renderer-local presentation"><TerminalSettings /></SettingsFrame>
    case 'models':
      return <SettingsFrame section="models" status="Preview and picker guidance"><ModelsSettings model={model} onConfigureModels={openConfigureModels} openRuntimeSettings={() => openSection('runtime')} /></SettingsFrame>
    case 'design':
      return <SettingsFrame section="design" status="Preview-only helper"><DesignHelper /></SettingsFrame>
    case 'hooks':
      return <SettingsFrame section="hooks" scope={cwd ? 'Project and user hook scopes' : 'User hooks only until project is selected'}><HooksSettingsReadOnly transport={transport} cwd={cwd} /></SettingsFrame>
    case 'about':
      return (
        <SettingsFrame section="about">
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

function SettingsFrame({
  section,
  status,
  scope,
  children
}: {
  section: SettingsSection
  status?: string
  scope?: string
  children: JSX.Element
}): JSX.Element {
  const item = settingsItem(section)
  return (
    <div className="settings-detail-page">
      <SettingsPageHeader item={item} status={status} scope={scope} />
      {children}
    </div>
  )
}

function SettingsPlaceholder({ section }: { section: SettingsSection }): JSX.Element {
  const item = settingsItem(section)
  return (
    <div className="settings-detail-page">
      <SettingsPageHeader item={item} status="Registered route" scope="Read-only placeholder" />
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

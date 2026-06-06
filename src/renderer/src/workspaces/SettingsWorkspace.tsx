import type { JSX } from 'react'
import type { PermissionMode } from '../../../shared/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { DiscoveredSession } from '../../../core/types'
import type { AppearanceTheme, RuntimeMode, SettingsSection, UpdateState } from '../appTypes'
import type { HeadlessJob } from '../components/HeadlessHistory'
import { SettingsRoute } from '../settings/SettingsRoutes'

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
}): JSX.Element {
  return (
    <section className="settings-workspace" aria-label="Settings">
      <main className="settings-page">
        <SettingsRoute
          section={section}
          cwd={cwd}
          projectLabel={projectLabel}
          commandExecutable={commandExecutable}
          setCommandExecutable={setCommandExecutable}
          model={model}
          setModel={setModel}
          transport={transport}
          ptyHealth={ptyHealth}
          permissionMode={permissionMode}
          setPermissionMode={setPermissionMode}
          trust={trust}
          setTrust={setTrust}
          skipOnboarding={skipOnboarding}
          setSkipOnboarding={setSkipOnboarding}
          headlessJobs={headlessJobs}
          clearHeadlessJobs={clearHeadlessJobs}
          sessionCount={sessionCount}
          runtimeMode={runtimeMode}
          appearanceTheme={appearanceTheme}
          setAppearanceTheme={setAppearanceTheme}
          startupProjectBehavior={startupProjectBehavior}
          setStartupProjectBehavior={setStartupProjectBehavior}
          updateState={updateState}
          updateVersion={updateVersion}
          updateDetails={updateDetails}
          runCheck={runCheck}
          openConfigureModels={openConfigureModels}
          openDocs={openDocs}
          openSection={openSection}
          onResumeSession={onResumeSession}
        />
      </main>
    </section>
  )
}

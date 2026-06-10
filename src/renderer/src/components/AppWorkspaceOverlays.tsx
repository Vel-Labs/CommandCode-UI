import type { JSX } from 'react'
import type { AppWorkspaceContentProps } from './AppWorkspaceContentTypes'
import { AppPopovers } from './AppPopovers'
import { ReleaseNotesModal } from './ReleaseNotesModal'
import { releaseNoteForVersion } from '../services/updateReleaseNotes'

type AppWorkspaceOverlaysProps = Pick<AppWorkspaceContentProps,
  | 'popoverRef'
  | 'openPopover'
  | 'recentProjects'
  | 'runtimeMode'
  | 'ptyHealth'
  | 'commandExecutable'
  | 'cwd'
  | 'transport'
  | 'skipOnboarding'
  | 'headlessYolo'
  | 'headlessMaxTurns'
  | 'model'
  | 'permissionMode'
  | 'trust'
  | 'headlessJobs'
  | 'commandGroups'
  | 'commandPaletteItems'
  | 'activeTabId'
  | 'openSettingsSection'
  | 'chooseProject'
  | 'setCwd'
  | 'setOpenPopover'
  | 'setRuntimeMode'
  | 'setCommandExecutable'
  | 'runCheck'
  | 'setRightInspector'
  | 'setSkipOnboarding'
  | 'setHeadlessYolo'
  | 'setHeadlessMaxTurns'
  | 'setModel'
  | 'openConfigureModels'
  | 'setPermissionMode'
  | 'setTrust'
  | 'clearHeadlessJobs'
  | 'runCommand'
  | 'releaseNoteVersion'
  | 'updateDetails'
  | 'dismissReleaseNotes'
  | 'runReleaseNoteCommand'
>

export function AppWorkspaceOverlays({
  popoverRef,
  openPopover,
  recentProjects,
  runtimeMode,
  ptyHealth,
  commandExecutable,
  cwd,
  transport,
  skipOnboarding,
  headlessYolo,
  headlessMaxTurns,
  model,
  permissionMode,
  trust,
  headlessJobs,
  commandGroups,
  commandPaletteItems,
  activeTabId,
  openSettingsSection,
  chooseProject,
  setCwd,
  setOpenPopover,
  setRuntimeMode,
  setCommandExecutable,
  runCheck,
  setRightInspector,
  setSkipOnboarding,
  setHeadlessYolo,
  setHeadlessMaxTurns,
  setModel,
  openConfigureModels,
  setPermissionMode,
  setTrust,
  clearHeadlessJobs,
  runCommand,
  releaseNoteVersion,
  updateDetails,
  dismissReleaseNotes,
  runReleaseNoteCommand
}: AppWorkspaceOverlaysProps): JSX.Element {
  return (
    <>
      <AppPopovers
        popoverRef={popoverRef}
        openPopover={openPopover}
        recentProjects={recentProjects}
        runtimeMode={runtimeMode}
        ptyHealth={ptyHealth}
        commandExecutable={commandExecutable}
        cwd={cwd}
        transport={transport}
        skipOnboarding={skipOnboarding}
        headlessYolo={headlessYolo}
        headlessMaxTurns={headlessMaxTurns}
        model={model}
        permissionMode={permissionMode}
        trust={trust}
        headlessJobs={headlessJobs}
        commandGroups={commandGroups}
        commandPaletteItems={commandPaletteItems}
        hasActiveSession={Boolean(activeTabId)}
        openSettingsSection={openSettingsSection}
        chooseProject={chooseProject}
        setCwd={setCwd}
        setOpenPopover={setOpenPopover}
        setRuntimeMode={setRuntimeMode}
        setCommandExecutable={setCommandExecutable}
        runCheck={runCheck}
        openDocs={() => setRightInspector('docs')}
        setSkipOnboarding={setSkipOnboarding}
        setHeadlessYolo={setHeadlessYolo}
        setHeadlessMaxTurns={setHeadlessMaxTurns}
        setModel={setModel}
        openConfigureModels={openConfigureModels}
        setPermissionMode={setPermissionMode}
        setTrust={setTrust}
        clearHeadlessJobs={clearHeadlessJobs}
        runCommand={runCommand}
      />
      {releaseNoteVersion && (
        <ReleaseNotesModal
          version={releaseNoteVersion}
          note={releaseNoteForVersion(releaseNoteVersion, updateDetails)}
          onClose={dismissReleaseNotes}
          onRunCommand={runReleaseNoteCommand}
        />
      )}
    </>
  )
}

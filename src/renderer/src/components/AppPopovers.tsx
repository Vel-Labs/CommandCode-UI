import type { JSX, RefObject } from 'react'
import { Folder, FolderOpen } from 'lucide-react'
import type { PermissionMode } from '../../../shared/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { CommandPaletteItem, PopoverKey, RuntimeMode } from '../appTypes'
import type { HeadlessJob } from './HeadlessHistory'
import { AuthCard } from './AuthCard'
import { HeadlessHistory } from './HeadlessHistory'
import { IdePanel } from './IdePanel'
import { ModelDropdown } from './ModelDropdown'

export function AppPopovers({
  popoverRef,
  openPopover,
  recentProjects,
  runtimeMode,
  realSessionDisabled,
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
  chooseProject,
  setCwd,
  setOpenPopover,
  setRuntimeMode,
  setCommandExecutable,
  runCheck,
  openDocs,
  openAdvanced,
  setSkipOnboarding,
  setHeadlessYolo,
  setHeadlessMaxTurns,
  setModel,
  openConfigureModels,
  setPermissionMode,
  setTrust,
  clearHeadlessJobs,
  runCommand
}: {
  popoverRef: RefObject<HTMLDivElement | null>
  openPopover: PopoverKey
  recentProjects: string[]
  runtimeMode: RuntimeMode
  realSessionDisabled: boolean
  ptyHealth: PtyDoctorResult | null
  commandExecutable: string
  cwd: string
  transport: TransportAPI
  skipOnboarding: boolean
  headlessYolo: boolean
  headlessMaxTurns: number
  model: string
  permissionMode: PermissionMode
  trust: boolean
  headlessJobs: HeadlessJob[]
  commandGroups: CommandPaletteItem['group'][]
  commandPaletteItems: CommandPaletteItem[]
  chooseProject: () => Promise<void>
  setCwd: (project: string) => void
  setOpenPopover: (value: PopoverKey) => void
  setRuntimeMode: (mode: RuntimeMode) => void
  setCommandExecutable: (value: string) => void
  runCheck: () => Promise<void>
  openDocs: () => void
  openAdvanced: () => void
  setSkipOnboarding: (value: boolean) => void
  setHeadlessYolo: (value: boolean) => void
  setHeadlessMaxTurns: (value: number) => void
  setModel: (value: string) => void
  openConfigureModels: () => Promise<void>
  setPermissionMode: (value: PermissionMode) => void
  setTrust: (value: boolean) => void
  clearHeadlessJobs: () => void
  runCommand: (item: CommandPaletteItem) => Promise<void>
}): JSX.Element | null {
  return (
    <>
      {openPopover === 'project' && (
        <div ref={popoverRef} className="native-popover project-popover">
          <div className="popover-title">Project</div>
          <button className="popover-row" onClick={() => void chooseProject()}><FolderOpen size={16} /> Choose folder...</button>
          {recentProjects.map((project) => (
            <button key={project} className="popover-row" onClick={() => { setCwd(project); setOpenPopover(null) }} title={project}>
              <Folder size={16} /> {displayPath(project)}
            </button>
          ))}
        </div>
      )}

      {openPopover === 'mode' && (
        <div ref={popoverRef} className="native-popover mode-popover">
          <div className="popover-title">Session</div>
          <button
            className={`popover-row ${runtimeMode === 'real-session' ? 'popover-row--active' : ''}`}
            disabled={realSessionDisabled}
            onClick={() => setRuntimeMode('real-session')}
            title={realSessionDisabled ? (ptyHealth?.error || 'PTY is unhealthy') : 'Start a real PTY session'}
          >
            Real session
          </button>
          <button className={`popover-row ${runtimeMode === 'mock' ? 'popover-row--active' : ''}`} onClick={() => setRuntimeMode('mock')}>Demo mode</button>
          <div className="popover-note">Headless runs now live in the command menu as Run headless.</div>
          {realSessionDisabled && <div className="popover-note">{ptyHealth?.error || 'Real session disabled until PTY is healthy.'}</div>}
        </div>
      )}

      {openPopover === 'permission' && (
        <div ref={popoverRef} className="native-popover permission-popover">
          <div className="popover-title">Access</div>
          <button className={`popover-row ${permissionMode === 'standard' && !trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('standard'); setTrust(false); setOpenPopover(null) }}>
            Standard
            <span className="popover-row-description">Prompt before risky tool use.</span>
          </button>
          <button className={`popover-row popover-row--warn ${permissionMode === 'auto-accept' && !trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('auto-accept'); setTrust(false); setOpenPopover(null) }}>
            Full access
            <span className="popover-row-description">Auto-accept Command Code tool prompts.</span>
          </button>
          <button className={`popover-row popover-row--warn ${trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('standard'); setTrust(true); setOpenPopover(null) }}>
            Trust project
            <span className="popover-row-description">Pass --trust for this project.</span>
          </button>
        </div>
      )}

      {openPopover === 'runtime' && (
        <div ref={popoverRef} className="native-popover runtime-popover">
          <div className="popover-title">Runtime</div>
          <label className="field-label">Command binary</label>
          <input className="native-input" value={commandExecutable} onChange={(event) => setCommandExecutable(event.target.value)} />
          <div className="runtime-grid">
            <button className="ghost-button native-ghost" onClick={() => void runCheck()}>Check CLI</button>
            <button className="ghost-button native-ghost" onClick={() => transport.openExternal('https://commandcode.ai/docs/reference/cli')}>CLI docs</button>
            <button className="ghost-button native-ghost" onClick={openDocs}>Docs</button>
            <button className="ghost-button native-ghost" onClick={openAdvanced}>Advanced</button>
          </div>
          <label className="checkbox-row"><input type="checkbox" checked={skipOnboarding} onChange={(event) => setSkipOnboarding(event.target.checked)} /> Skip onboarding</label>
          <label className="checkbox-row"><input type="checkbox" checked={runtimeMode === 'mock'} onChange={(event) => setRuntimeMode(event.target.checked ? 'mock' : 'real-session')} disabled={!ptyHealth?.healthy && runtimeMode === 'mock'} /> Use Demo mode</label>
          <label className="checkbox-row"><input type="checkbox" checked={headlessYolo} onChange={(event) => setHeadlessYolo(event.target.checked)} /> Allow write tools in headless commands</label>
          <label className="field-label">Headless max turns</label>
          <input className="native-input" type="number" min={1} max={100} value={headlessMaxTurns} onChange={(event) => setHeadlessMaxTurns(Number(event.target.value) || 1)} />
          <ModelDropdown transport={transport} model={model} setModel={setModel} commandExecutable={commandExecutable} cwd={cwd} onConfigureModels={openConfigureModels} />
          <AuthCard transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
          <IdePanel transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
          <HeadlessHistory jobs={headlessJobs} onClear={clearHeadlessJobs} />
        </div>
      )}

      {openPopover === 'model' && (
        <div ref={popoverRef} className="native-popover model-popover">
          <div className="popover-title">Model</div>
          <ModelDropdown transport={transport} model={model} setModel={(value) => { setModel(value); setOpenPopover(null) }} commandExecutable={commandExecutable} cwd={cwd} onConfigureModels={openConfigureModels} />
        </div>
      )}

      {openPopover === 'slash' && (
        <div ref={popoverRef} className="native-popover slash-popover">
          <div className="popover-title">Commands</div>
          {commandGroups.map((group) => (
            <div key={group} className="command-group">
              <div className="command-group-title">{group}</div>
              {commandPaletteItems.filter((item) => item.group === group).map((item) => (
                <button key={item.id} className="popover-row command-row" onClick={() => void runCommand(item)}>
                  <span className="command-row-main">
                    <strong>{item.label}</strong>
                    <code>{item.command}</code>
                  </span>
                  <span className="popover-row-description">{item.description}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function displayPath(input: string): string {
  if (!input.trim()) return 'No project selected'
  const parts = input.split('/').filter(Boolean)
  return parts.at(-1) || input
}

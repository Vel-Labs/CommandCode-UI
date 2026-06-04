import type { JSX } from 'react'
import type { PermissionMode } from '../../../shared/types'
import { StatusPill } from './StatusPill'

type ControlPanelProps = {
  cwd: string
  setCwd: (cwd: string) => void
  commandExecutable: string
  setCommandExecutable: (value: string) => void
  model: string
  setModel: (value: string) => void
  permissionMode: PermissionMode
  setPermissionMode: (mode: PermissionMode) => void
  trust: boolean
  setTrust: (value: boolean) => void
  skipOnboarding: boolean
  setSkipOnboarding: (value: boolean) => void
  useMock: boolean
  setUseMock: (value: boolean) => void
  activeSessionId?: string
  stopRequested?: boolean
  statusLine: string
  onChooseProject: () => void
  onStartSession: () => void
  onStopSession: () => void
  onCheck: () => void
  onStatus: () => void
  onListModels: () => void
  onSlash: (command: string) => void
}

const quickCommands = [
  '/help',
  '/plan Build a safe GUI wrapper around Command Code',
  '/model',
  '/rewind',
  '/skills',
  '/taste',
  '/design surface src/renderer/src/App.tsx',
  '/exit'
]

export function ControlPanel(props: ControlPanelProps): JSX.Element {
  return (
    <aside className="control-panel">
      <div className="brand-block">
        <div className="brand-kicker">Desktop Adapter</div>
        <h1>Command Code with a cockpit.</h1>
        <p>Run the terminal agent as the engine. Give operators a sharper surface.</p>
      </div>

      <div className="panel-section">
        <div className="section-heading">Project</div>
        <label className="field-label" htmlFor="cwd">Working directory</label>
        <div className="inline-field">
          <input id="cwd" value={props.cwd} onChange={(event) => props.setCwd(event.target.value)} placeholder="/path/to/project" />
          <button className="ghost-button" onClick={props.onChooseProject}>Choose</button>
        </div>

        <label className="field-label" htmlFor="command-bin">Command binary</label>
        <input id="command-bin" value={props.commandExecutable} onChange={(event) => props.setCommandExecutable(event.target.value)} placeholder="cmd" />
      </div>

      <div className="panel-section">
        <div className="section-heading">Session</div>
        <label className="field-label" htmlFor="model">Model override</label>
        <input id="model" value={props.model} onChange={(event) => props.setModel(event.target.value)} placeholder="optional, e.g. claude-sonnet-4-6" />

        <div className="segmented" role="group" aria-label="Permission mode">
          {(['standard', 'plan', 'auto-accept'] as PermissionMode[]).map((mode) => (
            <button
              key={mode}
              className={props.permissionMode === mode ? 'selected' : ''}
              onClick={() => props.setPermissionMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        <label className="check-row">
          <input type="checkbox" checked={props.trust} onChange={(event) => props.setTrust(event.target.checked)} />
          Auto-trust project
        </label>
        <label className="check-row">
          <input type="checkbox" checked={props.skipOnboarding} onChange={(event) => props.setSkipOnboarding(event.target.checked)} />
          Skip onboarding
        </label>
        <label className="check-row">
          <input type="checkbox" checked={props.useMock} onChange={(event) => props.setUseMock(event.target.checked)} />
          Mock mode
        </label>

        <div className="button-grid">
          <button className="primary-button" onClick={props.onStartSession} disabled={Boolean(props.activeSessionId)}>Start</button>
          <button className={props.stopRequested ? 'danger-button warning' : 'danger-button'} onClick={props.onStopSession} disabled={!props.activeSessionId}>
            {props.stopRequested ? 'Force Stop' : 'Stop'}
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-heading">Doctor</div>
        <div className="button-grid three">
          <button className="ghost-button" onClick={props.onCheck}>Version</button>
          <button className="ghost-button" onClick={props.onStatus}>Status</button>
          <button className="ghost-button" onClick={props.onListModels}>Models</button>
        </div>
        <div className="status-line">{props.statusLine || 'No checks run yet.'}</div>
      </div>

      <div className="panel-section">
        <div className="section-heading">Quick commands</div>
        <div className="quick-command-list">
          {quickCommands.map((command) => (
            <button key={command} onClick={() => props.onSlash(command)} disabled={!props.activeSessionId}>
              {command}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section compact-meta">
        <StatusPill label={props.activeSessionId ? 'session live' : 'idle'} tone={props.activeSessionId ? 'good' : 'default'} />
        <StatusPill label={props.useMock ? 'mock' : 'real cli'} tone={props.useMock ? 'purple' : 'warn'} />
      </div>
    </aside>
  )
}

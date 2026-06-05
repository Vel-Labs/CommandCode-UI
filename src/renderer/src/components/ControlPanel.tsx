import type { JSX, ReactNode } from 'react'
import type { PermissionMode } from '../../../shared/types'
import { StatusPill } from './StatusPill'

type ControlPanelProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
  cwd: string
  setCwd: (cwd: string) => void
  commandExecutable: string
  setCommandExecutable: (value: string) => void
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
  onSlash: (command: string) => void
  children?: ReactNode
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
  if (props.collapsed) {
    return (
      <aside className="control-panel control-panel--collapsed" aria-label="Collapsed configuration panel">
        <button
          className="rail-expand-button"
          onClick={props.onToggleCollapsed}
          aria-label="Expand configuration panel"
          title="Expand configuration panel"
        >
          <span className="rail-expand-glyph">Config</span>
        </button>
        <div className="collapsed-status-stack">
          <StatusPill label={props.activeSessionId ? 'live' : 'idle'} tone={props.activeSessionId ? 'good' : 'default'} />
          <StatusPill label={props.useMock ? 'mock' : 'real'} tone={props.useMock ? 'purple' : 'warn'} />
        </div>
      </aside>
    )
  }

  return (
    <aside className="control-panel">
      <div className="panel-topline">
        <div className="app-identity">
          <div className="app-mark">CC</div>
          <div>
            <div className="app-name">Command Code</div>
            <div className="app-subtitle">{props.useMock ? 'Mock runtime' : 'Real CLI runtime'}</div>
          </div>
        </div>
        <button
          className="ghost-button panel-collapse-button"
          onClick={props.onToggleCollapsed}
          aria-label="Collapse configuration panel"
          title="Collapse configuration panel"
        >
          Collapse
        </button>
      </div>

      <div className="primary-session-actions">
        <button className="primary-button new-session-button" onClick={props.onStartSession} disabled={Boolean(props.activeSessionId)}>
          New session
        </button>
        <button className={props.stopRequested ? 'danger-button warning' : 'danger-button'} onClick={props.onStopSession} disabled={!props.activeSessionId}>
          {props.stopRequested ? 'Force stop' : 'Stop'}
        </button>
      </div>

      <div className="panel-section">
        <div className="section-heading">Project</div>
        <label className="field-label" htmlFor="cwd">Working directory</label>
        <div className="inline-field project-picker-row">
          <input id="cwd" value={props.cwd} onChange={(event) => props.setCwd(event.target.value)} placeholder="/path/to/project" />
          <button className="ghost-button" onClick={props.onChooseProject}>Choose</button>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-heading">Runtime</div>

        <label className="field-label" htmlFor="command-bin">Command binary</label>
        <input id="command-bin" value={props.commandExecutable} onChange={(event) => props.setCommandExecutable(event.target.value)} placeholder="cmd" />
      </div>

      <div className="panel-section">
        <div className="section-heading">Session</div>

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
      </div>

      {props.children}

      <div className="panel-section">
        <div className="section-heading">Doctor</div>
        <div className="button-grid">
          <button className="ghost-button" onClick={props.onCheck}>Version</button>
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

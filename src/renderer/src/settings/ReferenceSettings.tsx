import type { JSX, ReactNode } from 'react'
import type { UpdateState } from '../appTypes'

export function KeyboardSettingsReadOnly(): JSX.Element {
  return (
    <SettingsReferenceCard title="Keyboard shortcuts">
      <ReferenceRow label="Start new session" value="Cmd/Ctrl + T" />
      <ReferenceRow label="Submit composer prompt" value="Enter" />
      <ReferenceRow label="New line in composer" value="Shift + Enter" />
      <ReferenceRow label="Dismiss open popover" value="Escape" />
      <ReferenceRow label="Terminal menus" value="Menu input toggle" />
      <p className="settings-muted">Shortcut remapping is planned. This reference is read-only and does not write GUI preferences.</p>
    </SettingsReferenceCard>
  )
}

export function NotificationsSettingsReadOnly(): JSX.Element {
  return (
    <SettingsReferenceCard title="Notifications">
      <ReferenceRow label="Toast categories" value="session-started, session-exited, headless-complete, headless-error" />
      <ReferenceRow label="Audio default" value="Off" />
      <ReferenceRow label="Response-ready notifications" value="Deferred until explicit readiness state exists" />
      <p className="settings-muted">Notification editing is deferred behind the shared settings persistence and session-readiness gates. Existing toast/audio behavior is unchanged.</p>
    </SettingsReferenceCard>
  )
}

export function TerminalSettingsReadOnly(): JSX.Element {
  return (
    <SettingsReferenceCard title="Terminal">
      <ReferenceRow label="Interactive surface" value="xterm.js through server-owned PTY/WebSocket transport" />
      <ReferenceRow label="Menu input" value="Explicit toggle before routing keyboard input to terminal menus" />
      <ReferenceRow label="Bottom terminal" value="Project shell session, manually opened and closed" />
      <p className="settings-muted">Terminal font, scrollback, bell, cursor, line height, and profile controls are planned. No terminal preferences are written in this package.</p>
    </SettingsReferenceCard>
  )
}

export function ModelsSettingsReadOnly({ onConfigureModels }: { onConfigureModels: () => Promise<void> }): JSX.Element {
  return (
    <SettingsReferenceCard title="Models">
      <ReferenceRow label="Active session model" value="Stored at session start when available" />
      <ReferenceRow label="Global model picker" value="Runtime section" />
      <ReferenceRow label="Task routing helper" value="/configure-models" />
      <button className="ghost-button native-ghost settings-inline-action" onClick={() => void onConfigureModels()}>Open /configure-models</button>
      <p className="settings-muted">This page is a helper entry point only. It does not infer model routing semantics or edit Command Code config.</p>
    </SettingsReferenceCard>
  )
}

export function DesignSettingsReadOnly(): JSX.Element {
  return (
    <SettingsReferenceCard title="Design helper">
      <ReferenceRow label="Default GUI design mode" value="/design surface" />
      <ReferenceRow label="Available source" value="Local Command Code docs reference" />
      <ReferenceRow label="Execution" value="Send a previewed slash command through the active session" />
      <p className="settings-muted">Mode pickers, target selection, and command previews are planned. No hidden prompt mutation is added here.</p>
    </SettingsReferenceCard>
  )
}

export function HooksSettingsReadOnly(): JSX.Element {
  return (
    <SettingsReferenceCard title="Hooks">
      <ReferenceRow label="Project scope" value=".commandcode/settings.json" />
      <ReferenceRow label="User scope" value="~/.commandcode/settings.json" />
      <ReferenceRow label="Documented events" value="PreToolUse, PostToolUse, Stop" />
      <p className="settings-muted">Hook discovery, validation, examples, and writes are deferred. Hook execution remains Command Code-owned.</p>
    </SettingsReferenceCard>
  )
}

export function AboutSettingsReadOnly({
  updateState,
  updateVersion,
  updateDetails,
  commandExecutable
}: {
  updateState: UpdateState
  updateVersion?: string
  updateDetails: string
  commandExecutable: string
}): JSX.Element {
  return (
    <SettingsReferenceCard title="About">
      <ReferenceRow label="GUI package" value="command-code-gui 0.1.0" />
      <ReferenceRow label="Command binary" value={commandExecutable || 'cmd'} />
      <ReferenceRow label="Update status" value={updateLabel(updateState, updateVersion)} />
      {updateDetails && <pre className="settings-about-details">{updateDetails}</pre>}
      <p className="settings-muted">Release history and contributor docs are local documentation surfaces. This page does not run update checks or mutate installed Command Code state.</p>
    </SettingsReferenceCard>
  )
}

function SettingsReferenceCard({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="settings-card settings-card--wide">
      <div className="settings-readonly-header">
        <strong>{title}</strong>
      </div>
      {children}
    </div>
  )
}

function ReferenceRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="settings-readonly-row">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  )
}

function updateLabel(state: UpdateState, version?: string): string {
  if (state === 'checking') return 'Checking updates'
  if (state === 'updating') return 'Updating'
  if (state === 'available') return 'Update available'
  if (state === 'failed') return 'Update check failed'
  if (state === 'current') return version || 'Up to date'
  return 'Not checked'
}

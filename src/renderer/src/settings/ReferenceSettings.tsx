import { useCallback, useEffect, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { UpdateState } from '../appTypes'
import { releaseNotes } from '../commandPalette'
import {
  NOTIFICATION_PREFERENCES_CHANGED_EVENT,
  defaultAudioPrefs,
  loadAudioPrefs,
  loadToastPrefs,
  notificationCategoryLabel,
  saveAudioPrefs,
  saveToastPrefs
} from './notificationPreferences'
import type { AudioPrefs, ToastPrefs } from './notificationPreferences'
import { loadTerminalPrefs, saveTerminalPrefs } from './terminalPreferences'
import type { TerminalPrefs } from './terminalPreferences'

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

export function NotificationsSettings(): JSX.Element {
  const [toastPrefs, setToastPrefs] = useState<ToastPrefs>(loadToastPrefs)
  const [audioPrefs, setAudioPrefs] = useState<AudioPrefs>(loadAudioPrefs)

  useEffect(() => {
    const reload = () => {
      setToastPrefs(loadToastPrefs())
      setAudioPrefs(loadAudioPrefs())
    }
    window.addEventListener(NOTIFICATION_PREFERENCES_CHANGED_EVENT, reload)
    return () => window.removeEventListener(NOTIFICATION_PREFERENCES_CHANGED_EVENT, reload)
  }, [])

  const updateToast = useCallback((update: Partial<ToastPrefs>) => {
    setToastPrefs((prev) => saveToastPrefs({ ...prev, ...update }))
  }, [])

  const updateAudio = useCallback((update: Partial<AudioPrefs>) => {
    setAudioPrefs((prev) => saveAudioPrefs({ ...prev, ...update }))
  }, [])

  return (
    <SettingsReferenceCard title="Notifications">
      <div className="settings-destination-note">
        <span>Renderer-local GUI preference</span>
        <code>localStorage: ccgui.toast-preferences, ccgui.audio-preferences</code>
        <small>toast/audio only</small>
      </div>
      <label className="settings-control-row">
        <span>Toast duration</span>
        <select value={toastPrefs.durationMs} onChange={(event) => updateToast({ durationMs: Number(event.target.value) })}>
          <option value={2500}>2.5 seconds</option>
          <option value={4000}>4 seconds</option>
          <option value={6500}>6.5 seconds</option>
          <option value={10000}>10 seconds</option>
        </select>
      </label>
      <div className="settings-toggle-grid">
        {Object.entries(toastPrefs.categories).map(([key, enabled]) => (
          <label key={key} className="settings-toggle-row">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => updateToast({ categories: { ...toastPrefs.categories, [key]: event.target.checked } })}
            />
            <span>{notificationCategoryLabel(key)}</span>
          </label>
        ))}
      </div>
      <label className="settings-control-row">
        <span>Audio master volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={audioPrefs.masterVolume}
          onChange={(event) => updateAudio({ masterVolume: Number(event.target.value) })}
        />
        <small>{Math.round(audioPrefs.masterVolume * 100)}%</small>
      </label>
      <div className="settings-toggle-grid">
        {Object.entries(defaultAudioPrefs.categories).map(([key]) => {
          const fallback = defaultAudioPrefs.categories[key] || { enabled: false, volume: 1 }
          const category = audioPrefs.categories[key] || fallback
          return (
            <label key={key} className="settings-toggle-row">
              <input
                type="checkbox"
                checked={category.enabled}
                onChange={(event) => updateAudio({ categories: { ...audioPrefs.categories, [key]: { ...category, enabled: event.target.checked } } })}
              />
              <span>{notificationCategoryLabel(key)} audio</span>
            </label>
          )
        })}
      </div>
      <ReferenceRow label="Response-ready notifications" value="Deferred until explicit readiness state exists" />
      <p className="settings-muted">These settings only control existing renderer toast/audio cues. OS notifications, hook-triggered alerts, quiet mode, and per-session readiness remain planned.</p>
    </SettingsReferenceCard>
  )
}

export function TerminalSettings(): JSX.Element {
  const [terminalPrefs, setTerminalPrefs] = useState<TerminalPrefs>(loadTerminalPrefs)
  const updateTerminal = useCallback((update: Partial<TerminalPrefs>) => {
    setTerminalPrefs((prev) => saveTerminalPrefs({ ...prev, ...update }))
  }, [])

  return (
    <SettingsReferenceCard title="Terminal">
      <div className="settings-destination-note">
        <span>Renderer-local GUI preference</span>
        <code>localStorage: ccgui.terminal-preferences</code>
        <small>xterm presentation</small>
      </div>
      <ReferenceRow label="Interactive surface" value="xterm.js through server-owned PTY/WebSocket transport" />
      <ReferenceRow label="Menu input" value="Explicit toggle before routing keyboard input to terminal menus" />
      <ReferenceRow label="Bottom terminal" value="Project shell session, manually opened and closed" />
      <label className="settings-control-row">
        <span>Font size</span>
        <input
          type="range"
          min={11}
          max={18}
          step={1}
          value={terminalPrefs.fontSize}
          onChange={(event) => updateTerminal({ fontSize: Number(event.target.value) })}
        />
        <small>{terminalPrefs.fontSize}px</small>
      </label>
      <label className="settings-control-row">
        <span>Line height</span>
        <input
          type="range"
          min={1}
          max={1.6}
          step={0.05}
          value={terminalPrefs.lineHeight}
          onChange={(event) => updateTerminal({ lineHeight: Number(event.target.value) })}
        />
        <small>{terminalPrefs.lineHeight.toFixed(2)}</small>
      </label>
      <label className="settings-control-row">
        <span>Scrollback</span>
        <select value={terminalPrefs.scrollback} onChange={(event) => updateTerminal({ scrollback: Number(event.target.value) })}>
          <option value={5_000}>5,000 lines</option>
          <option value={20_000}>20,000 lines</option>
          <option value={50_000}>50,000 lines</option>
          <option value={100_000}>100,000 lines</option>
        </select>
      </label>
      <div className="settings-toggle-grid">
        <label className="settings-toggle-row">
          <input
            type="checkbox"
            checked={terminalPrefs.cursorBlink}
            onChange={(event) => updateTerminal({ cursorBlink: event.target.checked })}
          />
          <span>Blink cursor</span>
        </label>
      </div>
      <ReferenceRow label="Apply timing" value="Loaded when terminal panes mount; active PTY/session geometry is not changed by this package" />
      <p className="settings-muted">These settings only control xterm presentation. Bell behavior, terminal profiles, history controls, and PTY lifecycle changes remain planned.</p>
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
      <div className="settings-release-list">
        {Object.entries(releaseNotes).map(([version, note]) => (
          <article key={version} className="settings-release-item">
            <span>{version}</span>
            <strong>{note.title}</strong>
            <p>{note.body}</p>
          </article>
        ))}
      </div>
      <p className="settings-muted">Release history is local metadata already bundled with the GUI. This page does not run update checks or mutate installed Command Code state.</p>
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

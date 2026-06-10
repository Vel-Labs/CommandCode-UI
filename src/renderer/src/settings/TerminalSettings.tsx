import { useCallback, useState } from 'react'
import type { JSX } from 'react'
import { loadTerminalPrefs, saveTerminalPrefs } from './terminalPreferences'
import type { TerminalPrefs } from './terminalPreferences'
import { ReferenceRow, SettingsReferenceCard } from './ReferenceSettingsShared'

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

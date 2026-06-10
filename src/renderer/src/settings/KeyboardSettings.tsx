import type { JSX } from 'react'
import { commandPaletteItems } from '../commandPalette'
import { SettingsReferenceCard } from './ReferenceSettingsShared'

export function KeyboardSettingsReadOnly(): JSX.Element {
  return (
    <SettingsReferenceCard title="Keyboard shortcuts">
      <div className="settings-shortcut-grid">
        <ShortcutRow label="New session" keys={['Cmd/Ctrl', 'T']} detail="Starts a new project session from the current project." />
        <ShortcutRow label="Send composer prompt" keys={['Enter']} detail="Submits the composer when focus is in the prompt box." />
        <ShortcutRow label="New composer line" keys={['Shift', 'Enter']} detail="Adds a newline without submitting." />
        <ShortcutRow label="Dismiss popover" keys={['Escape']} detail="Closes open project, runtime, model, permission, and command popovers." />
        <ShortcutRow label="Open transcript detail" keys={['Ctrl', 'O']} detail="Terminal control sequence opens the active transcript in the inspector." />
        <ShortcutRow label="Terminal menus" keys={['Menu input']} detail="Explicit toggle before keyboard input is routed to Command Code terminal menus." />
      </div>
      <div className="settings-command-grid">
        {commandPaletteItems.map((item) => (
          <div key={item.id} className="settings-command-row">
            <strong>{item.label}</strong>
            <code>{item.command}</code>
            <span>{item.group}</span>
          </div>
        ))}
      </div>
      <p className="settings-muted">Shortcut remapping is planned. This reference is read-only and does not write GUI preferences or Command Code settings.</p>
    </SettingsReferenceCard>
  )
}

function ShortcutRow({ label, keys, detail }: { label: string; keys: string[]; detail: string }): JSX.Element {
  return (
    <div className="settings-shortcut-row">
      <strong>{label}</strong>
      <span>{keys.map((key) => <kbd key={key}>{key}</kbd>)}</span>
      <small>{detail}</small>
    </div>
  )
}

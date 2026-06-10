import type { JSX } from 'react'
import { ReferenceRow, SettingsReferenceCard } from './ReferenceSettingsShared'

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

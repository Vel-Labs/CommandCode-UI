import type { JSX } from 'react'
import type { UpdateState } from '../appTypes'
import { releaseNotes } from '../commandPalette'
import { ReferenceRow, SettingsReferenceCard } from './ReferenceSettingsShared'

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

function updateLabel(state: UpdateState, version?: string): string {
  if (state === 'checking') return 'Checking updates'
  if (state === 'updating') return 'Updating'
  if (state === 'available') return 'Update available'
  if (state === 'failed') return 'Update check failed'
  if (state === 'current') return version || 'Up to date'
  return 'Not checked'
}

import type { JSX } from 'react'
import { Route, Sparkles, X } from 'lucide-react'
import type { ReleaseNote } from '../appTypes'

export function ReleaseNotesModal({
  version,
  note,
  onClose,
  onConfigureModels
}: {
  version: string
  note: ReleaseNote
  onClose: () => void
  onConfigureModels: () => Promise<void>
}): JSX.Element {
  return (
    <div className="release-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="release-modal" role="dialog" aria-modal="true" aria-labelledby="release-title" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button release-close" onClick={onClose} title="Dismiss release notes"><X size={18} /></button>
        <div className="release-eyebrow"><Sparkles size={16} /> {note.eyebrow}</div>
        <h2 id="release-title">{note.title}</h2>
        <p>{note.body}</p>
        <ul>
          {note.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
        <div className="release-actions">
          {note.command && (
            <button className="primary-button release-primary" onClick={() => void onConfigureModels()}>
              <Route size={16} /> Open {note.command}
            </button>
          )}
          <button className="ghost-button native-ghost" onClick={onClose}>Not now</button>
        </div>
        <div className="release-footnote">Command Code {version} is installed. These notes are stored locally after dismissal.</div>
      </section>
    </div>
  )
}

import type { ReleaseNote } from '../appTypes'
import { releaseNotes } from '../commandPalette'

export function releaseNoteForVersion(version: string, updateDetails = ''): ReleaseNote {
  const known = releaseNotes[version]
  if (known) return known

  const detailLines = updateDetails
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[✔✓-]\s*/, ''))
    .filter(Boolean)
    .filter((line) => !/checking for updates|up to date|updated|installed|command code/i.test(line))
  const title = detailLines.find((line) => /^new in v?\d+\.\d+\.\d+/i.test(line))
    ? 'Command Code updated'
    : detailLines[0] || 'Command Code updated'
  const body = detailLines[1] || 'This version is installed, but the CLI update output did not include bundled release notes.'
  const bullets = detailLines
    .slice(2)
    .filter((line) => line !== body && line !== title)
    .slice(0, 5)

  return {
    eyebrow: `New in v${version}`,
    title,
    body,
    bullets: bullets.length ? bullets : [
      'The raw update receipt remains visible in Settings > About.',
      'Add curated notes in the GUI release-note map when Command Code announces feature details.'
    ],
    generated: true
  }
}

export function hasNoteLikeUpdateDetails(updateDetails: string): boolean {
  return /new in v?\d+\.\d+\.\d+|release notes?|what'?s new|changelog/i.test(updateDetails)
}

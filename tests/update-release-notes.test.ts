import { describe, expect, it } from 'vitest'
import { hasNoteLikeUpdateDetails, releaseNoteForVersion } from '../src/renderer/src/services/updateReleaseNotes'

describe('update release notes', () => {
  it('returns the curated Command Code 0.33.2 web browsing note', () => {
    expect(releaseNoteForVersion('0.33.2')).toMatchObject({
      eyebrow: 'New in v0.33.2',
      title: 'Web Search + Web Fetch',
      body: expect.stringContaining('browse the web'),
      bullets: [
        'Web Search returns ranked results.',
        'Web Fetch reads full pages instead of snippets.',
        'Training data has a cutoff. The web does not.'
      ]
    })
  })

  it('formats note-like update output for versions without curated notes', () => {
    const note = releaseNoteForVersion('0.34.0', [
      'New in v0.34.0',
      'Better terminal context.',
      '- Keeps approvals visible.',
      '- Reduces noisy repaint output.'
    ].join('\n'))

    expect(note).toMatchObject({
      eyebrow: 'New in v0.34.0',
      title: 'Command Code updated',
      body: 'Better terminal context.',
      bullets: [
        'Keeps approvals visible.',
        'Reduces noisy repaint output.'
      ],
      generated: true
    })
  })

  it('falls back to a consistent modal note when update output has no notes', () => {
    const note = releaseNoteForVersion('0.34.1', '✔ Up to date (0.34.1)')

    expect(note.generated).toBe(true)
    expect(note.title).toBe('Command Code updated')
    expect(note.bullets).toContain('The raw update receipt remains visible in Settings > About.')
  })

  it('detects update output that is worth presenting on check-only runs', () => {
    expect(hasNoteLikeUpdateDetails('New in v0.34.0\nSomething changed')).toBe(true)
    expect(hasNoteLikeUpdateDetails('✔ Up to date (0.33.2)')).toBe(false)
  })
})

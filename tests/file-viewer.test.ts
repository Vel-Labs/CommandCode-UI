import { describe, expect, it } from 'vitest'
import { fileViewerMode } from '../src/renderer/src/components/FileViewer'

describe('fileViewerMode', () => {
  it('renders html files as source instead of executable preview content', () => {
    expect(fileViewerMode('.html', '/tmp/out/index.html')).toBe('html-source')
    expect(fileViewerMode('.htm', '/tmp/out/index.htm')).toBe('html-source')
  })

  it('keeps markdown and ansi previews explicit', () => {
    expect(fileViewerMode('.md', '/tmp/report.md')).toBe('markdown')
    expect(fileViewerMode('', '/tmp/session.ansi')).toBe('ansi')
  })
})

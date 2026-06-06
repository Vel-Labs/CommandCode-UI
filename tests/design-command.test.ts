import { describe, expect, it } from 'vitest'
import { buildDesignCommandPreview } from '../src/renderer/src/workflows/designCommand'

describe('design command preview', () => {
  it('builds the documented mode-only design command', () => {
    expect(buildDesignCommandPreview({ mode: 'surface' })).toMatchObject({
      command: '/design surface',
      mode: 'surface',
      contextIncludedInCommand: false
    })
  })

  it('adds a quoted target when needed', () => {
    expect(buildDesignCommandPreview({ mode: 'review', target: 'src/My Component.tsx' }).command)
      .toBe('/design review "src/My Component.tsx"')
  })

  it('carries optional visual context without hidden prompt rewriting', () => {
    const preview = buildDesignCommandPreview({
      mode: 'interaction',
      target: 'src/App.tsx',
      context: {
        goal: '  tighten hover states  ',
        selectedElement: '  primary toolbar  ',
        screenshotPath: '  /tmp/screen.png  '
      }
    })

    expect(preview.command).toBe('/design interaction src/App.tsx')
    expect(preview.context).toMatchObject({
      goal: 'tighten hover states',
      selectedElement: 'primary toolbar',
      screenshotPath: '/tmp/screen.png'
    })
    expect(preview.contextIncludedInCommand).toBe(false)
  })
})

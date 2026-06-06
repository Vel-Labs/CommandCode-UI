import { describe, expect, it } from 'vitest'
import { commandPaletteItems } from '../src/renderer/src/commandPalette'
import { commandPaletteDocs } from '../src/renderer/src/commandPalette/docs'
import { searchCommandPalette } from '../src/renderer/src/commandPalette/search'
import { workflowRecipes } from '../src/renderer/src/commandPalette/workflowRecipes'
import { settingsRegistry } from '../src/renderer/src/settings/settingsRegistry'

describe('command palette search', () => {
  it('finds commands by slash command text', () => {
    const results = searchCommandPalette(commandPaletteItems, workflowRecipes, 'configure-models')

    expect(results[0]).toMatchObject({
      kind: 'command',
      item: { id: 'configure-models', command: '/configure-models' }
    })
  })

  it('finds workflow recipes by operational keywords', () => {
    const results = searchCommandPalette(commandPaletteItems, workflowRecipes, 'hook dry run')
      .filter((result) => result.kind === 'recipe')

    expect(results[0]).toMatchObject({
      kind: 'recipe',
      item: { id: 'hook-setup', intent: 'open-settings' }
    })
  })

  it('keeps commands and recipes visible for an empty query', () => {
    const results = searchCommandPalette(commandPaletteItems, workflowRecipes, '', settingsRegistry, ['/tmp/project'], commandPaletteDocs)

    expect(results.some((result) => result.kind === 'command')).toBe(true)
    expect(results.some((result) => result.kind === 'recipe')).toBe(true)
    expect(results.some((result) => result.kind === 'settings')).toBe(false)
    expect(results.some((result) => result.kind === 'project')).toBe(false)
    expect(results.some((result) => result.kind === 'docs')).toBe(false)
  })

  it('finds settings sections through registry metadata', () => {
    const results = searchCommandPalette(commandPaletteItems, workflowRecipes, 'quiet mode', settingsRegistry)

    expect(results[0]).toMatchObject({
      kind: 'settings',
      item: { id: 'notifications' }
    })
  })

  it('finds recent projects by folder name', () => {
    const results = searchCommandPalette(
      commandPaletteItems,
      workflowRecipes,
      'command-code-gui',
      settingsRegistry,
      ['/Users/steven/Workspace/40_Code/projects/command-code-gui'],
      commandPaletteDocs
    )

    expect(results[0]).toMatchObject({
      kind: 'project',
      item: { label: 'command-code-gui' }
    })
  })

  it('finds local docs by workflow topic', () => {
    const results = searchCommandPalette(commandPaletteItems, workflowRecipes, 'pretooluse dry-run', settingsRegistry, [], commandPaletteDocs)
    const docsResult = results.find((result) => result.kind === 'docs')

    expect(docsResult).toMatchObject({
      kind: 'docs',
      item: { id: 'docs-hooks' }
    })
  })
})

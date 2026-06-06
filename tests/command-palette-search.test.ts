import { describe, expect, it } from 'vitest'
import { commandPaletteItems } from '../src/renderer/src/commandPalette'
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
    const results = searchCommandPalette(commandPaletteItems, workflowRecipes, '', settingsRegistry)

    expect(results.some((result) => result.kind === 'command')).toBe(true)
    expect(results.some((result) => result.kind === 'recipe')).toBe(true)
    expect(results.some((result) => result.kind === 'settings')).toBe(false)
  })

  it('finds settings sections through registry metadata', () => {
    const results = searchCommandPalette(commandPaletteItems, workflowRecipes, 'quiet mode', settingsRegistry)

    expect(results[0]).toMatchObject({
      kind: 'settings',
      item: { id: 'notifications' }
    })
  })
})

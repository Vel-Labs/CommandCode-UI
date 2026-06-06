import { describe, expect, it } from 'vitest'
import { workflowRecipes } from '../src/renderer/src/commandPalette/workflowRecipes'

describe('workflow recipes', () => {
  it('routes settings recipes to explicit settings sections', () => {
    const sections = workflowRecipes
      .filter((recipe) => recipe.intent === 'open-settings')
      .map((recipe) => [recipe.id, recipe.settingsSection])

    expect(sections).toEqual([
      ['mcp-setup', 'mcp'],
      ['hook-setup', 'hooks'],
      ['notification-setup', 'notifications'],
      ['agent-creation', 'agents']
    ])
  })

  it('keeps runtime-start recipes preview-only from the recipe row', () => {
    const runtimeRecipes = workflowRecipes.filter((recipe) => recipe.intent === 'start-new-session')

    expect(runtimeRecipes.map((recipe) => recipe.id)).toEqual(['interactive-session', 'headless-run', 'resume-session'])
    expect(runtimeRecipes.every((recipe) => recipe.settingsSection === undefined)).toBe(true)
  })
})

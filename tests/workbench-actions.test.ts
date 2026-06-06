import { describe, expect, it } from 'vitest'
import { gatedWorkbenchActions, workbenchActions, workbenchActionsByCategory } from '../src/renderer/src/workbench/workbenchActions'

describe('workbench action registry', () => {
  it('keeps mutation-capable workbench actions gated', () => {
    const gatedIds = gatedWorkbenchActions().map((action) => action.id)

    expect(gatedIds).toEqual([
      'file-create-rename-delete',
      'ide-open-configure',
      'git-mutations',
      'terminal-tabs-profiles',
      'theme-token-controls',
      'release-fetching'
    ])
  })

  it('keeps the registry preview-only with proof requirements instead of executable commands', () => {
    for (const action of workbenchActions) {
      if (action.status !== 'implemented-read-only') {
        expect(action.gate).toContain('WORKBENCH_POLISH_GATE')
      }
      expect(action.requiredProof.length).toBeGreaterThan(0)
      expect(Object.keys(action)).not.toContain('command')
      expect(Object.keys(action)).not.toContain('onClick')
      expect(Object.keys(action)).not.toContain('transport')
    }
  })

  it('groups every declared category for Settings display', () => {
    const groups = workbenchActionsByCategory()

    expect(Object.keys(groups)).toEqual(['files', 'ide', 'git', 'terminal', 'theme', 'release'])
    expect(groups.files.map((action) => action.id)).toEqual(['file-browse-preview', 'file-create-rename-delete'])
    expect(Object.values(groups).flat()).toHaveLength(workbenchActions.length)
  })
})

import { describe, expect, it } from 'vitest'
import { modelRoutingCommand, modelRoutingTaskPreviews } from '../src/core/modelRouting'

describe('model routing preview contract', () => {
  it('uses the documented configure-models command', () => {
    expect(modelRoutingCommand()).toBe('/configure-models')
  })

  it('previews documented task categories without claiming GUI-owned assignments', () => {
    expect(modelRoutingTaskPreviews()).toEqual([
      {
        id: 'compaction',
        label: 'Compaction',
        command: '/configure-models',
        currentAssignment: 'Command Code-owned',
        applyEffect: 'Opens Command Code helper',
        status: 'preview-only'
      },
      {
        id: 'title-generation',
        label: 'Title generation',
        command: '/configure-models',
        currentAssignment: 'Command Code-owned',
        applyEffect: 'Opens Command Code helper',
        status: 'preview-only'
      },
      {
        id: 'background-work',
        label: 'Background work',
        command: '/configure-models',
        currentAssignment: 'Command Code-owned',
        applyEffect: 'Opens Command Code helper',
        status: 'preview-only'
      }
    ])
  })
})

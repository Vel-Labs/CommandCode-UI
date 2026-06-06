import { describe, expect, it } from 'vitest'
import { buildAgentDraftPreview } from '../src/renderer/src/workflows/agentDraft'

describe('agent draft preview', () => {
  it('builds a project-scoped agent draft without enabling writes', () => {
    const preview = buildAgentDraftPreview({
      templateId: 'reviewer',
      name: 'Review Buddy',
      cwd: '/tmp/project'
    })

    expect(preview).toMatchObject({
      name: 'Review Buddy',
      slug: 'review-buddy',
      scope: 'project',
      destination: '/tmp/project/.commandcode/agents/review-buddy.md',
      canWrite: false
    })
    expect(preview.content).toContain('description:')
    expect(preview.content).toContain('system_prompt:')
  })

  it('falls back to template fields and avoids destination without a selected project', () => {
    const preview = buildAgentDraftPreview({ templateId: 'researcher', name: '   ' })

    expect(preview.name).toBe('Researcher')
    expect(preview.destination).toBeUndefined()
    expect(preview.canWrite).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { commandPaletteItems } from '../src/renderer/src/commandPalette'
import { getCommandExecutionPreview } from '../src/renderer/src/commandPalette/commandPreview'

function item(id: string) {
  const found = commandPaletteItems.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Missing command palette item: ${id}`)
  return found
}

describe('command palette execution preview', () => {
  it('labels slash commands as active-session sends when a session is active', () => {
    const preview = getCommandExecutionPreview(item('design'), { hasActiveSession: true })

    expect(preview.intent).toBe('send-active-session')
    expect(preview.summary).toContain('active Command Code session')
    expect(preview.badges).toContain('active-session')
  })

  it('labels slash commands as composer inserts without an active session', () => {
    const preview = getCommandExecutionPreview(item('agents'), { hasActiveSession: false })

    expect(preview.intent).toBe('insert-composer')
    expect(preview.summary).toContain('composer')
    expect(preview.badges).toContain('composer')
  })

  it('keeps headless commands visibly separate from slash sends', () => {
    const preview = getCommandExecutionPreview(item('headless'), { hasActiveSession: true })

    expect(preview.intent).toBe('headless-run')
    expect(preview.summary).toContain('headless Command Code path')
    expect(preview.badges).toContain('runtime')
  })

  it('marks Command Code-owned model configuration boundaries', () => {
    const preview = getCommandExecutionPreview(item('configure-models'), { hasActiveSession: true })

    expect(preview.intent).toBe('send-active-session')
    expect(preview.badges).toContain('command-code-owned')
  })

  it('marks plan mode without changing command execution', () => {
    const preview = getCommandExecutionPreview(item('plan'), { hasActiveSession: true })

    expect(preview.intent).toBe('send-active-session')
    expect(preview.badges).toContain('plan-mode')
  })
})

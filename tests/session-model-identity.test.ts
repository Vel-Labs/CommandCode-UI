import { describe, expect, it } from 'vitest'
import { resolveSessionModelIdentity, sessionModelLabel } from '../src/renderer/src/services/sessionModelIdentity'

describe('session model identity', () => {
  it('uses the model captured at session start as the display identity', () => {
    expect(resolveSessionModelIdentity({ model: '  deepseek/deepseek-v4-pro  ' })).toEqual({
      label: 'deepseek/deepseek-v4-pro',
      source: 'session-start',
      commandValue: 'deepseek/deepseek-v4-pro'
    })
  })

  it('uses transcript metadata when active session metadata is unavailable', () => {
    expect(resolveSessionModelIdentity({ transcriptModel: 'kimi/k2.6' })).toEqual({
      label: 'kimi/k2.6',
      source: 'transcript-metadata',
      commandValue: 'kimi/k2.6'
    })
  })

  it('does not use the current global model as a missing session fallback', () => {
    const activeSession = { model: 'nemotron-3-ultra' }
    const beforeGlobalChange = sessionModelLabel(activeSession)
    const currentGlobalModel = 'deepseek/deepseek-v4-pro'
    const afterGlobalChange = sessionModelLabel(activeSession)

    expect(currentGlobalModel).not.toBe(beforeGlobalChange)
    expect(afterGlobalChange).toBe(beforeGlobalChange)
  })

  it('keeps old sessions truthful when exact model metadata is unavailable', () => {
    expect(resolveSessionModelIdentity({ model: '   ', transcriptModel: '' })).toEqual({
      label: 'Default at start',
      source: 'default-at-start'
    })
  })
})

import { describe, expect, it } from 'vitest'
import { makeSessionLabelCounter } from '../src/renderer/src/hooks/useSessionActions'

describe('session label counter', () => {
  it('produces independent sequences per instance (no module-level sharing)', () => {
    const a = makeSessionLabelCounter()
    const b = makeSessionLabelCounter()

    expect(a.next()).toBe(1)
    expect(a.next()).toBe(2)
    expect(b.next()).toBe(1)
    expect(b.next()).toBe(2)
    expect(a.next()).toBe(3)
    expect(b.next()).toBe(3)
  })

  it('formats the label exactly as the hook consumes it', () => {
    const counter = makeSessionLabelCounter()
    const next = (resume: boolean) =>
      resume ? `resume ${counter.next()}` : `session ${counter.next()}`

    expect(next(false)).toBe('session 1')
    expect(next(true)).toBe('resume 2')
    expect(next(false)).toBe('session 3')
  })
})

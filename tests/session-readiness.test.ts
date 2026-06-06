import { describe, expect, it } from 'vitest'
import {
  initialSessionReadiness,
  reduceSessionReadiness,
  type SessionReadinessEvent,
  type SessionReadinessState
} from '../src/renderer/src/services/sessionReadiness'

function applyEvents(
  state: SessionReadinessState,
  events: SessionReadinessEvent[]
): ReturnType<typeof reduceSessionReadiness>[] {
  const updates: ReturnType<typeof reduceSessionReadiness>[] = []
  let current = state
  for (const event of events) {
    const update = reduceSessionReadiness(current, event)
    updates.push(update)
    current = update.state
  }
  return updates
}

describe('session readiness', () => {
  it('does not mark attach, replay, or foreground navigation as response ready', () => {
    const updates = applyEvents(initialSessionReadiness('session-1'), [
      { type: 'attach' },
      { type: 'replay-start' },
      { type: 'output', source: 'replay' },
      { type: 'replay-complete' },
      { type: 'foreground' }
    ])

    expect(updates.map((update) => update.notification)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    ])
    expect(updates.at(-1)?.state).toMatchObject({
      status: 'running',
      unread: false,
      responseReady: false,
      inputRequired: false
    })
  })

  it('marks background assistant readiness as unread response-ready state', () => {
    const [background, ready] = applyEvents(initialSessionReadiness('session-1'), [
      { type: 'background' },
      { type: 'assistant-ready' }
    ])

    expect(background?.notification).toBeUndefined()
    expect(ready?.notification).toBe('response-ready')
    expect(ready?.state).toMatchObject({
      status: 'response-ready',
      backgrounded: true,
      unread: true,
      responseReady: true,
      inputRequired: false
    })
  })

  it('keeps foreground assistant readiness non-notifying', () => {
    const update = reduceSessionReadiness(initialSessionReadiness('session-1'), { type: 'assistant-ready' })

    expect(update.notification).toBeUndefined()
    expect(update.state).toMatchObject({
      status: 'response-ready',
      unread: false,
      responseReady: true,
      inputRequired: false
    })
  })

  it('separates input-required notifications from response-ready notifications', () => {
    const [background, waiting] = applyEvents(initialSessionReadiness('session-1'), [
      { type: 'background' },
      { type: 'input-required' }
    ])

    expect(background?.notification).toBeUndefined()
    expect(waiting?.notification).toBe('input-required')
    expect(waiting?.state).toMatchObject({
      status: 'waiting-for-input',
      unread: true,
      responseReady: false,
      inputRequired: true
    })
  })

  it('clears unread readiness flags when the operator submits input', () => {
    const updates = applyEvents(initialSessionReadiness('session-1'), [
      { type: 'background' },
      { type: 'input-required' },
      { type: 'user-submit' }
    ])

    expect(updates.at(-1)?.state).toMatchObject({
      status: 'running',
      unread: false,
      responseReady: false,
      inputRequired: false
    })
  })

  it('treats background live output as unread without a readiness notification', () => {
    const [background, output] = applyEvents(initialSessionReadiness('session-1'), [
      { type: 'background' },
      { type: 'output', source: 'live' }
    ])

    expect(background?.notification).toBeUndefined()
    expect(output?.notification).toBeUndefined()
    expect(output?.state).toMatchObject({
      status: 'running',
      unread: true,
      responseReady: false,
      inputRequired: false
    })
  })

  it('does not notify for replay output in a background session', () => {
    const updates = applyEvents(initialSessionReadiness('session-1'), [
      { type: 'background' },
      { type: 'replay-start' },
      { type: 'output', source: 'replay' }
    ])

    expect(updates.map((update) => update.notification)).toEqual([undefined, undefined, undefined])
    expect(updates.at(-1)?.state).toMatchObject({
      status: 'replaying',
      unread: false,
      responseReady: false,
      inputRequired: false
    })
  })
})

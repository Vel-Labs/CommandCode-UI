import { describe, expect, it } from 'vitest'
import { planReadinessNotification } from '../src/renderer/src/services/readinessNotifications'
import { defaultAudioPrefs, defaultToastPrefs } from '../src/renderer/src/settings/notificationPreferences'

describe('readiness notification planner', () => {
  it('plans response-ready toast with audio disabled by default', () => {
    expect(planReadinessNotification('response-ready', defaultToastPrefs, defaultAudioPrefs)).toEqual({
      category: 'response-ready',
      message: 'Command Code response is ready',
      toast: true,
      audio: false,
      volume: 0
    })
  })

  it('suppresses toast and audio through preferences', () => {
    const plan = planReadinessNotification(
      'input-required',
      {
        ...defaultToastPrefs,
        categories: { ...defaultToastPrefs.categories, 'input-required': false }
      },
      {
        ...defaultAudioPrefs,
        masterVolume: 0,
        categories: { ...defaultAudioPrefs.categories, 'input-required': { enabled: true, volume: 1 } }
      }
    )

    expect(plan).toMatchObject({
      category: 'input-required',
      message: 'Command Code needs input',
      toast: false,
      audio: false,
      volume: 0
    })
  })

  it('plans audio only when category and master volume allow it', () => {
    expect(planReadinessNotification(
      'input-required',
      defaultToastPrefs,
      {
        ...defaultAudioPrefs,
        masterVolume: 0.5,
        categories: { ...defaultAudioPrefs.categories, 'input-required': { enabled: true, volume: 0.4 } }
      }
    )).toMatchObject({
      audio: true,
      volume: 0.2
    })
  })
})

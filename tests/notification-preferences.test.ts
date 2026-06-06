import { describe, expect, it } from 'vitest'
import {
  AUDIO_PREFS_KEY,
  TOAST_PREFS_KEY,
  defaultAudioPrefs,
  defaultToastPrefs,
  loadAudioPrefs,
  loadToastPrefs,
  saveAudioPrefs,
  saveToastPrefs
} from '../src/renderer/src/settings/notificationPreferences'

describe('notification preferences', () => {
  it('loads defaults when preferences are missing or corrupt', () => {
    const storage = memoryStorage({ [TOAST_PREFS_KEY]: '{bad json', [AUDIO_PREFS_KEY]: '' })

    expect(loadToastPrefs(storage)).toEqual(defaultToastPrefs)
    expect(loadAudioPrefs(storage)).toEqual(defaultAudioPrefs)
  })

  it('merges stored toast categories without dropping new defaults', () => {
    const storage = memoryStorage({
      [TOAST_PREFS_KEY]: JSON.stringify({
        durationMs: 6500,
        categories: {
          'session-started': false,
          'custom-category': true
        }
      })
    })

    expect(loadToastPrefs(storage)).toEqual({
      durationMs: 6500,
      categories: {
        ...defaultToastPrefs.categories,
        'session-started': false,
        'custom-category': true
      }
    })
  })

  it('clamps audio volume and preserves known category defaults', () => {
    const storage = memoryStorage({
      [AUDIO_PREFS_KEY]: JSON.stringify({
        masterVolume: 3,
        categories: {
          'headless-error': { enabled: true, volume: -1 },
          'custom-category': { enabled: true, volume: 0.25 }
        }
      })
    })

    expect(loadAudioPrefs(storage).masterVolume).toBe(1)
    expect(loadAudioPrefs(storage).categories['headless-error']).toEqual({ enabled: true, volume: 0 })
    expect(loadAudioPrefs(storage).categories['session-started']).toEqual(defaultAudioPrefs.categories['session-started'])
    expect(loadAudioPrefs(storage).categories['custom-category']).toEqual({ enabled: true, volume: 0.25 })
  })

  it('saves sanitized preference payloads', () => {
    const storage = memoryStorage()

    saveToastPrefs({ durationMs: 999999, categories: { 'session-started': false } }, storage)
    saveAudioPrefs({ masterVolume: Number.NaN, categories: { 'session-started': { enabled: true, volume: 0.6 } } }, storage)

    expect(JSON.parse(storage.getItem(TOAST_PREFS_KEY) || '{}')).toEqual({
      ...defaultToastPrefs,
      categories: { ...defaultToastPrefs.categories, 'session-started': false }
    })
    expect(JSON.parse(storage.getItem(AUDIO_PREFS_KEY) || '{}')).toEqual({
      ...defaultAudioPrefs,
      categories: { ...defaultAudioPrefs.categories, 'session-started': { enabled: true, volume: 0.6 } }
    })
  })
})

function memoryStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> {
  const values = { ...initial }
  return {
    getItem: (key: string) => values[key] ?? null,
    setItem: (key: string, value: string) => {
      values[key] = value
    }
  }
}

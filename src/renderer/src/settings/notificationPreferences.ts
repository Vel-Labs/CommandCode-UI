export const TOAST_PREFS_KEY = 'ccgui.toast-preferences'
export const AUDIO_PREFS_KEY = 'ccgui.audio-preferences'
export const NOTIFICATION_PREFERENCES_CHANGED_EVENT = 'ccgui:notification-preferences-changed'

export type ToastPrefs = {
  durationMs: number
  categories: Record<string, boolean>
}

export type AudioPrefs = {
  masterVolume: number
  categories: Record<string, { enabled: boolean; volume: number }>
}

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>

export const defaultToastPrefs: ToastPrefs = {
  durationMs: 4000,
  categories: {
    'session-started': true,
    'session-exited': true,
    'session-response': true,
    'headless-complete': true,
    'headless-error': true,
    'transcript-saved': true
  }
}

export const defaultAudioPrefs: AudioPrefs = {
  masterVolume: 0.5,
  categories: {
    'session-started': { enabled: false, volume: 1 },
    'session-exited': { enabled: false, volume: 1 },
    'session-response': { enabled: false, volume: 1 },
    'headless-complete': { enabled: false, volume: 1 },
    'headless-error': { enabled: false, volume: 1 }
  }
}

export function loadToastPrefs(storage = browserStorage()): ToastPrefs {
  return mergeToastPrefs(readPreference<Partial<ToastPrefs>>(TOAST_PREFS_KEY, storage))
}

export function loadAudioPrefs(storage = browserStorage()): AudioPrefs {
  return mergeAudioPrefs(readPreference<Partial<AudioPrefs>>(AUDIO_PREFS_KEY, storage))
}

export function saveToastPrefs(preferences: ToastPrefs, storage = browserStorage()): ToastPrefs {
  const next = mergeToastPrefs(preferences)
  storage?.setItem(TOAST_PREFS_KEY, JSON.stringify(next))
  emitNotificationPreferencesChanged()
  return next
}

export function saveAudioPrefs(preferences: AudioPrefs, storage = browserStorage()): AudioPrefs {
  const next = mergeAudioPrefs(preferences)
  storage?.setItem(AUDIO_PREFS_KEY, JSON.stringify(next))
  emitNotificationPreferencesChanged()
  return next
}

export function notificationCategoryLabel(category: string): string {
  return category.replace(/-/g, ' ')
}

function mergeToastPrefs(stored?: Partial<ToastPrefs> | null): ToastPrefs {
  const durationMs = typeof stored?.durationMs === 'number' && stored.durationMs >= 1000 && stored.durationMs <= 30000
    ? stored.durationMs
    : defaultToastPrefs.durationMs
  return {
    durationMs,
    categories: {
      ...defaultToastPrefs.categories,
      ...booleanCategoryOverrides(stored?.categories)
    }
  }
}

function mergeAudioPrefs(stored?: Partial<AudioPrefs> | null): AudioPrefs {
  const masterVolume = clampUnit(stored?.masterVolume, defaultAudioPrefs.masterVolume)
  const categories = { ...defaultAudioPrefs.categories }
  if (stored?.categories && typeof stored.categories === 'object') {
    for (const [key, value] of Object.entries(stored.categories)) {
      if (!value || typeof value !== 'object') continue
      const fallback = categories[key] || { enabled: false, volume: 1 }
      categories[key] = {
        enabled: typeof value.enabled === 'boolean' ? value.enabled : fallback.enabled,
        volume: clampUnit(value.volume, fallback.volume)
      }
    }
  }
  return { masterVolume, categories }
}

function booleanCategoryOverrides(categories?: Record<string, boolean>): Record<string, boolean> {
  if (!categories || typeof categories !== 'object') return {}
  return Object.fromEntries(Object.entries(categories).filter(([, enabled]) => typeof enabled === 'boolean'))
}

function clampUnit(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(0, Math.min(1, value))
}

function readPreference<T>(key: string, storage?: PreferenceStorage): T | null {
  try {
    const raw = storage?.getItem(key)
    return raw ? JSON.parse(raw) as T : null
  } catch {
    return null
  }
}

function browserStorage(): PreferenceStorage | undefined {
  if (typeof localStorage === 'undefined') return undefined
  return localStorage
}

function emitNotificationPreferencesChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(NOTIFICATION_PREFERENCES_CHANGED_EVENT))
}

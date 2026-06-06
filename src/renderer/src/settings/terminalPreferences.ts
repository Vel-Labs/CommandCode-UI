export const TERMINAL_PREFS_KEY = 'ccgui.terminal-preferences'

export type TerminalPrefs = {
  fontSize: number
  lineHeight: number
  scrollback: number
  cursorBlink: boolean
}

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>

export const defaultTerminalPrefs: TerminalPrefs = {
  fontSize: 13,
  lineHeight: 1.25,
  scrollback: 20_000,
  cursorBlink: true
}

export function loadTerminalPrefs(storage = browserStorage()): TerminalPrefs {
  return mergeTerminalPrefs(readPreference<Partial<TerminalPrefs>>(storage))
}

export function saveTerminalPrefs(preferences: TerminalPrefs, storage = browserStorage()): TerminalPrefs {
  const next = mergeTerminalPrefs(preferences)
  storage?.setItem(TERMINAL_PREFS_KEY, JSON.stringify(next))
  return next
}

function mergeTerminalPrefs(stored?: Partial<TerminalPrefs> | null): TerminalPrefs {
  return {
    fontSize: clampNumber(stored?.fontSize, 11, 18, defaultTerminalPrefs.fontSize),
    lineHeight: clampNumber(stored?.lineHeight, 1, 1.6, defaultTerminalPrefs.lineHeight),
    scrollback: clampNumber(stored?.scrollback, 1_000, 100_000, defaultTerminalPrefs.scrollback),
    cursorBlink: typeof stored?.cursorBlink === 'boolean' ? stored.cursorBlink : defaultTerminalPrefs.cursorBlink
  }
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(min, Math.min(max, value))
}

function readPreference<T>(storage?: PreferenceStorage): T | null {
  try {
    const raw = storage?.getItem(TERMINAL_PREFS_KEY)
    return raw ? JSON.parse(raw) as T : null
  } catch {
    return null
  }
}

function browserStorage(): PreferenceStorage | undefined {
  if (typeof localStorage === 'undefined') return undefined
  return localStorage
}

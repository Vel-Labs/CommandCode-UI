import { describe, expect, it } from 'vitest'
import {
  TERMINAL_PREFS_KEY,
  defaultTerminalPrefs,
  loadTerminalPrefs,
  saveTerminalPrefs
} from '../src/renderer/src/settings/terminalPreferences'

describe('terminal preferences', () => {
  it('loads defaults when terminal preferences are missing or corrupt', () => {
    const storage = memoryStorage({ [TERMINAL_PREFS_KEY]: '{bad json' })

    expect(loadTerminalPrefs(storage)).toEqual(defaultTerminalPrefs)
  })

  it('clamps stored terminal presentation values', () => {
    const storage = memoryStorage({
      [TERMINAL_PREFS_KEY]: JSON.stringify({
        fontSize: 99,
        lineHeight: 0.2,
        scrollback: 500_000,
        cursorBlink: false
      })
    })

    expect(loadTerminalPrefs(storage)).toEqual({
      fontSize: 18,
      lineHeight: 1,
      scrollback: 100_000,
      cursorBlink: false
    })
  })

  it('saves sanitized terminal preference payloads', () => {
    const storage = memoryStorage()

    saveTerminalPrefs({ fontSize: 10, lineHeight: 2, scrollback: 200, cursorBlink: false }, storage)

    expect(JSON.parse(storage.getItem(TERMINAL_PREFS_KEY) || '{}')).toEqual({
      fontSize: 11,
      lineHeight: 1.6,
      scrollback: 1_000,
      cursorBlink: false
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

import { describe, expect, it } from 'vitest'
import { appShortcutForKey } from '../src/renderer/src/services/appShortcuts'

describe('appShortcutForKey', () => {
  it('keeps Ctrl/Cmd+T mapped to new session', () => {
    expect(appShortcutForKey({ ctrlKey: true, metaKey: false, key: 't', code: 'KeyT' })).toBe('new-session')
    expect(appShortcutForKey({ ctrlKey: false, metaKey: true, key: 'T', code: 'KeyT' })).toBe('new-session')
  })

  it('maps Ctrl/Cmd+O and Ctrl/Cmd+0 to thinking details', () => {
    expect(appShortcutForKey({ ctrlKey: true, metaKey: false, key: 'o', code: 'KeyO' })).toBe('open-thinking')
    expect(appShortcutForKey({ ctrlKey: false, metaKey: true, key: 'O', code: 'KeyO' })).toBe('open-thinking')
    expect(appShortcutForKey({ ctrlKey: true, metaKey: false, key: '0', code: 'Digit0' })).toBe('open-thinking')
    expect(appShortcutForKey({ ctrlKey: false, metaKey: true, key: '0', code: 'Numpad0' })).toBe('open-thinking')
  })

  it('ignores unmodified keys and unrelated shortcuts', () => {
    expect(appShortcutForKey({ ctrlKey: false, metaKey: false, key: 'o', code: 'KeyO' })).toBeUndefined()
    expect(appShortcutForKey({ ctrlKey: true, metaKey: false, key: 'p', code: 'KeyP' })).toBeUndefined()
  })
})

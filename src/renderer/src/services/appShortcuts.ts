export type AppShortcut = 'new-session' | 'open-thinking'

export function appShortcutForKey(event: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'key' | 'code'>): AppShortcut | undefined {
  if (!(event.metaKey || event.ctrlKey)) return undefined

  const key = event.key.toLowerCase()
  if (key === 't') return 'new-session'
  if (key === 'o' || key === '0' || event.code === 'Digit0' || event.code === 'Numpad0') return 'open-thinking'

  return undefined
}

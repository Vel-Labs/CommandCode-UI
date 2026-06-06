import { describe, expect, it } from 'vitest'
import type { SettingsSection } from '../src/renderer/src/appTypes'
import { isImplementedSettingsSection } from '../src/renderer/src/settings/SettingsRoutes'
import { groupedSettings, settingsItem, settingsRegistry } from '../src/renderer/src/settings/settingsRegistry'

const expectedSections: SettingsSection[] = [
  'profile',
  'general',
  'appearance',
  'runtime',
  'models',
  'notifications',
  'terminal',
  'keyboard',
  'data',
  'usage',
  'integrations',
  'hooks',
  'mcp',
  'agents',
  'skills',
  'design',
  'memory',
  'taste',
  'advanced',
  'about'
]

describe('settings registry', () => {
  it('registers every SettingsSection exactly once', () => {
    const ids = settingsRegistry.map((item) => item.id)

    expect(ids).toEqual(expectedSections)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps every registered section backed by a Settings route', () => {
    for (const item of settingsRegistry) {
      expect(isImplementedSettingsSection(item.id)).toBe(true)
    }
  })

  it('filters groups by label, description, and search text', () => {
    expect(flattenGroupedIds(groupedSettings('quiet'))).toEqual(['notifications'])
    expect(flattenGroupedIds(groupedSettings('settings json'))).toEqual(['hooks'])
    expect(flattenGroupedIds(groupedSettings('configure-models'))).toEqual(['models'])
  })

  it('preserves group order for unfiltered navigation', () => {
    expect(groupedSettings().map((group) => group.label)).toEqual(['Personal', 'Workbench', 'Integrations', 'Diagnostics'])
  })

  it('falls back to profile metadata for unknown sections defensively', () => {
    expect(settingsItem('unknown' as SettingsSection).id).toBe('profile')
  })
})

function flattenGroupedIds(groups: ReturnType<typeof groupedSettings>): SettingsSection[] {
  return groups.flatMap((group) => group.items.map((item) => item.id))
}

import type { CommandPaletteItem } from '../appTypes'
import type { SettingsRegistryItem } from '../settings/settingsRegistry'
import type { WorkflowRecipe } from './workflowRecipes'

export type PaletteSearchResult =
  | { kind: 'command'; item: CommandPaletteItem; score: number }
  | { kind: 'recipe'; item: WorkflowRecipe; score: number }
  | { kind: 'settings'; item: SettingsRegistryItem; score: number }

export function searchCommandPalette(
  commands: CommandPaletteItem[],
  recipes: WorkflowRecipe[],
  query: string,
  settings: SettingsRegistryItem[] = []
): PaletteSearchResult[] {
  const normalizedQuery = normalize(query)
  const results: PaletteSearchResult[] = []

  for (const item of commands) {
    const score = scoreText(normalizedQuery, [item.label, item.command, item.group, item.description, item.id])
    if (score > 0) results.push({ kind: 'command', item, score })
  }

  for (const item of recipes) {
    const score = scoreText(normalizedQuery, [item.title, item.command ?? '', item.description, item.surface, item.intent, item.keywords.join(' ')])
    if (score > 0) results.push({ kind: 'recipe', item, score })
  }

  if (normalizedQuery) {
    for (const item of settings) {
      const score = scoreText(normalizedQuery, [item.label, item.description, item.group, item.searchText, item.id])
      if (score > 0) results.push({ kind: 'settings', item, score })
    }
  }

  return results.sort((a, b) => b.score - a.score || labelFor(a).localeCompare(labelFor(b)))
}

function scoreText(query: string, values: string[]): number {
  if (!query) return 1

  let best = 0
  for (const value of values) {
    const normalized = normalize(value)
    if (!normalized) continue
    if (normalized === query) best = Math.max(best, 100)
    else if (normalized.startsWith(query)) best = Math.max(best, 80)
    else if (normalized.includes(query)) best = Math.max(best, 60)
    else if (query.split(/\s+/).every((part) => normalized.includes(part))) best = Math.max(best, 40)
  }
  return best
}

function labelFor(result: PaletteSearchResult): string {
  if (result.kind === 'command') return result.item.label
  if (result.kind === 'settings') return result.item.label
  return result.item.title
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

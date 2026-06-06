import type { CommandPaletteItem } from '../appTypes'
import type { SettingsRegistryItem } from '../settings/settingsRegistry'
import type { PaletteDocItem } from './docs'
import type { WorkflowRecipe } from './workflowRecipes'

export type PaletteProjectItem = {
  id: string
  path: string
  label: string
}

export type PaletteSearchResult =
  | { kind: 'command'; item: CommandPaletteItem; score: number }
  | { kind: 'recipe'; item: WorkflowRecipe; score: number }
  | { kind: 'settings'; item: SettingsRegistryItem; score: number }
  | { kind: 'project'; item: PaletteProjectItem; score: number }
  | { kind: 'docs'; item: PaletteDocItem; score: number }

export function searchCommandPalette(
  commands: CommandPaletteItem[],
  recipes: WorkflowRecipe[],
  query: string,
  settings: SettingsRegistryItem[] = [],
  projectPaths: string[] = [],
  docs: PaletteDocItem[] = []
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

    for (const path of projectPaths) {
      const item = projectItemForPath(path)
      const score = scoreText(normalizedQuery, [item.label, item.path])
      if (score > 0) results.push({ kind: 'project', item, score })
    }

    for (const item of docs) {
      const score = scoreText(normalizedQuery, [item.title, item.description, item.id, item.keywords.join(' ')])
      if (score > 0) results.push({ kind: 'docs', item, score })
    }
  }

  return results.sort((a, b) => b.score - a.score || labelFor(a).localeCompare(labelFor(b)))
}

export function projectItemForPath(path: string): PaletteProjectItem {
  const label = path.split('/').filter(Boolean).at(-1) || path || 'No project selected'
  return { id: path, path, label }
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
  if (result.kind === 'project') return result.item.label
  if (result.kind === 'docs') return result.item.title
  return result.item.title
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

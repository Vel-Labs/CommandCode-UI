export type ModelEntry = {
  id: string
  shortName: string
  display: string
  provider: string
}

export function parseModelListStdout(stdout: string): ModelEntry[] {
  const lines = stdout.split(/\r?\n/)
  const models: ModelEntry[] = []
  let currentProvider = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('Available') || trimmed.startsWith('Pass the') || trimmed.startsWith('cmd --model') || trimmed.startsWith('Docs:')) continue

    if (['Anthropic', 'OpenAI', 'Google', 'Open Source'].includes(trimmed)) {
      currentProvider = trimmed
      continue
    }

    const parts = trimmed.split(/\s{2,}/)
    const fullId = parts[0] ?? ''
    const description = parts.slice(1).join(' ')
    const shortName = fullId.split('/').pop() ?? fullId

    if (!fullId) continue

    models.push({
      id: fullId,
      shortName,
      display: `${shortName}${description ? ` - ${description.slice(0, 60)}${description.length > 60 ? '...' : ''}` : ''}`,
      provider: currentProvider || 'Other'
    })
  }

  return models
}

export function sortModelsWithFavorites(models: ModelEntry[], favorites: string[]): ModelEntry[] {
  const favoriteSet = new Set(favorites)
  const favs = models.filter((model) => favoriteSet.has(model.id))
  const rest = models.filter((model) => !favoriteSet.has(model.id))
  return [...favs, ...rest]
}

export function filterModelEntries(models: ModelEntry[], query: string): ModelEntry[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return models

  return models.filter((model) => {
    const haystack = [model.id, model.shortName, model.provider, model.display].join(' ').toLowerCase()
    return haystack.includes(normalizedQuery)
  })
}

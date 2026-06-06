import { useState, useEffect, useMemo } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import type { ModelEntry } from '../services/modelCatalog'
import { filterModelEntries, parseModelListStdout, sortModelsWithFavorites } from '../services/modelCatalog'

type ModelDropdownProps = {
  transport: TransportAPI
  model: string
  setModel: (value: string) => void
  commandExecutable?: string
  cwd?: string
  onConfigureModels?: () => Promise<void>
}

export function ModelDropdown({ transport, model, setModel, commandExecutable, cwd, onConfigureModels }: ModelDropdownProps): JSX.Element {
  const [models, setModels] = useState<ModelEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ccgui.favorite-models') || '[]') as string[]
    } catch {
      return []
    }
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    transport.listModels(commandExecutable, cwd).then((result) => {
      if (cancelled) return
      if (result.ok) {
        setModels(parseModelListStdout(result.stdout))
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [transport, commandExecutable, cwd])

  const toggleFavorite = (modelId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
      localStorage.setItem('ccgui.favorite-models', JSON.stringify(next))
      return next
    })
  }

  const sortedModels = useMemo(() => {
    return sortModelsWithFavorites(models, favorites)
  }, [models, favorites])

  const visibleModels = useMemo(() => filterModelEntries(sortedModels, query), [sortedModels, query])
  const selectedModelVisible = !model || visibleModels.some((entry) => entry.id === model)

  // Group by provider
  const grouped = useMemo(() => {
    const map = new Map<string, ModelEntry[]>()
    for (const model of visibleModels) {
      const group = map.get(model.provider) ?? []
      group.push(model)
      map.set(model.provider, group)
    }
    return map
  }, [visibleModels])

  if (loading) {
    return (
      <div className="model-dropdown">
        <label className="field-label">Model</label>
        <div className="field-label muted">Loading models…</div>
      </div>
    )
  }

  return (
    <div className="model-dropdown">
      <label className="field-label" htmlFor="model-select">Model</label>
      {onConfigureModels && (
        <div className="model-routing-card">
          <div>
            <strong>Task model routing</strong>
            <span>Use /configure-models to choose models for compaction, titles, and background work.</span>
          </div>
          <button className="ghost-button native-ghost" onClick={() => void onConfigureModels()}>Configure</button>
        </div>
      )}
      <input
        className="model-search-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search documented model IDs"
        aria-label="Search models"
      />
      <div className="inline-field">
        <select
          id="model-select"
          value={model}
          onChange={(event) => setModel(event.target.value)}
        >
          <option value="">Default (no override)</option>
          {!selectedModelVisible && (
            <option value={model}>Current selection: {model}</option>
          )}
          {[...grouped.entries()].map(([provider, providerModels]) => (
            <optgroup key={provider} label={provider}>
              {providerModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {favorites.includes(m.id) ? '★ ' : ''}{m.shortName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {model && (
          <button className="ghost-button" onClick={() => toggleFavorite(model)}>
            {favorites.includes(model) ? '★' : '☆'}
          </button>
        )}
      </div>
      <div className="model-memory-line">
        {query.trim()
          ? `${visibleModels.length} model${visibleModels.length === 1 ? '' : 's'} match "${query.trim()}".`
          : favorites.length > 0 ? `${favorites.length} favorite model${favorites.length === 1 ? '' : 's'} saved locally.` : 'Favorite a model to pin it above the full list.'}
      </div>
    </div>
  )
}

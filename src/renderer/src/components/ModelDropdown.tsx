import { useState, useEffect, useMemo } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'

type ModelEntry = {
  id: string
  shortName: string
  display: string
  provider: string
}

type ModelDropdownProps = {
  transport: TransportAPI
  model: string
  setModel: (value: string) => void
  commandExecutable?: string
  cwd?: string
}

function parseModels(stdout: string): ModelEntry[] {
  const lines = stdout.split(/\r?\n/)
  const models: ModelEntry[] = []
  let currentProvider = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('Available') || trimmed.startsWith('Pass the') || trimmed.startsWith('cmd --model') || trimmed.startsWith('Docs:')) continue

    // Provider header (no / in name, no description, title case)
    if (/^[A-Z]/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes(' ') && trimmed !== 'Anthropic' && trimmed !== 'OpenAI' && trimmed !== 'Google' && trimmed !== 'Open Source') {
      // skip — handled below
    }

    if (['Anthropic', 'OpenAI', 'Google', 'Open Source'].includes(trimmed)) {
      currentProvider = trimmed
      continue
    }

    // Model line: "claude-sonnet-4-6                  best combo of speed..."
    const parts = trimmed.split(/\s{2,}/)
    const fullId = parts[0] ?? ''
    const description = parts.slice(1).join(' ')
    const shortName = fullId.split('/').pop() ?? fullId

    if (!fullId) continue

    models.push({
      id: fullId,
      shortName,
      display: `${shortName}${description ? ` — ${description.slice(0, 60)}${description.length > 60 ? '…' : ''}` : ''}`,
      provider: currentProvider || 'Other'
    })
  }

  return models
}

export function ModelDropdown({ transport, model, setModel, commandExecutable, cwd }: ModelDropdownProps): JSX.Element {
  const [models, setModels] = useState<ModelEntry[]>([])
  const [loading, setLoading] = useState(false)
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
        setModels(parseModels(result.stdout))
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
    const favs = models.filter((m) => favorites.includes(m.id))
    const rest = models.filter((m) => !favorites.includes(m.id))
    return [...favs, ...rest]
  }, [models, favorites])

  // Group by provider
  const grouped = useMemo(() => {
    const map = new Map<string, ModelEntry[]>()
    for (const model of sortedModels) {
      const group = map.get(model.provider) ?? []
      group.push(model)
      map.set(model.provider, group)
    }
    return map
  }, [sortedModels])

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
      <div className="inline-field">
        <select
          id="model-select"
          value={model}
          onChange={(event) => setModel(event.target.value)}
        >
          <option value="">Default (no override)</option>
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
    </div>
  )
}

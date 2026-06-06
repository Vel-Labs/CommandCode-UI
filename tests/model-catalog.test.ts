import { describe, expect, it } from 'vitest'
import { filterModelEntries, parseModelListStdout, sortModelsWithFavorites } from '../src/renderer/src/services/modelCatalog'

describe('model catalog helpers', () => {
  it('parses provider-scoped model list output without inventing metadata', () => {
    const models = parseModelListStdout([
      'Available models:',
      '',
      'Anthropic',
      'claude-sonnet-4-6        best combo of speed and intelligence',
      'Open Source',
      'deepseek/deepseek-v4-pro  reasoning model',
      'Docs: https://example.invalid'
    ].join('\n'))

    expect(models).toEqual([
      {
        id: 'claude-sonnet-4-6',
        shortName: 'claude-sonnet-4-6',
        display: 'claude-sonnet-4-6 - best combo of speed and intelligence',
        provider: 'Anthropic'
      },
      {
        id: 'deepseek/deepseek-v4-pro',
        shortName: 'deepseek-v4-pro',
        display: 'deepseek-v4-pro - reasoning model',
        provider: 'Open Source'
      }
    ])
  })

  it('pins favorites before the remaining documented list', () => {
    const models = parseModelListStdout([
      'Anthropic',
      'claude-sonnet-4-6',
      'Open Source',
      'kimi/k2.6',
      'nvidia/nemotron-3-ultra'
    ].join('\n'))

    expect(sortModelsWithFavorites(models, ['nvidia/nemotron-3-ultra']).map((model) => model.id)).toEqual([
      'nvidia/nemotron-3-ultra',
      'claude-sonnet-4-6',
      'kimi/k2.6'
    ])
  })

  it('filters large model lists by id, short name, provider, or displayed description', () => {
    const models = Array.from({ length: 200 }, (_, index) => ({
      id: `provider/model-${index}`,
      shortName: `model-${index}`,
      display: `model-${index} - general purpose`,
      provider: index % 2 === 0 ? 'Open Source' : 'Anthropic'
    }))
    models.push({
      id: 'nvidia/nemotron-3-ultra',
      shortName: 'nemotron-3-ultra',
      display: 'nemotron-3-ultra - coding specialist',
      provider: 'Open Source'
    })

    expect(filterModelEntries(models, 'nemotron')).toHaveLength(1)
    expect(filterModelEntries(models, 'anthropic')).toHaveLength(100)
    expect(filterModelEntries(models, 'coding specialist').map((model) => model.id)).toEqual(['nvidia/nemotron-3-ultra'])
  })
})

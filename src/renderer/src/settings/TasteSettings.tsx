import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import { SettingsReadOnlyCard } from './SettingsReadOnlyCard'

type TastePackageRow = {
  path: string
  name: string
  categories: Array<{ name: string; confidence: number; learnings: string[] }>
}

export function TasteSettingsReadOnly({ transport }: { transport: TransportAPI }): JSX.Element {
  const [packages, setPackages] = useState<TastePackageRow[]>([])
  const [expanded, setExpanded] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setPackages((await transport.listTaste()).packages)
    } catch {
      setPackages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <SettingsReadOnlyCard title={`Taste packages (${packages.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Read-only taste profile discovery. Taste learning internals remain Command Code-owned.</p>
      {packages.map((pkg) => (
        <div key={pkg.path} className="settings-readonly-row">
          <button
            className="settings-readonly-toggle"
            onClick={() => setExpanded(expanded === pkg.path ? undefined : pkg.path)}
          >
            <strong>{pkg.name}</strong>
            <span>{pkg.categories.length} categories - Command Code-owned</span>
          </button>
          <code className="settings-readonly-path">{pkg.path}</code>
          {expanded === pkg.path && (
            <div className="taste-package">
              {pkg.categories.length === 0 && <p className="settings-muted">No taste categories discovered in this package.</p>}
              {pkg.categories.map((category) => (
                <div key={category.name} className="taste-category">
                  <div className="taste-cat-header">
                    <span className="taste-cat-name">{category.name}</span>
                    <span className="taste-cat-conf">{formatConfidence(category.confidence)}</span>
                  </div>
                  {category.learnings.slice(0, 4).map((learning) => (
                    <div key={learning} className="taste-learning">{learning}</div>
                  ))}
                  {category.learnings.length > 4 && (
                    <div className="taste-more">+{category.learnings.length - 4} more learnings</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

function formatConfidence(value: number): string {
  const normalized = value <= 1 ? value * 100 : value
  return `${Math.round(normalized)}%`
}

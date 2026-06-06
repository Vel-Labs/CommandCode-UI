import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import { SettingsReadOnlyCard } from './SettingsReadOnlyCard'

export function TasteSettingsReadOnly({ transport }: { transport: TransportAPI }): JSX.Element {
  const [packages, setPackages] = useState<Array<{ path: string; name: string; categories: Array<{ name: string; confidence: number; learnings: string[] }> }>>([])
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
          <strong>{pkg.name}</strong>
          <span>{pkg.categories.length} categories</span>
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

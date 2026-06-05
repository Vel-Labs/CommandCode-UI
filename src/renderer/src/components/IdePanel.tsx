import { useState } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'

type IdePanelProps = {
  transport: TransportAPI
  commandExecutable: string
  cwd: string
}

type StatusLine = { text: string; highlight?: boolean }

export function IdePanel({ transport, commandExecutable, cwd }: IdePanelProps): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [lines, setLines] = useState<StatusLine[]>([])
  const [error, setError] = useState('')

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await transport.ideStatus(commandExecutable || undefined, cwd || undefined)
      if (result.error) {
        setError(result.error)
        setLines([])
      } else {
        setLines(result.lines.map((l) => ({
          text: l,
          highlight: l.includes('✓') || l.includes('OK') || l.includes('running')
        })))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get IDE status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel-section">
      <div className="section-heading">
        IDE Status
        <button className="ghost-button" onClick={refresh} disabled={loading} style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      {lines.length > 0 && (
        <div className="ide-lines">
          {lines.map((l, i) => (
            <div key={i} className={`ide-line ${l.highlight ? 'ide-line--ok' : ''}`}>
              {l.text}
            </div>
          ))}
        </div>
      )}

      {lines.length === 0 && !error && !loading && (
        <div className="muted">Click Refresh to check IDE integration status.</div>
      )}
    </div>
  )
}

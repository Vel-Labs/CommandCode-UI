import { useState, useEffect } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'

type AuthStatus = {
  authenticated: boolean
  version: string
  user: string
  provider: string
  model: string
  contextWindow: number
}

type AuthCardProps = {
  transport: TransportAPI
  commandExecutable?: string
  cwd?: string
}

function parseStatus(stdout: string): AuthStatus | null {
  try {
    const parsed = JSON.parse(stdout)
    return {
      authenticated: Boolean(parsed.authenticated),
      version: String(parsed.version ?? ''),
      user: String(parsed.user ?? ''),
      provider: String(parsed.provider ?? ''),
      model: String(parsed.model ?? ''),
      contextWindow: Number(parsed.context_window ?? 0)
    }
  } catch {
    return null
  }
}

function formatContextWindow(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function AuthCard({ transport, commandExecutable, cwd }: AuthCardProps): JSX.Element {
  const [status, setStatus] = useState<AuthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = () => {
    setLoading(true)
    setError('')
    transport.status(commandExecutable, cwd)
      .then((result) => {
        if (result.ok && result.stdout) {
          const parsed = parseStatus(result.stdout)
          if (parsed) {
            setStatus(parsed)
          } else {
            setError('Could not parse status output')
          }
        } else {
          setError(result.stderr || result.error || 'Status check failed')
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [commandExecutable, cwd])

  return (
    <div className="auth-card panel-section">
      <div className="section-heading">
        Account
        <button className="ghost-button" onClick={refresh} disabled={loading} style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
          {loading ? '…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="field-label error-text">{error}</div>}

      {status && (
        <div className="auth-fields">
          <div className="auth-row">
            <span className="auth-label">Status</span>
            <span className={`auth-value ${status.authenticated ? 'text-green' : 'text-red'}`}>
              {status.authenticated ? 'Authenticated' : 'Not authenticated'}
            </span>
          </div>
          {status.user && (
            <div className="auth-row">
              <span className="auth-label">User</span>
              <span className="auth-value">{status.user}</span>
            </div>
          )}
          <div className="auth-row">
            <span className="auth-label">Version</span>
            <span className="auth-value">v{status.version}</span>
          </div>
          <div className="auth-row">
            <span className="auth-label">Provider</span>
            <span className="auth-value">{status.provider}</span>
          </div>
          <div className="auth-row">
            <span className="auth-label">Default model</span>
            <span className="auth-value">{status.model}</span>
          </div>
          {status.contextWindow > 0 && (
            <div className="auth-row">
              <span className="auth-label">Context window</span>
              <span className="auth-value">{formatContextWindow(status.contextWindow)} tokens</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

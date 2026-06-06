import { useEffect, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { buildMcpActionPreview, buildMcpGatedCommandPreview } from '../../../core/mcpCommands'
import { mcpPolicyReferences, mcpScopeReferences } from '../../../core/mcpReference'
import type { TransportAPI } from '../../../core/transport'
import type { McpServer } from '../../../core/types'

export function McpSettings({ transport, commandExecutable }: { transport: TransportAPI; commandExecutable: string }): JSX.Element {
  const [servers, setServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(false)
  const [actionResult, setActionResult] = useState('')
  const [listDiagnostics, setListDiagnostics] = useState('')

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await transport.listMcp(commandExecutable || undefined)
      setServers(result.servers)
      setListDiagnostics(result.ok ? '' : (result.error || result.stderr || 'MCP list failed'))
    } catch (error) {
      setServers([])
      setListDiagnostics(error instanceof Error ? error.message : 'MCP list failed')
    } finally {
      setLoading(false)
    }
  }

  const runMcpAction = async (action: 'connect' | 'disconnect', serverName: string): Promise<void> => {
    setActionResult(`${action === 'connect' ? 'Connecting' : 'Disconnecting'} ${serverName}...`)
    try {
      const result = await transport.mcpAction(commandExecutable || undefined, action, serverName)
      const output = (result.stdout || result.stderr || result.error || '').trim()
      setActionResult(`${serverName}: ${result.ok ? 'ok' : 'failed'}${output ? ` - ${output}` : ''}`)
      await load()
    } catch (error) {
      setActionResult(`${serverName}: ${error instanceof Error ? error.message : 'MCP action failed'}`)
    }
  }

  useEffect(() => { void load() }, [commandExecutable])

  return (
    <SettingsReadOnlyCard title={`MCP servers (${servers.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">MCP remains Command Code-owned. Connect and disconnect run the previewed `cmd mcp ...` command; add, remove, and auth actions remain gated.</p>
      <div className="settings-reference-grid settings-reference-grid--compact">
        {mcpScopeReferences.map((scope) => (
          <div key={scope.id} className="settings-reference-tile">
            <strong>{scope.label}</strong>
            <code>{scope.configPath}</code>
            <span>{scope.description}</span>
          </div>
        ))}
      </div>
      <div className="settings-reference-grid settings-reference-grid--compact">
        {mcpPolicyReferences.map((policy) => (
          <div key={policy.id} className="settings-reference-tile">
            <strong>{policy.label}</strong>
            <span>{policy.description}</span>
          </div>
        ))}
      </div>
      {actionResult && <p className="settings-muted">{actionResult}</p>}
      {listDiagnostics && <p className="settings-muted settings-muted--warn">{listDiagnostics}</p>}
      {servers.map((server) => (
        <div key={server.name} className="settings-readonly-row">
          <strong>{server.name}</strong>
          <span>{server.status}{server.toolCount != null ? ` · ${server.toolCount} tools` : ''}</span>
          {server.tools && server.tools.length > 0 && (
            <div className="mcp-tool-list" aria-label={`${server.name} MCP tools`}>
              {server.tools.map((tool) => <code key={tool}>{tool}</code>)}
            </div>
          )}
          <div className="settings-command-preview">
            <span>Connect preview</span>
            <code>{buildMcpActionPreview(commandExecutable, 'connect', server.name)}</code>
          </div>
          <div className="settings-command-preview">
            <span>Disconnect preview</span>
            <code>{buildMcpActionPreview(commandExecutable, 'disconnect', server.name)}</code>
          </div>
          <div className="settings-command-preview">
            <span>Details preview</span>
            <code>{buildMcpGatedCommandPreview(commandExecutable, { kind: 'get', serverName: server.name })}</code>
          </div>
          <div className="settings-command-preview">
            <span>Remove preview</span>
            <code>{buildMcpGatedCommandPreview(commandExecutable, { kind: 'remove', serverName: server.name })}</code>
          </div>
          <div className="settings-command-preview">
            <span>Auth status</span>
            <code>{buildMcpGatedCommandPreview(commandExecutable, { kind: 'auth-status', serverName: server.name })}</code>
          </div>
          <div className="settings-command-preview">
            <span>Auth clear</span>
            <code>{buildMcpGatedCommandPreview(commandExecutable, { kind: 'auth-clear', serverName: server.name })}</code>
          </div>
          <div className="settings-inline-actions">
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => void runMcpAction('connect', server.name)} disabled={server.status === 'connected'}>Connect</button>
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => void runMcpAction('disconnect', server.name)} disabled={server.status !== 'connected'}>Disconnect</button>
          </div>
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

function SettingsReadOnlyCard({
  title,
  loading,
  onRefresh,
  children
}: {
  title: string
  loading: boolean
  onRefresh: () => Promise<void>
  children: ReactNode
}): JSX.Element {
  return (
    <div className="settings-card settings-card--wide">
      <div className="settings-readonly-header">
        <strong>{title}</strong>
        <button className="ghost-button native-ghost" onClick={() => void onRefresh()} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>
      {children}
    </div>
  )
}

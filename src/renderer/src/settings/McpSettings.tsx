import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import { buildMcpActionPreview, buildMcpAddCommandPreview, buildMcpGatedCommandPreview } from '../../../core/mcpCommands'
import type { McpScope, McpTransport } from '../../../core/mcpCommands'
import { mcpPolicyReferences, mcpScopeReferences } from '../../../core/mcpReference'
import type { TransportAPI } from '../../../core/transport'
import type { McpServer } from '../../../core/types'
import { SettingsReadOnlyCard } from './SettingsReadOnlyCard'

type McpAddPreviewMode = 'http' | 'stdio' | 'json'

export function McpSettings({ transport, commandExecutable }: { transport: TransportAPI; commandExecutable: string }): JSX.Element {
  const [servers, setServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(false)
  const [actionResult, setActionResult] = useState('')
  const [listDiagnostics, setListDiagnostics] = useState('')
  const [addMode, setAddMode] = useState<McpAddPreviewMode>('http')
  const [addScope, setAddScope] = useState<McpScope>('local')
  const [addServerName, setAddServerName] = useState('')
  const [addUrl, setAddUrl] = useState('')
  const [addEnvKey, setAddEnvKey] = useState('')
  const [addEnvValue, setAddEnvValue] = useState('')
  const [addEnvSecret, setAddEnvSecret] = useState(true)
  const [addHeaderKey, setAddHeaderKey] = useState('')
  const [addHeaderValue, setAddHeaderValue] = useState('')
  const [addHeaderSecret, setAddHeaderSecret] = useState(true)
  const [addJson, setAddJson] = useState('{"type":"http","url":"https://example.test/mcp"}')
  const [addClientSecret, setAddClientSecret] = useState('')

  const addPreview = useMemo(() => {
    const serverName = addServerName.trim()
    if (!serverName) return 'Enter a server name to preview the Command Code MCP command.'

    if (addMode === 'json') {
      return buildMcpAddCommandPreview(commandExecutable, {
        kind: 'add-json',
        serverName,
        scope: addScope,
        json: addJson.trim() || '{}',
        clientSecret: addClientSecret
      })
    }

    const transportKind: McpTransport = addMode
    return buildMcpAddCommandPreview(commandExecutable, {
      kind: 'add',
      serverName,
      transport: transportKind,
      scope: addScope,
      url: addMode === 'http' ? addUrl.trim() : undefined,
      env: addEnvKey.trim() ? [{ key: addEnvKey.trim(), value: addEnvValue, secret: addEnvSecret }] : undefined,
      headers: addMode === 'http' && addHeaderKey.trim()
        ? [{ key: addHeaderKey.trim(), value: addHeaderValue, secret: addHeaderSecret }]
        : undefined
    })
  }, [
    addClientSecret,
    addEnvKey,
    addEnvSecret,
    addEnvValue,
    addHeaderKey,
    addHeaderSecret,
    addHeaderValue,
    addJson,
    addMode,
    addScope,
    addServerName,
    addUrl,
    commandExecutable
  ])

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
      <div className="settings-readonly-row">
        <strong>Add server preview</strong>
        <span>Preview-only. No MCP config is read or written, and secrets are redacted from the displayed command.</span>
        <label className="settings-control-row">
          <span>Flow</span>
          <select value={addMode} onChange={(event) => setAddMode(event.target.value as McpAddPreviewMode)}>
            <option value="http">HTTP add</option>
            <option value="stdio">stdio add</option>
            <option value="json">JSON config add</option>
          </select>
        </label>
        <label className="settings-control-row">
          <span>Scope</span>
          <select value={addScope} onChange={(event) => setAddScope(event.target.value as McpScope)}>
            <option value="local">local</option>
            <option value="project">project</option>
            <option value="user">user</option>
          </select>
        </label>
        <label className="settings-control-row">
          <span>Server name</span>
          <input
            className="native-input"
            value={addServerName}
            onChange={(event) => setAddServerName(event.target.value)}
            placeholder="github"
          />
        </label>
        {addMode === 'http' && (
          <>
            <label className="settings-control-row">
              <span>URL</span>
              <input
                className="native-input"
                value={addUrl}
                onChange={(event) => setAddUrl(event.target.value)}
                placeholder="https://example.test/mcp"
              />
            </label>
            <div className="settings-control-row">
              <span>Header</span>
              <input
                className="native-input"
                value={addHeaderKey}
                onChange={(event) => setAddHeaderKey(event.target.value)}
                placeholder="Authorization"
              />
              <label className="checkbox-row"><input type="checkbox" checked={addHeaderSecret} onChange={(event) => setAddHeaderSecret(event.target.checked)} /> Secret</label>
            </div>
            <label className="settings-control-row">
              <span>Header value</span>
              <input
                className="native-input"
                type={addHeaderSecret ? 'password' : 'text'}
                value={addHeaderValue}
                onChange={(event) => setAddHeaderValue(event.target.value)}
                placeholder="Bearer token"
              />
            </label>
          </>
        )}
        {addMode === 'stdio' && (
          <>
            <div className="settings-control-row">
              <span>Env key</span>
              <input
                className="native-input"
                value={addEnvKey}
                onChange={(event) => setAddEnvKey(event.target.value)}
                placeholder="GITHUB_TOKEN"
              />
              <label className="checkbox-row"><input type="checkbox" checked={addEnvSecret} onChange={(event) => setAddEnvSecret(event.target.checked)} /> Secret</label>
            </div>
            <label className="settings-control-row">
              <span>Env value</span>
              <input
                className="native-input"
                type={addEnvSecret ? 'password' : 'text'}
                value={addEnvValue}
                onChange={(event) => setAddEnvValue(event.target.value)}
                placeholder="token"
              />
            </label>
          </>
        )}
        {addMode === 'json' && (
          <>
            <label className="settings-control-row settings-control-row--stacked">
              <span>JSON</span>
              <textarea
                className="native-input"
                value={addJson}
                onChange={(event) => setAddJson(event.target.value)}
              />
            </label>
            <label className="settings-control-row">
              <span>Client secret</span>
              <input
                className="native-input"
                type="password"
                value={addClientSecret}
                onChange={(event) => setAddClientSecret(event.target.value)}
                placeholder="Optional OAuth client secret"
              />
            </label>
          </>
        )}
        <div className="settings-command-preview">
          <span>Add preview</span>
          <code>{addPreview}</code>
        </div>
        <div className="settings-command-preview">
          <span>Execution</span>
          <code>Not available in this package</code>
        </div>
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

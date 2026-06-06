import { describe, expect, it } from 'vitest'
import {
  buildMcpActionArgs,
  buildMcpActionPreview,
  buildMcpAddCommandArgs,
  buildMcpAddCommandPreview,
  buildMcpGatedCommandArgs,
  buildMcpGatedCommandPreview
} from '../src/core/mcpCommands'

describe('MCP command builders', () => {
  it('builds explicit connect and disconnect args', () => {
    expect(buildMcpActionArgs('connect', 'github')).toEqual(['mcp', 'connect', 'github'])
    expect(buildMcpActionArgs('disconnect', 'github')).toEqual(['mcp', 'disconnect', 'github'])
  })

  it('previews the default Command Code binary without storing secrets', () => {
    expect(buildMcpActionPreview(undefined, 'connect', 'github')).toBe('cmd mcp connect github')
  })

  it('shell-quotes custom binaries and server names for display only', () => {
    expect(buildMcpActionPreview('/opt/Command Code/cmd', 'disconnect', "team's server")).toBe(
      "'/opt/Command Code/cmd' mcp disconnect 'team'\\''s server'"
    )
  })

  it('builds exact gated mutation previews without executing them', () => {
    expect(buildMcpGatedCommandArgs({ kind: 'remove', serverName: 'github', scope: 'project' })).toEqual([
      'mcp',
      'remove',
      '--scope',
      'project',
      'github'
    ])
    expect(buildMcpGatedCommandPreview(undefined, { kind: 'auth-clear', serverName: 'github' })).toBe('cmd mcp auth --clear github')
  })

  it('builds read-only MCP diagnostics previews', () => {
    expect(buildMcpGatedCommandPreview(undefined, { kind: 'get', serverName: 'github' })).toBe('cmd mcp get github')
    expect(buildMcpGatedCommandPreview(undefined, { kind: 'auth-status', serverName: 'github' })).toBe('cmd mcp auth --status github')
    expect(buildMcpGatedCommandPreview(undefined, { kind: 'auth-list' })).toBe('cmd mcp auth --list')
  })

  it('builds HTTP add command previews with redacted headers', () => {
    expect(buildMcpAddCommandArgs({
      kind: 'add',
      serverName: 'linear',
      transport: 'http',
      scope: 'project',
      url: 'https://mcp.linear.app',
      headers: [{ key: 'Authorization', value: 'Bearer secret-token', secret: true }]
    }, { redactSecrets: true })).toEqual([
      'mcp',
      'add',
      '--transport',
      'http',
      '--scope',
      'project',
      '--header',
      'Authorization=<redacted>',
      'linear',
      'https://mcp.linear.app'
    ])
  })

  it('builds stdio add previews with redacted env values', () => {
    expect(buildMcpAddCommandPreview(undefined, {
      kind: 'add',
      serverName: 'repo',
      transport: 'stdio',
      env: [{ key: 'GITHUB_TOKEN', value: 'ghp_secret', secret: true }]
    })).toBe("cmd mcp add --transport stdio --env 'GITHUB_TOKEN=<redacted>' repo")
  })

  it('builds add-json previews without exposing client secrets', () => {
    expect(buildMcpAddCommandPreview(undefined, {
      kind: 'add-json',
      serverName: 'oauth-server',
      scope: 'user',
      json: '{"type":"http","url":"https://example.test/mcp"}',
      clientSecret: 'super-secret'
    })).toBe("cmd mcp add-json --scope user --client-secret '<redacted>' oauth-server '{\"type\":\"http\",\"url\":\"https://example.test/mcp\"}'")
  })
})

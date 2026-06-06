import { describe, expect, it } from 'vitest'
import {
  buildMcpActionArgs,
  buildMcpActionPreview,
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
})

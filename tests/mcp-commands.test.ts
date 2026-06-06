import { describe, expect, it } from 'vitest'
import { buildMcpActionArgs, buildMcpActionPreview } from '../src/core/mcpCommands'

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
})

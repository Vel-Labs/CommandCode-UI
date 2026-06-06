import { describe, expect, it } from 'vitest'
import { parseMcpListLine, parseMcpListOutput } from '../src/core/mcpList'

describe('MCP list parser', () => {
  it('skips empty and no-server output', () => {
    expect(parseMcpListOutput('\nNo MCP servers configured\n')).toEqual([])
  })

  it('preserves disconnected status before connected substring matching', () => {
    expect(parseMcpListLine('fixture  disconnected  1 tool')).toEqual({
      name: 'fixture',
      status: 'disconnected',
      toolCount: 1,
      raw: 'fixture  disconnected  1 tool'
    })
  })

  it('extracts connected tool names from list output without extra CLI calls', () => {
    expect(parseMcpListLine('github  connected  2 tools  mcp__github__search mcp__github__create_issue')).toEqual({
      name: 'github',
      status: 'connected',
      toolCount: 2,
      tools: ['mcp__github__search', 'mcp__github__create_issue'],
      raw: 'github  connected  2 tools  mcp__github__search mcp__github__create_issue'
    })
  })

  it('deduplicates tool names while preserving first-seen order', () => {
    expect(parseMcpListLine('repo: connected 2 tools mcp__repo__read mcp__repo__read')?.tools).toEqual(['mcp__repo__read'])
  })
})

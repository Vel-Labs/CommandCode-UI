import type { McpServer } from './types'

export function parseMcpListOutput(stdout: string): McpServer[] {
  const servers: McpServer[] = []

  for (const line of stdout.split('\n')) {
    const parsed = parseMcpListLine(line)
    if (parsed) servers.push(parsed)
  }

  return servers
}

export function parseMcpListLine(line: string): McpServer | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('No MCP')) return null

  const status = trimmed.includes('disconnected') ? 'disconnected'
    : trimmed.includes('connected') ? 'connected'
    : trimmed.includes('error') ? 'error'
    : 'unknown'
  const toolMatch = trimmed.match(/(\d+)\s+tools?/i)
  const tools = Array.from(new Set(trimmed.match(/\bmcp__[A-Za-z0-9_-]+__[A-Za-z0-9_-]+\b/g) ?? []))

  return {
    name: trimmed.split(/\s{2,}|\t|:/)[0] ?? trimmed,
    status,
    toolCount: toolMatch ? parseInt(toolMatch[1]!, 10) : undefined,
    tools: tools.length ? tools : undefined,
    raw: trimmed
  }
}

export type McpAction = 'connect' | 'disconnect'

export function buildMcpActionArgs(action: McpAction, serverName: string): string[] {
  return ['mcp', action, serverName]
}

export function buildMcpActionPreview(commandExecutable: string | undefined, action: McpAction, serverName: string): string {
  return [commandExecutable || 'cmd', ...buildMcpActionArgs(action, serverName)].map(shellWord).join(' ')
}

function shellWord(value: string): string {
  if (/^[A-Za-z0-9_./:@-]+$/.test(value)) return value
  return `'${value.replace(/'/g, "'\\''")}'`
}

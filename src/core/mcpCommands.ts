export type McpAction = 'connect' | 'disconnect'
export type McpScope = 'local' | 'project' | 'user'
export type McpGatedCommand =
  | { kind: 'remove'; serverName: string; scope?: McpScope }
  | { kind: 'auth-status'; serverName?: string }
  | { kind: 'auth-clear'; serverName?: string }
  | { kind: 'auth-list' }
  | { kind: 'get'; serverName: string }

export function buildMcpActionArgs(action: McpAction, serverName: string): string[] {
  return ['mcp', action, serverName]
}

export function buildMcpActionPreview(commandExecutable: string | undefined, action: McpAction, serverName: string): string {
  return [commandExecutable || 'cmd', ...buildMcpActionArgs(action, serverName)].map(shellWord).join(' ')
}

export function buildMcpGatedCommandArgs(command: McpGatedCommand): string[] {
  switch (command.kind) {
    case 'remove':
      return command.scope ? ['mcp', 'remove', '--scope', command.scope, command.serverName] : ['mcp', 'remove', command.serverName]
    case 'auth-status':
      return command.serverName ? ['mcp', 'auth', '--status', command.serverName] : ['mcp', 'auth', '--status']
    case 'auth-clear':
      return command.serverName ? ['mcp', 'auth', '--clear', command.serverName] : ['mcp', 'auth', '--clear']
    case 'auth-list':
      return ['mcp', 'auth', '--list']
    case 'get':
      return ['mcp', 'get', command.serverName]
  }
}

export function buildMcpGatedCommandPreview(commandExecutable: string | undefined, command: McpGatedCommand): string {
  return [commandExecutable || 'cmd', ...buildMcpGatedCommandArgs(command)].map(shellWord).join(' ')
}

function shellWord(value: string): string {
  if (/^[A-Za-z0-9_./:@-]+$/.test(value)) return value
  return `'${value.replace(/'/g, "'\\''")}'`
}

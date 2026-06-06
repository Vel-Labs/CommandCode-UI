export type McpAction = 'connect' | 'disconnect'
export type McpScope = 'local' | 'project' | 'user'
export type McpTransport = 'stdio' | 'http'
export type McpKeyValue = { key: string; value: string; secret?: boolean }
export type McpAddCommand =
  | {
      kind: 'add'
      serverName: string
      transport?: McpTransport
      scope?: McpScope
      url?: string
      env?: McpKeyValue[]
      headers?: McpKeyValue[]
    }
  | {
      kind: 'add-json'
      serverName: string
      scope?: McpScope
      json: string
      clientSecret?: string
    }
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

export function buildMcpAddCommandArgs(command: McpAddCommand, options: { redactSecrets?: boolean } = {}): string[] {
  if (command.kind === 'add-json') {
    const args = ['mcp', 'add-json']
    if (command.scope) args.push('--scope', command.scope)
    if (command.clientSecret) args.push('--client-secret', options.redactSecrets ? '<redacted>' : command.clientSecret)
    args.push(command.serverName, command.json)
    return args
  }

  const args = ['mcp', 'add']
  if (command.transport) args.push('--transport', command.transport)
  if (command.scope) args.push('--scope', command.scope)
  for (const entry of command.env ?? []) {
    args.push('--env', `${entry.key}=${options.redactSecrets || entry.secret ? '<redacted>' : entry.value}`)
  }
  for (const entry of command.headers ?? []) {
    args.push('--header', `${entry.key}=${options.redactSecrets || entry.secret ? '<redacted>' : entry.value}`)
  }
  args.push(command.serverName)
  if (command.url) args.push(command.url)
  return args
}

export function buildMcpAddCommandPreview(commandExecutable: string | undefined, command: McpAddCommand): string {
  return [commandExecutable || 'cmd', ...buildMcpAddCommandArgs(command, { redactSecrets: true })].map(shellWord).join(' ')
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

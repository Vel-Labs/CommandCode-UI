export type McpScopeReference = {
  id: 'local' | 'project' | 'user'
  label: string
  configPath: string
  description: string
}

export type McpPolicyReference = {
  id: 'permissions' | 'plan-mode' | 'secrets'
  label: string
  description: string
}

export const mcpScopeReferences: McpScopeReference[] = [
  {
    id: 'local',
    label: 'Local project',
    configPath: '~/.commandcode/projects/<project-slug>/mcp.json',
    description: 'Highest-precedence per-project runtime scope owned by Command Code.'
  },
  {
    id: 'project',
    label: 'Shared project',
    configPath: '<project>/.mcp.json',
    description: 'Project file that may be committed when the operator chooses to share MCP config.'
  },
  {
    id: 'user',
    label: 'User',
    configPath: '~/.commandcode/mcp.json',
    description: 'User-level MCP config outside the selected project.'
  }
]

export const mcpPolicyReferences: McpPolicyReference[] = [
  {
    id: 'permissions',
    label: 'Permission prompts',
    description: 'MCP tools appear beside built-in tools and remain subject to Command Code permission prompts.'
  },
  {
    id: 'plan-mode',
    label: 'Plan mode',
    description: 'MCP tools are disabled while Command Code is in plan mode.'
  },
  {
    id: 'secrets',
    label: 'Secrets',
    description: 'Auth tokens and secret values must stay user-owned and must not be stored in GUI preferences.'
  }
]

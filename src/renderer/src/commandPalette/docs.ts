export type PaletteDocItem = {
  id: string
  title: string
  description: string
  keywords: string[]
}

export const commandPaletteDocs: PaletteDocItem[] = [
  {
    id: 'docs-index',
    title: 'Command Code docs',
    description: 'Open the Command Code docs inspector.',
    keywords: ['docs', 'reference', 'cli', 'command code']
  },
  {
    id: 'docs-hooks',
    title: 'Hooks reference',
    description: 'Review hook configuration, events, examples, and GUI boundaries.',
    keywords: ['hooks', 'settings json', 'pretooluse', 'posttooluse', 'stop', 'dry-run']
  },
  {
    id: 'docs-models',
    title: 'Models reference',
    description: 'Review model selection, model listing, and task routing boundaries.',
    keywords: ['models', 'model', 'configure-models', 'list-models', 'routing']
  },
  {
    id: 'docs-mcp',
    title: 'MCP reference',
    description: 'Review MCP scopes, auth state, config paths, and command previews.',
    keywords: ['mcp', 'server', 'auth', 'tools', 'scope']
  },
  {
    id: 'docs-design',
    title: 'Design reference',
    description: 'Review documented /design modes and GUI helper implications.',
    keywords: ['design', 'surface', 'review', 'checkup', 'tokenize']
  },
  {
    id: 'docs-tools',
    title: 'Tools reference',
    description: 'Review tool permission, plan mode, MCP, shell, write, and edit boundaries.',
    keywords: ['tools', 'permissions', 'plan mode', 'shell', 'write', 'edit']
  }
]

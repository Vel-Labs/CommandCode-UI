import type { CommandPaletteItem, ReleaseNote } from './appTypes'

export const commandPaletteItems: CommandPaletteItem[] = [
  { id: 'help', label: 'Help', command: '/help', group: 'Session', description: 'Show available Command Code commands.' },
  { id: 'status', label: 'Status', command: '/status', group: 'Session', description: 'Inspect current runtime and authentication state.' },
  { id: 'clear', label: 'Clear', command: '/clear', group: 'Session', description: 'Clear the interactive conversation view.' },
  { id: 'exit', label: 'Exit', command: '/exit', group: 'Session', description: 'Ask the current session to exit cleanly.' },
  { id: 'plan', label: 'Create a plan', command: '/plan', group: 'Planning', description: 'Enter Command Code plan mode for the current task.' },
  { id: 'headless', label: 'Run headless', command: 'cmd --print', group: 'Planning', description: 'Run the current prompt once with cmd --print and record the result.', action: 'run-headless' },
  { id: 'design', label: 'Design surface', command: '/design surface', group: 'Design', description: 'Run a design-surface pass for UI and product work.' },
  { id: 'agents', label: 'Agents', command: '/agents', group: 'Agents', description: 'Manage Command Code agent configurations.' },
  { id: 'skills', label: 'Skills', command: '/skills', group: 'Agents', description: 'Browse and use available skills.' },
  { id: 'model', label: 'Model', command: '/model', group: 'Runtime', description: 'Switch or inspect the active model.' },
  { id: 'configure-models', label: 'Configure models', command: '/configure-models', group: 'Runtime', description: 'Route background tasks like compaction and session titles to specific models.' },
  { id: 'usage', label: 'Usage', command: '/usage', group: 'Runtime', description: 'Show credits and usage information.' },
  { id: 'context', label: 'Context', command: '/context', group: 'Runtime', description: 'Inspect context window usage.' },
  { id: 'memory', label: 'Memory', command: '/memory', group: 'Project', description: 'Manage project memory files.' },
  { id: 'taste', label: 'Taste', command: '/taste', group: 'Project', description: 'Manage taste learning packages.' },
  { id: 'mcp', label: 'MCP', command: '/mcp', group: 'Project', description: 'Manage MCP servers.' }
]

export const commandGroups: CommandPaletteItem['group'][] = ['Session', 'Planning', 'Design', 'Agents', 'Runtime', 'Project']

export const releaseNotes: Record<string, ReleaseNote> = {
  '0.33.2': {
    eyebrow: 'New in v0.33.2',
    title: 'Web Search + Web Fetch',
    body: 'Command Code can now browse the web from your terminal, so current sources can supplement model training cutoffs.',
    bullets: [
      'Web Search returns ranked results.',
      'Web Fetch reads full pages instead of snippets.',
      'Training data has a cutoff. The web does not.'
    ]
  },
  '0.32.3': {
    eyebrow: 'New in v0.32.3',
    title: '/configure-models',
    body: 'Routes background requests to a model of your choice, so the expensive work and the lightweight housekeeping work can use different models.',
    bullets: [
      'Run compaction on MiniMax M2.5.',
      'Assign session titles with DeepSeek V4 Flash.',
      'Pick a model for each task, then press r to reset.'
    ],
    command: '/configure-models'
  }
}

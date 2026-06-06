import type { SettingsSection } from '../appTypes'

export type WorkflowRecipe = {
  id: string
  title: string
  surface: 'Session' | 'Planning' | 'Design' | 'Agents' | 'Runtime' | 'Project' | 'Settings'
  intent: 'send-active-session' | 'start-new-session' | 'open-settings' | 'preview-only'
  settingsSection?: SettingsSection
  command?: string
  description: string
  preview: string
  keywords: string[]
  risk: 'none' | 'runtime' | 'write-capable' | 'future'
}

export const workflowRecipes: WorkflowRecipe[] = [
  {
    id: 'interactive-session',
    title: 'Interactive session',
    surface: 'Session',
    intent: 'start-new-session',
    description: 'Start a Command Code PTY session for ongoing work.',
    preview: 'Starts through the existing session start controls; no hidden prompt rewriting.',
    keywords: ['interactive', 'session', 'pty', 'start'],
    risk: 'runtime'
  },
  {
    id: 'headless-run',
    title: 'Headless run',
    surface: 'Planning',
    intent: 'start-new-session',
    command: 'cmd --print',
    description: 'Run the current prompt once and keep the result in headless history.',
    preview: 'Uses the existing headless command path and visible permission controls.',
    keywords: ['headless', 'print', 'one-shot', 'run'],
    risk: 'runtime'
  },
  {
    id: 'plan-mode',
    title: 'Plan mode',
    surface: 'Planning',
    intent: 'send-active-session',
    command: '/plan',
    description: 'Ask Command Code to enter planning posture for the current task.',
    preview: 'Sends /plan to the active session or inserts it in the composer.',
    keywords: ['plan', 'planning', 'safe'],
    risk: 'none'
  },
  {
    id: 'design-surface',
    title: 'Design surface pass',
    surface: 'Design',
    intent: 'send-active-session',
    command: '/design surface',
    description: 'Run the documented design surface helper for app UI work.',
    preview: 'Sends the visible /design surface command; structured visual context remains future/plugin-owned.',
    keywords: ['design', 'surface', 'ui', 'frontend', 'visual'],
    risk: 'none'
  },
  {
    id: 'resume-session',
    title: 'Resume project session',
    surface: 'Session',
    intent: 'start-new-session',
    description: 'Resume a discovered project transcript from Settings > Sessions.',
    preview: 'Uses the existing scoped resume action; source transcript remains visible before resume.',
    keywords: ['resume', 'transcript', 'session', 'continue'],
    risk: 'runtime'
  },
  {
    id: 'continue-session',
    title: 'Continue current session',
    surface: 'Session',
    intent: 'send-active-session',
    description: 'Send the next visible composer prompt to the active session.',
    preview: 'Uses the composer send path; does not mutate hidden prompt state.',
    keywords: ['continue', 'send', 'composer', 'active'],
    risk: 'none'
  },
  {
    id: 'configure-models',
    title: 'Configure task models',
    surface: 'Runtime',
    intent: 'send-active-session',
    command: '/configure-models',
    description: 'Open Command Code task model routing for compaction, titles, and background work.',
    preview: 'Sends /configure-models; persistent routing writes remain Command Code-owned.',
    keywords: ['model', 'routing', 'compaction', 'titles', 'configure'],
    risk: 'none'
  },
  {
    id: 'mcp-setup',
    title: 'MCP setup',
    surface: 'Settings',
    intent: 'open-settings',
    settingsSection: 'mcp',
    description: 'Inspect MCP servers, auth state, and setup actions from Settings > MCP.',
    preview: 'Open Settings > MCP before running any connect/disconnect command.',
    keywords: ['mcp', 'server', 'tools', 'connect', 'auth'],
    risk: 'write-capable'
  },
  {
    id: 'hook-setup',
    title: 'Hook setup',
    surface: 'Settings',
    intent: 'open-settings',
    settingsSection: 'hooks',
    description: 'Inspect hook config, previews, dry-runs, and logs from Settings > Hooks.',
    preview: 'Open Settings > Hooks; hook execution remains Command Code-owned.',
    keywords: ['hooks', 'hook', 'stop', 'pretooluse', 'posttooluse', 'dry-run'],
    risk: 'write-capable'
  },
  {
    id: 'notification-setup',
    title: 'Notification setup',
    surface: 'Settings',
    intent: 'open-settings',
    settingsSection: 'notifications',
    description: 'Adjust GUI toast/audio preferences for implemented categories.',
    preview: 'Open Settings > Notifications; readiness dispatch remains gated.',
    keywords: ['notifications', 'toast', 'audio', 'readiness', 'response'],
    risk: 'future'
  },
  {
    id: 'agent-creation',
    title: 'Agent creation',
    surface: 'Agents',
    intent: 'open-settings',
    settingsSection: 'agents',
    command: '/agents',
    description: 'Use Command Code agent surfaces or Settings > Agents with explicit scope display.',
    preview: 'Do not write unsupported agent semantics without preview and validation.',
    keywords: ['agents', 'agent', 'create', 'templates'],
    risk: 'write-capable'
  }
]

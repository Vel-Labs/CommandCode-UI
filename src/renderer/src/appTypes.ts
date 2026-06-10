import type { DiscoveredSession } from '../../core/types'
import type { SessionReadinessState } from './services/sessionReadiness'

export type WorkspaceView = 'home' | 'session' | 'transcript' | 'settings'
export type RightInspector = 'none' | 'files' | 'file' | 'transcript' | 'docs' | 'environment' | 'ide'
export type RuntimeMode = 'mock' | 'real-session'
export type PopoverKey = 'project' | 'permission' | 'runtime' | 'model' | 'slash' | null
export type SettingsSection =
  | 'profile'
  | 'general'
  | 'runtime'
  | 'appearance'
  | 'models'
  | 'notifications'
  | 'terminal'
  | 'keyboard'
  | 'data'
  | 'usage'
  | 'sessions'
  | 'integrations'
  | 'hooks'
  | 'mcp'
  | 'agents'
  | 'skills'
  | 'design'
  | 'memory'
  | 'taste'
  | 'advanced'
  | 'about'
export type AppearanceTheme = 'cc-spectrum' | 'terminal-minimal' | 'blueprint' | 'high-contrast'
export type ChatBubbleColors = {
  user: string
  assistant: string
}
export type CommandAction = 'insert' | 'send' | 'run-headless'
export type UpdateState = 'idle' | 'checking' | 'available' | 'current' | 'updating' | 'failed'
export type SidebarSection = 'projects' | 'recentChats' | 'activeSessions'

export type CommandPaletteItem = {
  id: string
  label: string
  command: string
  group: 'Session' | 'Planning' | 'Design' | 'Agents' | 'Runtime' | 'Project'
  description: string
  action?: CommandAction
}

export type ReleaseNote = {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  command?: string
  primaryLabel?: string
  generated?: boolean
}

export type SessionTab = {
  id: string
  label: string
  mock: boolean
  model?: string
  stopRequested: boolean
  stopStage: 0 | 1 | 2
  transcriptPath: string
  structuredTranscriptPath?: string
  commandCodeSessionId?: string
  transcriptBindingStatus: 'unbound' | 'binding' | 'bound' | 'ambiguous' | 'failed'
  projectLabel: string
  runtimeMode: RuntimeMode
  readiness: SessionReadinessState
  lastPrompt?: string
  resumedSession?: DiscoveredSession
}

export type WorkEvent = {
  id: string
  label: string
  detail: string
  tone?: 'default' | 'warn' | 'good'
}

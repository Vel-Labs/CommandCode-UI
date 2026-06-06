import type { JSX } from 'react'
import {
  Activity,
  Bell,
  Bot,
  Braces,
  CreditCard,
  Database,
  HardDrive,
  History,
  Keyboard,
  MemoryStick,
  Monitor,
  Palette,
  Plug,
  Settings,
  Sparkles,
  Terminal,
  UserCircle,
  Wrench
} from 'lucide-react'
import type { SettingsSection } from '../appTypes'

export type SettingsRegistryItem = {
  id: SettingsSection
  label: string
  description: string
  group: 'Personal' | 'Workbench' | 'Integrations' | 'Diagnostics'
  icon: JSX.Element
  searchText: string
}

export type SettingsRegistryGroup = {
  label: SettingsRegistryItem['group']
  items: SettingsRegistryItem[]
}

export const settingsRegistry: SettingsRegistryItem[] = [
  section('profile', 'Profile', 'Local adapter activity, runtime receipts, and operator summary.', 'Personal', <UserCircle size={17} />, 'profile activity dashboard receipts operator summary'),
  section('general', 'General', 'Command binary, startup basics, and onboarding behavior.', 'Personal', <Settings size={17} />, 'general command binary startup onboarding default project'),
  section('appearance', 'Appearance', 'Theme, contrast, and desktop adapter presentation.', 'Personal', <Palette size={17} />, 'appearance theme contrast visual color'),
  section('runtime', 'Runtime', 'PTY health, auth, permissions, mode, model, IDE diagnostics.', 'Workbench', <Wrench size={17} />, 'runtime pty auth permission trust model ide diagnostics'),
  section('models', 'Models', 'Model picker and configure-models helper entry points.', 'Workbench', <Sparkles size={17} />, 'models configure-models routing compaction titles'),
  section('notifications', 'Notifications', 'Toast and audio preferences, quiet mode, and readiness alerts.', 'Workbench', <Bell size={17} />, 'notifications toast audio quiet chime alert response ready'),
  section('terminal', 'Terminal', 'Terminal font, scrollback, bell, cursor, line height, and profiles.', 'Workbench', <Terminal size={17} />, 'terminal font scrollback bell cursor line height profile'),
  section('keyboard', 'Keyboard', 'Shortcut reference and visible accelerator hints.', 'Workbench', <Keyboard size={17} />, 'keyboard shortcuts accelerators command palette'),
  section('data', 'Data', 'Transcript, cache, preference reset, export, and import controls.', 'Workbench', <Database size={17} />, 'data transcripts cache reset export import deletion'),
  section('usage', 'Usage', 'Headless history and local run counters.', 'Workbench', <CreditCard size={17} />, 'usage headless history jobs costs tokens'),
  section('sessions', 'Sessions', 'Read-only discovered Command Code sessions.', 'Workbench', <History size={17} />, 'sessions discovered transcripts resume history project global'),
  section('integrations', 'Integrations', 'Docs and integration entry points while deeper managers are staged.', 'Integrations', <Plug size={17} />, 'integrations docs command code cli'),
  section('hooks', 'Hooks', 'Project and user hook discovery, validation, examples, and scope.', 'Integrations', <Braces size={17} />, 'hooks settings json pretooluse posttooluse stop scope'),
  section('mcp', 'MCP', 'MCP server scopes, commands, auth state, and tool visibility.', 'Integrations', <Plug size={17} />, 'mcp server scope auth tools command'),
  section('agents', 'Agents', 'Project and global agent configs with exact destination paths.', 'Integrations', <Bot size={17} />, 'agents config yaml markdown global project'),
  section('skills', 'Skills', 'Installed skills, source scope, preview, and insert/use actions.', 'Integrations', <MemoryStick size={17} />, 'skills skill md preview source scope'),
  section('design', 'Design', 'Design helper modes, targets, and command previews.', 'Integrations', <Monitor size={17} />, 'design surface review checkup mode target command'),
  section('memory', 'Memory', 'Readable and editable memory scopes with ownership warnings.', 'Integrations', <MemoryStick size={17} />, 'memory commandcode agents claude project global'),
  section('taste', 'Taste', 'Taste profile discovery and GUI-owned presentation.', 'Integrations', <Sparkles size={17} />, 'taste profile learning preference'),
  section('advanced', 'Advanced', 'Diagnostics and explicit advanced tools.', 'Diagnostics', <HardDrive size={17} />, 'advanced diagnostics files mcp skills memory agents usage command history'),
  section('about', 'About', 'Version, release history, update visibility, and local docs.', 'Diagnostics', <Activity size={17} />, 'about version release update docs')
]

export function groupedSettings(query = ''): SettingsRegistryGroup[] {
  const normalized = query.trim().toLowerCase()
  const items = normalized
    ? settingsRegistry.filter((item) => `${item.label} ${item.description} ${item.searchText}`.toLowerCase().includes(normalized))
    : settingsRegistry

  const groups: SettingsRegistryGroup[] = []
  for (const item of items) {
    let group = groups.find((candidate) => candidate.label === item.group)
    if (!group) {
      group = { label: item.group, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

export function settingsItem(section: SettingsSection): SettingsRegistryItem {
  const fallback = settingsRegistry[0]
  if (!fallback) throw new Error('Settings registry is empty')
  return settingsRegistry.find((item) => item.id === section) || fallback
}

function section(
  id: SettingsSection,
  label: string,
  description: string,
  group: SettingsRegistryItem['group'],
  icon: JSX.Element,
  searchText: string
): SettingsRegistryItem {
  return { id, label, description, group, icon, searchText }
}

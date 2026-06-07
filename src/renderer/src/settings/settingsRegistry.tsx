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
  role: 'task' | 'reference' | 'diagnostic' | 'hub'
  taskGroup: 'Setup' | 'Project' | 'Integrations' | 'Diagnostics' | 'Reference'
  primaryActionLabel?: string
  icon: JSX.Element
  searchText: string
}

export type SettingsRegistryGroup = {
  label: SettingsRegistryItem['group']
  items: SettingsRegistryItem[]
}

export const settingsRegistry: SettingsRegistryItem[] = [
  section('profile', 'Profile', 'Current status, setup checklist, and recommended next actions.', 'Personal', 'hub', 'Setup', <UserCircle size={17} />, 'profile overview setup checklist activity receipts operator summary next actions', 'Review next actions'),
  section('general', 'General', 'Choose the Command Code binary and startup behavior.', 'Personal', 'task', 'Setup', <Settings size={17} />, 'general command binary startup onboarding default project setup', 'Check CLI'),
  section('appearance', 'Appearance', 'Tune the desktop adapter theme and contrast.', 'Personal', 'reference', 'Reference', <Palette size={17} />, 'appearance theme contrast visual color presentation'),
  section('runtime', 'Runtime', 'Check PTY/auth/IDE health and choose session permissions/model.', 'Workbench', 'task', 'Setup', <Wrench size={17} />, 'runtime pty auth permission trust model ide diagnostics setup health', 'Review runtime'),
  section('models', 'Models', 'Choose active-session model behavior and preview Command Code model helpers.', 'Workbench', 'task', 'Setup', <Sparkles size={17} />, 'models configure-models routing compaction titles runtime picker', 'Open model helper'),
  section('notifications', 'Notifications', 'Control GUI toast and audio feedback for operator events.', 'Workbench', 'reference', 'Reference', <Bell size={17} />, 'notifications toast audio quiet quiet mode chime alert response ready feedback'),
  section('terminal', 'Terminal', 'Tune xterm presentation for readable sessions.', 'Workbench', 'reference', 'Reference', <Terminal size={17} />, 'terminal font scrollback bell cursor line height profile readable'),
  section('keyboard', 'Keyboard', 'Find shortcuts and command palette accelerators.', 'Workbench', 'reference', 'Reference', <Keyboard size={17} />, 'keyboard shortcuts accelerators command palette reference'),
  section('data', 'Data', 'Inspect project state and gated data controls.', 'Workbench', 'diagnostic', 'Diagnostics', <Database size={17} />, 'data project state transcripts cache reset export import deletion diagnostics'),
  section('usage', 'Usage', 'Review headless history, local counters, and Command Code usage summary.', 'Workbench', 'diagnostic', 'Diagnostics', <CreditCard size={17} />, 'usage headless history jobs costs tokens counters diagnostics'),
  section('sessions', 'Sessions', 'Resume or reveal discovered project transcripts.', 'Workbench', 'task', 'Project', <History size={17} />, 'sessions discovered transcripts resume reveal history project global'),
  section('integrations', 'Integrations', 'Set up, edit, or inspect Command Code extension surfaces.', 'Integrations', 'hub', 'Integrations', <Plug size={17} />, 'integrations setup edit inspect docs command code cli mcp hooks agents skills memory taste design', 'Choose integration task'),
  section('hooks', 'Hooks', 'Inspect hook scopes, preview safe edits, and view hook diagnostics.', 'Integrations', 'task', 'Integrations', <Braces size={17} />, 'hooks settings json pretooluse posttooluse stop scope diagnostics dry-run logs'),
  section('mcp', 'MCP', 'Inspect MCP servers and run explicit connect/disconnect commands.', 'Integrations', 'task', 'Integrations', <Plug size={17} />, 'mcp server scope auth tools command connect disconnect'),
  section('agents', 'Agents', 'Create or edit project agents while inspecting user agents read-only.', 'Integrations', 'task', 'Project', <Bot size={17} />, 'agents config yaml markdown global project create edit destination'),
  section('skills', 'Skills', 'Inspect installed skills and source paths.', 'Integrations', 'reference', 'Reference', <MemoryStick size={17} />, 'skills skill md preview source scope inspect'),
  section('design', 'Design', 'Preview /design helper commands before sending them.', 'Integrations', 'task', 'Integrations', <Monitor size={17} />, 'design surface review checkup mode target command preview'),
  section('memory', 'Memory', 'Inspect and edit scoped project memory files.', 'Integrations', 'task', 'Project', <MemoryStick size={17} />, 'memory commandcode agents claude project global edit scoped'),
  section('taste', 'Taste', 'Inspect taste profile discovery without editing internals.', 'Integrations', 'reference', 'Reference', <Sparkles size={17} />, 'taste profile learning preference inspect discovery'),
  section('advanced', 'Diagnostics', 'Low-level local state, usage, and app reference routes.', 'Diagnostics', 'diagnostic', 'Diagnostics', <HardDrive size={17} />, 'advanced diagnostics files data usage about local state command history', 'Open diagnostics'),
  section('about', 'About', 'Confirm version, release history, update status, and local docs.', 'Diagnostics', 'reference', 'Reference', <Activity size={17} />, 'about version release update docs reference')
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
  role: SettingsRegistryItem['role'],
  taskGroup: SettingsRegistryItem['taskGroup'],
  icon: JSX.Element,
  searchText: string,
  primaryActionLabel?: string
): SettingsRegistryItem {
  return { id, label, description, group, role, taskGroup, icon, searchText, primaryActionLabel }
}

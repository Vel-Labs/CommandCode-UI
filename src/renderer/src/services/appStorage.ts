import type { PermissionMode } from '../../../shared/types'
import type { AppGuiPreferences, CommandCodeUpdateResult } from '../../../core/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { AppearanceTheme, ChatBubbleColors, UpdateState } from '../appTypes'

export const RECENT_KEY = 'ccgui.recent-dirs'
export const APPEARANCE_KEY = 'ccgui.appearance-theme'
export const CHAT_USER_COLOR_KEY = 'ccgui.chat-user-color'
export const CHAT_ASSISTANT_COLOR_KEY = 'ccgui.chat-assistant-color'
export const PROJECT_MODEL_KEY = 'ccgui.project-models'
export const RELEASE_NOTES_SEEN_KEY = 'ccgui.release-notes-seen'
export const SIDEBAR_WIDTH_KEY = 'ccgui.sidebar-width'
export const INSPECTOR_WIDTH_KEY = 'ccgui.right-inspector-width'
export const SIDEBAR_MIN_WIDTH = 220
export const SIDEBAR_MAX_WIDTH = 420
export const SIDEBAR_COLLAPSE_WIDTH = 170
export const DEFAULT_SIDEBAR_WIDTH = 292
export const INSPECTOR_MIN_WIDTH = 320
export const INSPECTOR_MAX_WIDTH = 720
export const INSPECTOR_COLLAPSE_WIDTH = 280
export const DEFAULT_INSPECTOR_WIDTH = 420
export const PTY_KEYSTROKE_DELAY_MS = 20
export function defaultChatBubbleColors(theme: AppearanceTheme): ChatBubbleColors {
  if (theme === 'terminal-minimal') {
    return { user: '#a1a1aa', assistant: '#d4d4d8' }
  }
  if (theme === 'blueprint') {
    return { user: '#2563eb', assistant: '#38bdf8' }
  }
  if (theme === 'high-contrast') {
    return { user: '#ffffff', assistant: '#facc15' }
  }
  return { user: '#8b5cf6', assistant: '#38bdf8' }
}

export function loadAppearanceTheme(): AppearanceTheme {
  const stored = localStorage.getItem(APPEARANCE_KEY)
  if (stored === 'terminal-minimal' || stored === 'blueprint' || stored === 'high-contrast') return stored
  return 'cc-spectrum'
}

export function normalizeHexColor(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined
  const value = input.trim()
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : undefined
}

export function loadChatBubbleColors(theme = loadAppearanceTheme()): ChatBubbleColors {
  const defaults = defaultChatBubbleColors(theme)
  return {
    user: normalizeHexColor(localStorage.getItem(CHAT_USER_COLOR_KEY)) || defaults.user,
    assistant: normalizeHexColor(localStorage.getItem(CHAT_ASSISTANT_COLOR_KEY)) || defaults.assistant
  }
}

export function defaultCwd(): string {
  return localStorage.getItem('ccgui.cwd') || ''
}

export function defaultCommand(): string {
  return localStorage.getItem('ccgui.command') || 'cmd'
}

export function displayPath(input: string): string {
  if (!input.trim()) return 'No project selected'
  const parts = input.split('/').filter(Boolean)
  return parts.at(-1) || input
}

export function loadRecentProjects(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[]
  } catch {
    return []
  }
}

export function saveRecentProject(dir: string): string[] {
  if (!dir.trim()) return loadRecentProjects()
  const dirs = loadRecentProjects().filter((entry) => entry !== dir)
  dirs.unshift(dir)
  const next = dirs.slice(0, 8)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

export function loadProjectModels(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_MODEL_KEY) || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

export function saveProjectModel(project: string, model: string): void {
  if (!project.trim()) return
  const projectModels = loadProjectModels()
  if (model.trim()) {
    projectModels[project] = model
  } else {
    delete projectModels[project]
  }
  localStorage.setItem(PROJECT_MODEL_KEY, JSON.stringify(projectModels))
}

export function loadSeenReleaseNotes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RELEASE_NOTES_SEEN_KEY) || '[]') as string[]
  } catch {
    return []
  }
}

export function loadNumberPreference(key: string, fallback: number, min: number, max: number): number {
  const raw = Number(localStorage.getItem(key))
  if (!Number.isFinite(raw)) return fallback
  return Math.min(max, Math.max(min, raw))
}

export function markReleaseNoteSeen(version: string): void {
  const seen = loadSeenReleaseNotes()
  if (seen.includes(version)) return
  localStorage.setItem(RELEASE_NOTES_SEEN_KEY, JSON.stringify([...seen, version]))
}

export function permissionLabel(permissionMode: PermissionMode, trust: boolean): string {
  if (trust || permissionMode === 'auto-accept') return 'Full access'
  return 'Standard'
}

export function isRiskyPermission(permissionMode: PermissionMode, trust: boolean): boolean {
  return trust || permissionMode === 'auto-accept'
}

export function ptyHealthLabel(ptyHealth: PtyDoctorResult | null): string {
  if (!ptyHealth) return 'checking PTY'
  if (ptyHealth.healthy) return 'PTY connected'
  if (ptyHealth.available) return 'PTY unhealthy'
  return 'PTY unavailable'
}

export function looksPlanLike(input: string): boolean {
  return /\b(plan|planning|roadmap|approach|strategy)\b/i.test(input)
}

export function updateStateFromResult(result: CommandCodeUpdateResult): UpdateState {
  if (!result.ok) return 'failed'
  if (result.updateAvailable) return 'available'
  return 'current'
}

export function updateLabel(state: UpdateState, version?: string): string {
  if (state === 'checking') return 'Checking updates'
  if (state === 'updating') return 'Updating'
  if (state === 'available') return 'Update available'
  if (state === 'failed') return 'Update check failed'
  if (state === 'current') return version || 'Up to date'
  return 'Check updates'
}

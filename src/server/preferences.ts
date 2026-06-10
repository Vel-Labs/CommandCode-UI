import { existsSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { AppGuiPreferences, ProjectGuiPreferences } from '../core/types'

export function appPreferencesPath(): string {
  return path.join(os.homedir(), '.commandcode', 'gui-preferences.json')
}

export function sanitizeAppPreferences(input: unknown): AppGuiPreferences {
  const raw = (input && typeof input === 'object') ? input as Record<string, unknown> : {}
  const next: AppGuiPreferences = {
    version: 1,
    updatedAt: new Date().toISOString()
  }

  if (typeof raw.cwd === 'string') next.cwd = raw.cwd
  const recentProjects = sanitizeStringArray(raw.recentProjects, 12)
  if (recentProjects) next.recentProjects = recentProjects
  if (typeof raw.commandExecutable === 'string' && raw.commandExecutable.trim()) next.commandExecutable = raw.commandExecutable.trim()
  if (typeof raw.model === 'string') next.model = raw.model
  const projectModels = sanitizeProjectModels(raw.projectModels)
  if (projectModels) next.projectModels = projectModels
  if (raw.appearanceTheme === 'cc-spectrum' || raw.appearanceTheme === 'terminal-minimal' || raw.appearanceTheme === 'blueprint' || raw.appearanceTheme === 'high-contrast') {
    next.appearanceTheme = raw.appearanceTheme
  }
  if (raw.startupProjectBehavior === 'restore-last' || raw.startupProjectBehavior === 'empty') {
    next.startupProjectBehavior = raw.startupProjectBehavior
  }
  const releaseNotesSeen = sanitizeStringArray(raw.releaseNotesSeen, 50)
  if (releaseNotesSeen) next.releaseNotesSeen = releaseNotesSeen
  if (typeof raw.sidebarWidth === 'number' && Number.isFinite(raw.sidebarWidth)) {
    next.sidebarWidth = Math.min(420, Math.max(220, raw.sidebarWidth))
  }
  if (typeof raw.rightInspectorWidth === 'number' && Number.isFinite(raw.rightInspectorWidth)) {
    next.rightInspectorWidth = Math.min(720, Math.max(320, raw.rightInspectorWidth))
  }

  return next
}

export function projectPreferencesPath(cwdInput: string | undefined): { root?: string; prefPath?: string; error?: string } {
  const cwd = cwdInput?.trim()
  if (!cwd) return { error: 'Missing project path' }

  const root = path.resolve(cwd)
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    return { error: 'Project path not found' }
  }

  return {
    root,
    prefPath: path.join(root, '.commandcode', 'gui-preferences.json')
  }
}

export function sanitizeProjectPreferences(input: unknown, root: string): ProjectGuiPreferences {
  const raw = (input && typeof input === 'object') ? input as Record<string, unknown> : {}
  const next: ProjectGuiPreferences = {
    version: 1,
    projectPath: root,
    updatedAt: new Date().toISOString()
  }

  if (typeof raw.model === 'string') next.model = raw.model
  if (raw.runtimeMode === 'mock' || raw.runtimeMode === 'real-session') next.runtimeMode = raw.runtimeMode
  if (raw.permissionMode === 'standard' || raw.permissionMode === 'plan' || raw.permissionMode === 'auto-accept') next.permissionMode = raw.permissionMode
  if (typeof raw.trust === 'boolean') next.trust = raw.trust
  if (typeof raw.skipOnboarding === 'boolean') next.skipOnboarding = raw.skipOnboarding
  if (typeof raw.headlessMaxTurns === 'number' && Number.isFinite(raw.headlessMaxTurns)) {
    next.headlessMaxTurns = Math.max(1, Math.min(100, Math.floor(raw.headlessMaxTurns)))
  }
  if (typeof raw.headlessYolo === 'boolean') next.headlessYolo = raw.headlessYolo
  if (raw.appearanceTheme === 'cc-spectrum' || raw.appearanceTheme === 'terminal-minimal' || raw.appearanceTheme === 'blueprint' || raw.appearanceTheme === 'high-contrast') {
    next.appearanceTheme = raw.appearanceTheme
  }

  return next
}

function sanitizeStringArray(input: unknown, maxItems: number): string[] | undefined {
  if (!Array.isArray(input)) return undefined
  return input
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, maxItems)
}

function sanitizeProjectModels(input: unknown): Record<string, string> | undefined {
  if (!input || typeof input !== 'object') return undefined
  const out: Record<string, string> = {}
  for (const [project, model] of Object.entries(input as Record<string, unknown>)) {
    if (typeof project === 'string' && typeof model === 'string' && project.trim() && model.trim()) {
      out[project.trim()] = model.trim()
    }
  }
  return out
}

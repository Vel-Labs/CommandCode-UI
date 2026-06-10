import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  checkCommandCode,
  commandCodeStatus,
  commandCodeUpdate,
  listModels
} from '../core/cli'
import { ptyDoctorAsync } from '../core/ptyDoctor'
import { runDoctorChecks } from '../core/doctor'
import type {
  AppGuiPreferences,
  AppGuiPreferencesResult,
  ProjectGuiPreferences,
  ProjectGuiPreferencesResult
} from '../core/types'
import type { RouteHandler } from './http'
import {
  appPreferencesPath,
  projectPreferencesPath,
  sanitizeAppPreferences,
  sanitizeProjectPreferences
} from './preferences'

type AddRoute = (method: string, pattern: string, handler: RouteHandler) => void

export function registerCoreRoutes(addRoute: AddRoute): void {
  addRoute('GET', '/health', async () => ({ ok: true }))

  addRoute('GET', '/api/pty-health', async () => {
    return ptyDoctorAsync()
  })

  addRoute('GET', '/api/doctor', async () => {
    return runDoctorChecks()
  })

  addRoute('POST', '/api/check', async ({ body }) => {
    const { commandExecutable } = body as Record<string, unknown>
    return checkCommandCode(typeof commandExecutable === 'string' ? commandExecutable : undefined)
  })

  addRoute('POST', '/api/status', async ({ body }) => {
    const { commandExecutable, cwd } = body as Record<string, unknown>
    return commandCodeStatus(
      typeof commandExecutable === 'string' ? commandExecutable : undefined,
      typeof cwd === 'string' ? cwd : undefined
    )
  })

  addRoute('POST', '/api/update', async ({ body }) => {
    const { commandExecutable, cwd, checkOnly } = body as Record<string, unknown>
    return commandCodeUpdate(
      typeof commandExecutable === 'string' ? commandExecutable : undefined,
      typeof cwd === 'string' ? cwd : undefined,
      checkOnly !== false
    )
  })

  addRoute('POST', '/api/models', async ({ body }) => {
    const { commandExecutable, cwd } = body as Record<string, unknown>
    return listModels(
      typeof commandExecutable === 'string' ? commandExecutable : undefined,
      typeof cwd === 'string' ? cwd : undefined
    )
  })

  addRoute('POST', '/api/app/preferences', async () => {
    const prefPath = appPreferencesPath()
    if (!existsSync(prefPath)) {
      return { ok: true, path: prefPath, preferences: { version: 1 } } satisfies AppGuiPreferencesResult
    }

    const stat = statSync(prefPath)
    if (stat.size > 64 * 1024) {
      return { ok: false, path: prefPath, error: 'App GUI preferences file is too large' } satisfies AppGuiPreferencesResult
    }

    try {
      const parsed = JSON.parse(readFileSync(prefPath, 'utf8')) as AppGuiPreferences
      return { ok: true, path: prefPath, preferences: parsed } satisfies AppGuiPreferencesResult
    } catch {
      return { ok: false, path: prefPath, error: 'App GUI preferences file is invalid JSON' } satisfies AppGuiPreferencesResult
    }
  })

  addRoute('POST', '/api/app/preferences/save', async ({ body }) => {
    const { preferences } = body as { preferences?: unknown }
    const prefPath = appPreferencesPath()
    const sanitized = sanitizeAppPreferences(preferences)
    mkdirSync(path.dirname(prefPath), { recursive: true })
    writeFileSync(prefPath, `${JSON.stringify(sanitized, null, 2)}\n`, 'utf8')
    return { ok: true, path: prefPath, preferences: sanitized } satisfies AppGuiPreferencesResult
  })

  addRoute('POST', '/api/project/preferences', async ({ body }) => {
    const { cwd } = body as { cwd?: string }
    const target = projectPreferencesPath(cwd)
    if (target.error || !target.prefPath) return { ok: false, error: target.error } satisfies ProjectGuiPreferencesResult

    if (!existsSync(target.prefPath)) {
      return { ok: true, path: target.prefPath, preferences: { version: 1, projectPath: target.root } } satisfies ProjectGuiPreferencesResult
    }

    const stat = statSync(target.prefPath)
    if (stat.size > 64 * 1024) {
      return { ok: false, path: target.prefPath, error: 'Project GUI preferences file is too large' } satisfies ProjectGuiPreferencesResult
    }

    try {
      const parsed = JSON.parse(readFileSync(target.prefPath, 'utf8')) as ProjectGuiPreferences
      return { ok: true, path: target.prefPath, preferences: parsed } satisfies ProjectGuiPreferencesResult
    } catch {
      return { ok: false, path: target.prefPath, error: 'Project GUI preferences file is invalid JSON' } satisfies ProjectGuiPreferencesResult
    }
  })

  addRoute('POST', '/api/project/preferences/save', async ({ body }) => {
    const { cwd, preferences } = body as { cwd?: string; preferences?: unknown }
    const target = projectPreferencesPath(cwd)
    if (target.error || !target.root || !target.prefPath) return { ok: false, error: target.error } satisfies ProjectGuiPreferencesResult

    const sanitized = sanitizeProjectPreferences(preferences, target.root)
    mkdirSync(path.dirname(target.prefPath), { recursive: true })
    writeFileSync(target.prefPath, `${JSON.stringify(sanitized, null, 2)}\n`, 'utf8')

    return { ok: true, path: target.prefPath, preferences: sanitized } satisfies ProjectGuiPreferencesResult
  })
}

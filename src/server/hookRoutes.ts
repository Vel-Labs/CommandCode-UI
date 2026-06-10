import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  mergeHookConfigs,
  removeHookCommand,
  setHookCommandEnabled,
  updateHookCommand,
  type HookCommandUpdate,
  type HookConfigEditApplyResult,
  type HookConfigEditPreviewResult,
  type HookConfigTogglePreviewResult,
  type HookEvent,
  type HookScope
} from '../core/hooksConfig'
import {
  extensionOf,
  isHookLogFileName,
  type HookLogReadResult
} from '../core/hooksLogs'
import { buildHookDryRun, type HookDryRunResult } from '../core/hooksDryRun'
import { isPathUnderRoot, resolveBoundaryPath } from '../shared/pathContainment'
import type { RouteHandler } from './http'
import {
  discoverHookLogs,
  emptyHookConfigSource,
  readHookConfigSource,
  sanitizeHookCommandUpdate
} from './hookRouteSupport'

type AddRoute = (method: string, pattern: string, handler: RouteHandler) => void

type HookRoutesOptions = {
  resolveWorkspaceRoot: (cwdInput?: string) => { root?: string; error?: string }
}

const MAX_FILE_READ_BYTES = 1_048_576 // 1MB

export function registerHookRoutes(addRoute: AddRoute, { resolveWorkspaceRoot }: HookRoutesOptions): void {
  function hookConfigPathForScope(sourceScope: HookScope, cwd?: string): { sourcePath?: string; error?: string } {
    if (sourceScope === 'user') {
      return { sourcePath: path.join(os.homedir(), '.commandcode', 'settings.json') }
    }

    const workspace = resolveWorkspaceRoot(cwd)
    if (!workspace.root) return { error: workspace.error || 'Access denied — project root is required' }
    return { sourcePath: path.join(workspace.root, '.commandcode', 'settings.json') }
  }

  function hookLogDirForScope(sourceScope: HookScope, cwd?: string): { dir?: string; error?: string } {
    if (sourceScope === 'user') {
      return { dir: path.join(os.homedir(), '.commandcode', 'hooks') }
    }

    const workspace = resolveWorkspaceRoot(cwd)
    if (!workspace.root) return { error: workspace.error || 'Access denied — project root is required' }
    return { dir: path.join(workspace.root, '.commandcode', 'hooks') }
  }

  function readHookLog(body: { cwd?: string; sourceScope?: string; path?: string }): HookLogReadResult {
    const { cwd, sourceScope, path: logPath } = body
    if (sourceScope !== 'project' && sourceScope !== 'user') {
      return { ok: false, error: 'sourceScope must be project or user' }
    }
    if (!logPath) return { ok: false, error: 'No hook log path provided' }

    const logDir = hookLogDirForScope(sourceScope, cwd)
    if (!logDir.dir) return { ok: false, error: logDir.error || 'Access denied — project root is required' }

    const resolved = resolveBoundaryPath(logPath)
    if (!isPathUnderRoot(resolved, logDir.dir)) {
      return { ok: false, sourceScope, path: resolved, error: 'Access denied — hook log path outside documented hooks directory' }
    }
    if (!isHookLogFileName(resolved)) {
      return { ok: false, sourceScope, path: resolved, error: 'Unsupported hook log file type' }
    }
    if (!existsSync(resolved) || statSync(resolved).isDirectory()) {
      return { ok: false, sourceScope, path: resolved, error: 'Hook log not found' }
    }

    const stat = statSync(resolved)
    if (stat.size > MAX_FILE_READ_BYTES) {
      return { ok: false, sourceScope, path: resolved, error: 'Hook log exceeds 1MB read limit' }
    }
    return {
      ok: true,
      sourceScope,
      path: resolved,
      ext: extensionOf(resolved),
      sizeBytes: stat.size,
      content: readFileSync(resolved, 'utf8')
    }
  }

  function buildHookTogglePreview(body: {
    cwd?: string
    sourceScope?: string
    event?: string
    command?: string
    enabled?: boolean
  }): HookConfigTogglePreviewResult {
    const { cwd, sourceScope, event, command, enabled } = body
    if (sourceScope !== 'project' && sourceScope !== 'user') {
      return { ok: false, error: 'sourceScope must be project or user' }
    }
    if (!event || !command || typeof enabled !== 'boolean') {
      return { ok: false, error: 'Missing event, command, or enabled value' }
    }

    const source = hookConfigPathForScope(sourceScope, cwd)
    if (!source.sourcePath) return { ok: false, error: source.error || 'Access denied — project root is required' }
    if (!existsSync(source.sourcePath)) return { ok: false, sourceScope, sourcePath: source.sourcePath, error: 'Hook config file not found' }

    try {
      const stat = statSync(source.sourcePath)
      if (stat.isDirectory()) return { ok: false, sourceScope, sourcePath: source.sourcePath, error: 'Hook config path is a directory' }
      if (stat.size > MAX_FILE_READ_BYTES) return { ok: false, sourceScope, sourcePath: source.sourcePath, error: 'Hook config exceeds 1MB read limit' }

      return {
        ...setHookCommandEnabled(readFileSync(source.sourcePath, 'utf8'), event, command, enabled),
        sourceScope,
        sourcePath: source.sourcePath,
        event,
        command,
        enabled
      }
    } catch (err) {
      return {
        ok: false,
        sourceScope,
        sourcePath: source.sourcePath,
        error: err instanceof Error ? err.message : 'Failed to preview hook config change'
      }
    }
  }

  function buildHookEditPreview(body: {
    cwd?: string
    sourceScope?: string
    event?: string
    command?: string
    action?: string
    update?: HookCommandUpdate
  }): HookConfigEditPreviewResult {
    const { cwd, sourceScope, event, command, action, update } = body
    if (sourceScope !== 'project' && sourceScope !== 'user') {
      return { ok: false, error: 'sourceScope must be project or user' }
    }
    if (!event || !command || (action !== 'update' && action !== 'remove')) {
      return { ok: false, error: 'Missing event, command, or edit action' }
    }

    const source = hookConfigPathForScope(sourceScope, cwd)
    if (!source.sourcePath) return { ok: false, error: source.error || 'Access denied — project root is required' }
    if (!existsSync(source.sourcePath)) return { ok: false, sourceScope, sourcePath: source.sourcePath, error: 'Hook config file not found' }

    try {
      const stat = statSync(source.sourcePath)
      if (stat.isDirectory()) return { ok: false, sourceScope, sourcePath: source.sourcePath, error: 'Hook config path is a directory' }
      if (stat.size > MAX_FILE_READ_BYTES) return { ok: false, sourceScope, sourcePath: source.sourcePath, error: 'Hook config exceeds 1MB read limit' }

      const raw = readFileSync(source.sourcePath, 'utf8')
      const result = action === 'remove'
        ? removeHookCommand(raw, event, command)
        : updateHookCommand(raw, event, command, sanitizeHookCommandUpdate(update))
      return {
        ...result,
        sourceScope,
        sourcePath: source.sourcePath,
        event,
        command,
        action,
        update: action === 'update' ? sanitizeHookCommandUpdate(update) : undefined
      }
    } catch (err) {
      return {
        ok: false,
        sourceScope,
        sourcePath: source.sourcePath,
        event,
        command,
        action,
        update,
        error: err instanceof Error ? err.message : 'Failed to preview hook config edit'
      }
    }
  }

  addRoute('POST', '/api/hooks/configs', async ({ body }) => {
    const { cwd } = body as { cwd?: string }
    const userPath = hookConfigPathForScope('user')
    const projectPath = hookConfigPathForScope('project', cwd)
    const userSource = readHookConfigSource('user', userPath.sourcePath || path.join(os.homedir(), '.commandcode', 'settings.json'))
    const projectSource = projectPath.sourcePath
      ? readHookConfigSource('project', projectPath.sourcePath)
      : emptyHookConfigSource('project', '<project>/.commandcode/settings.json', projectPath.error || 'Access denied — project root is required')
    const merged = mergeHookConfigs(userSource, projectSource)
    return {
      sources: [projectSource, userSource],
      hooks: merged.hooks,
      warnings: merged.warnings,
      errors: merged.errors
    }
  })

  addRoute('POST', '/api/hooks/preview-toggle', async ({ body }) => {
    return buildHookTogglePreview(body as {
      cwd?: string
      sourceScope?: string
      event?: string
      command?: string
      enabled?: boolean
    })
  })

  addRoute('POST', '/api/hooks/logs', async ({ body }) => {
    const { cwd } = body as { cwd?: string }
    return discoverHookLogs(cwd, hookLogDirForScope)
  })

  addRoute('POST', '/api/hooks/logs/read', async ({ body }) => {
    return readHookLog(body as { cwd?: string; sourceScope?: string; path?: string })
  })

  addRoute('POST', '/api/hooks/dry-run', async ({ body }) => {
    return buildHookDryRun(body as {
      cwd?: string
      sourceScope: HookScope
      event: HookEvent
      command: string
      matcher?: string
      enabled?: boolean
      toolName?: string
      permissionMode?: string
    }) satisfies HookDryRunResult
  })

  addRoute('POST', '/api/hooks/preview-edit', async ({ body }) => {
    return buildHookEditPreview(body as {
      cwd?: string
      sourceScope?: string
      event?: string
      command?: string
      action?: string
      update?: HookCommandUpdate
    })
  })

  addRoute('POST', '/api/hooks/apply-toggle', async ({ body }) => {
    const preview = buildHookTogglePreview(body as {
      cwd?: string
      sourceScope?: string
      event?: string
      command?: string
      enabled?: boolean
    })
    if (!preview.ok || !preview.sourcePath || !preview.content) return preview

    try {
      const backupPath = `${preview.sourcePath}.ccgui.bak`
      writeFileSync(backupPath, readFileSync(preview.sourcePath, 'utf8'), 'utf8')
      writeFileSync(preview.sourcePath, preview.content, 'utf8')
      return { ...preview, backupPath }
    } catch (err) {
      return {
        ok: false,
        sourceScope: preview.sourceScope,
        sourcePath: preview.sourcePath,
        event: preview.event,
        command: preview.command,
        enabled: preview.enabled,
        error: err instanceof Error ? err.message : 'Failed to apply hook config change'
      }
    }
  })

  addRoute('POST', '/api/hooks/apply-edit', async ({ body }) => {
    const preview = buildHookEditPreview(body as {
      cwd?: string
      sourceScope?: string
      event?: string
      command?: string
      action?: string
      update?: HookCommandUpdate
    })
    if (!preview.ok || !preview.sourcePath || !preview.content) return preview

    try {
      const backupPath = `${preview.sourcePath}.ccgui.bak`
      writeFileSync(backupPath, readFileSync(preview.sourcePath, 'utf8'), 'utf8')
      writeFileSync(preview.sourcePath, preview.content, 'utf8')
      return { ...preview, backupPath } satisfies HookConfigEditApplyResult
    } catch (err) {
      return {
        ok: false,
        sourceScope: preview.sourceScope,
        sourcePath: preview.sourcePath,
        event: preview.event,
        command: preview.command,
        action: preview.action,
        update: preview.update,
        error: err instanceof Error ? err.message : 'Failed to apply hook config edit'
      } satisfies HookConfigEditApplyResult
    }
  })
}

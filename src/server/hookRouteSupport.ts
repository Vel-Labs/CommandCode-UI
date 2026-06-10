import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  parseHookSettingsJson,
  type HookCommandUpdate,
  type HookConfigSourceResult,
  type HookScope
} from '../core/hooksConfig'
import {
  extensionOf,
  isHookLogFileName,
  type HookLogDiscoveryResult,
  type HookLogEntry,
  type HookLogSourceResult
} from '../core/hooksLogs'
import { isPathUnderRoot } from '../shared/pathContainment'

const MAX_FILE_READ_BYTES = 1_048_576 // 1MB

export function emptyHookConfigSource(sourceScope: HookScope, sourcePath: string, error?: string): HookConfigSourceResult {
  return {
    ok: !error,
    sourceScope,
    sourcePath,
    exists: false,
    hooks: [],
    warnings: [],
    errors: error ? [error] : []
  }
}

export function readHookConfigSource(sourceScope: HookScope, sourcePath: string): HookConfigSourceResult {
  if (!existsSync(sourcePath)) {
    return emptyHookConfigSource(sourceScope, sourcePath)
  }

  try {
    const stat = statSync(sourcePath)
    if (stat.isDirectory()) {
      return emptyHookConfigSource(sourceScope, sourcePath, 'Hook config path is a directory')
    }
    if (stat.size > MAX_FILE_READ_BYTES) {
      return emptyHookConfigSource(sourceScope, sourcePath, 'Hook config exceeds 1MB read limit')
    }

    return {
      ...parseHookSettingsJson(readFileSync(sourcePath, 'utf8'), sourceScope, sourcePath),
      exists: true,
      sizeBytes: stat.size,
      updatedAt: stat.mtime.toISOString()
    }
  } catch (err) {
    return emptyHookConfigSource(
      sourceScope,
      sourcePath,
      err instanceof Error ? err.message : 'Failed to read hook config'
    )
  }
}

export function discoverHookLogs(
  cwd: string | undefined,
  hookLogDirForScope: (sourceScope: HookScope, cwd?: string) => { dir?: string; error?: string }
): HookLogDiscoveryResult {
  const userDir = hookLogDirForScope('user')
  const projectDir = hookLogDirForScope('project', cwd)
  const userSource = discoverHookLogSource('user', userDir.dir || path.join(os.homedir(), '.commandcode', 'hooks'))
  const projectSource = projectDir.dir
    ? discoverHookLogSource('project', projectDir.dir)
    : emptyHookLogSource('project', '<project>/.commandcode/hooks', projectDir.error || 'Access denied — project root is required')
  return {
    sources: [projectSource, userSource],
    logs: [...projectSource.logs, ...userSource.logs],
    errors: [...projectSource.errors, ...userSource.errors]
  }
}

export function sanitizeHookCommandUpdate(input: unknown): HookCommandUpdate {
  if (!input || typeof input !== 'object') return {}
  const raw = input as Record<string, unknown>
  const update: HookCommandUpdate = {}
  if (typeof raw.command === 'string') update.command = raw.command
  if (typeof raw.matcher === 'string') update.matcher = raw.matcher
  if (raw.timeoutSeconds === null || typeof raw.timeoutSeconds === 'number') {
    update.timeoutSeconds = raw.timeoutSeconds
  }
  return update
}

function emptyHookLogSource(sourceScope: HookScope, dir: string, error?: string): HookLogSourceResult {
  return {
    sourceScope,
    dir,
    exists: false,
    logs: [],
    errors: error ? [error] : []
  }
}

function discoverHookLogSource(sourceScope: HookScope, dir: string): HookLogSourceResult {
  if (!existsSync(dir)) return emptyHookLogSource(sourceScope, dir)

  try {
    const stat = statSync(dir)
    if (!stat.isDirectory()) return emptyHookLogSource(sourceScope, dir, 'Hook log path is not a directory')

    const logs: HookLogEntry[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !isHookLogFileName(entry.name)) continue
      const logPath = path.join(dir, entry.name)
      if (!isPathUnderRoot(logPath, dir)) continue
      const logStat = statSync(logPath)
      logs.push({
        sourceScope,
        path: logPath,
        name: entry.name,
        ext: extensionOf(entry.name),
        sizeBytes: logStat.size,
        updatedAt: logStat.mtime.toISOString()
      })
    }
    logs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return { sourceScope, dir, exists: true, logs: logs.slice(0, 50), errors: [] }
  } catch (err) {
    return emptyHookLogSource(sourceScope, dir, err instanceof Error ? err.message : 'Failed to list hook logs')
  }
}

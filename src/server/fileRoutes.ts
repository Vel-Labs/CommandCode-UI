import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { FileEntry } from '../core/types'
import { isPathUnderRoot } from '../shared/pathContainment'
import { WorkspaceError, type RouteHandler } from './http'

type AddRoute = (method: string, pattern: string, handler: RouteHandler) => void

type FileRoutesOptions = {
  resolveWorkspaceRoot: (cwdInput?: string) => string
}

const MAX_FILE_READ_BYTES = 1_048_576 // 1MB

export function registerFileRoutes(addRoute: AddRoute, { resolveWorkspaceRoot }: FileRoutesOptions): void {
  // File system browsing: contained to registered workspace roots.
  addRoute('POST', '/api/files/list', async ({ body }) => {
    const { dir, cwd } = body as { dir?: string; cwd?: string }
    // resolveWorkspaceRoot throws WorkspaceError(400) on missing/unknown cwd.
    const root = resolveWorkspaceRoot(cwd)

    const target = path.resolve(dir ?? root)

    if (!isPathUnderRoot(target, root)) {
      throw new WorkspaceError('Access denied — path outside workspace root', 403)
    }

    if (!existsSync(target) || !statSync(target).isDirectory()) {
      return { error: 'Directory not found', entries: [] }
    }

    const entries: FileEntry[] = readdirSync(target)
      .map((name) => {
        const fullPath = path.join(target, name)
        let isDirectory = false
        let size: number | undefined
        try {
          const s = statSync(fullPath)
          isDirectory = s.isDirectory()
          size = s.size
        } catch { /* skip permission errors */ }
        return { name, path: fullPath, isDirectory, size }
      })
      .filter((entry) => !entry.name.startsWith('.') || entry.name === '.commandcode')
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      })

    return { entries, dir: target }
  })

  addRoute('POST', '/api/files/read', async ({ body }) => {
    const { filePath: fp, cwd } = body as { filePath?: string; cwd?: string }
    if (!fp) return { error: 'No path provided' }
    // resolveWorkspaceRoot throws WorkspaceError(400) on missing/unknown cwd.
    const root = resolveWorkspaceRoot(cwd)

    const resolved = path.resolve(fp)

    if (!isPathUnderRoot(resolved, root)) {
      throw new WorkspaceError('Access denied — path outside workspace root', 403)
    }

    if (!existsSync(resolved) || statSync(resolved).isDirectory()) {
      return { error: 'File not found' }
    }

    const stat = statSync(resolved)
    if (stat.size > MAX_FILE_READ_BYTES) {
      return { error: `File too large (${(stat.size / 1024 / 1024).toFixed(1)}MB). Max: 1MB.` }
    }

    const content = readFileSync(resolved, 'utf8')
    const ext = path.extname(resolved).toLowerCase()
    return { content, path: resolved, ext }
  })
}

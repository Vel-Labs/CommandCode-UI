import { existsSync, realpathSync } from 'node:fs'
import path from 'node:path'

export function resolveBoundaryPath(targetPath: string): string {
  const resolved = path.resolve(targetPath)
  try {
    return realpathSync(resolved)
  } catch {
    let current = resolved
    const missingParts: string[] = []

    while (!existsSync(current)) {
      const parent = path.dirname(current)
      if (parent === current) return resolved
      missingParts.unshift(path.basename(current))
      current = parent
    }

    try {
      return path.join(realpathSync(current), ...missingParts)
    } catch {
      return resolved
    }
  }
}

export function isPathUnderRoot(targetPath: string, root: string): boolean {
  const realTarget = resolveBoundaryPath(targetPath)
  const realRoot = resolveBoundaryPath(root)
  const relative = path.relative(realRoot, realTarget)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

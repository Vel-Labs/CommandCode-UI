import { existsSync } from 'node:fs'
import path from 'node:path'
import { isPathUnderRoot } from '../shared/pathContainment'

export function allowedCorsOrigin(origin: string | undefined, devMode: boolean): string {
  if (!origin) return devMode ? '*' : 'null'
  try {
    const parsed = new URL(origin)
    const isLoopback = ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsed.hostname)
    if (parsed.protocol === 'http:' && isLoopback) return origin
  } catch {
    return 'null'
  }
  return 'null'
}

export function staticAssetPath(staticDir: string | undefined, pathname: string): string | undefined {
  if (!staticDir) return undefined

  let decodedPath: string
  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    return undefined
  }

  if (decodedPath.includes('\0')) return undefined
  const targetPath = decodedPath === '/' || decodedPath === '/status' ? '/index.html' : decodedPath
  const requestPath = targetPath.replace(/^\/+/, '')
  const requestedFile = path.resolve(staticDir, requestPath)
  if (!isPathUnderRoot(requestedFile, staticDir)) return undefined
  if (existsSync(requestedFile)) return requestedFile

  const indexPath = path.resolve(staticDir, 'index.html')
  if (isPathUnderRoot(indexPath, staticDir) && existsSync(indexPath)) return indexPath
  return undefined
}

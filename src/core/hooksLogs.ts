import type { HookScope } from './hooksConfig'

export type HookLogEntry = {
  sourceScope: HookScope
  path: string
  name: string
  ext: string
  sizeBytes: number
  updatedAt: string
}

export type HookLogSourceResult = {
  sourceScope: HookScope
  dir: string
  exists: boolean
  logs: HookLogEntry[]
  errors: string[]
}

export type HookLogDiscoveryResult = {
  sources: HookLogSourceResult[]
  logs: HookLogEntry[]
  errors: string[]
}

export type HookLogReadResult = {
  ok: boolean
  sourceScope?: HookScope
  path?: string
  ext?: string
  sizeBytes?: number
  content?: string
  error?: string
}

export const hookLogExtensions = new Set(['.log', '.jsonl', '.txt', '.ansi'])

export function isHookLogFileName(name: string): boolean {
  return hookLogExtensions.has(extensionOf(name))
}

export function extensionOf(name: string): string {
  const lastDot = name.lastIndexOf('.')
  return lastDot >= 0 ? name.slice(lastDot).toLowerCase() : ''
}

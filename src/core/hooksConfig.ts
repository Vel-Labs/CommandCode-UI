export const documentedHookEvents = ['PreToolUse', 'PostToolUse', 'Stop'] as const

export type HookEvent = (typeof documentedHookEvents)[number] | string
export type HookScope = 'user' | 'project'

export type ParsedHookCommand = {
  event: HookEvent
  matcher?: string
  command: string
  type: string
  timeoutSeconds?: number
  enabled: boolean
  canBlock: boolean
  order: number
  sourceScope: HookScope
  sourcePath: string
  raw: unknown
}

export type HookConfigParseResult = {
  ok: boolean
  sourceScope: HookScope
  sourcePath: string
  hooks: ParsedHookCommand[]
  warnings: string[]
  errors: string[]
}

export type HookConfigSourceResult = HookConfigParseResult & {
  exists: boolean
  sizeBytes?: number
  updatedAt?: string
}

export type HookConfigDiscoveryResult = {
  sources: HookConfigSourceResult[]
  hooks: ParsedHookCommand[]
  warnings: string[]
  errors: string[]
}

export type MergedHookConfig = {
  hooks: ParsedHookCommand[]
  warnings: string[]
  errors: string[]
}

export type HookConfigEditResult = {
  ok: boolean
  content?: string
  error?: string
}

export function parseHookSettingsJson(raw: string, sourceScope: HookScope, sourcePath: string): HookConfigParseResult {
  const warnings: string[] = []
  const errors: string[] = []
  const hooks: ParsedHookCommand[] = []

  let parsed: unknown
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {}
  } catch (error) {
    return {
      ok: false,
      sourceScope,
      sourcePath,
      hooks,
      warnings,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`]
    }
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      sourceScope,
      sourcePath,
      hooks,
      warnings,
      errors: ['settings.json must contain a JSON object']
    }
  }

  if (parsed.hooks === undefined) {
    return { ok: true, sourceScope, sourcePath, hooks, warnings, errors }
  }

  if (!isRecord(parsed.hooks)) {
    return {
      ok: false,
      sourceScope,
      sourcePath,
      hooks,
      warnings,
      errors: ['hooks must be an object keyed by hook event']
    }
  }

  let order = 0
  for (const [event, eventEntries] of Object.entries(parsed.hooks)) {
    if (!documentedHookEvents.includes(event as (typeof documentedHookEvents)[number])) {
      warnings.push(`Unsupported hook event "${event}" in ${sourcePath}`)
    }

    if (!Array.isArray(eventEntries)) {
      errors.push(`hooks.${event} must be an array`)
      continue
    }

    for (const entry of eventEntries) {
      const commands = normalizeHookEntry(entry, event, sourcePath, errors)
      for (const command of commands) {
        hooks.push({
          ...command,
          event,
          order: order++,
          sourceScope,
          sourcePath,
          canBlock: event === 'PreToolUse',
          raw: command.raw
        })
      }
    }
  }

  return { ok: errors.length === 0, sourceScope, sourcePath, hooks, warnings, errors }
}

export function mergeHookConfigs(user: HookConfigParseResult, project: HookConfigParseResult): MergedHookConfig {
  return {
    hooks: [...project.hooks, ...user.hooks],
    warnings: [...project.warnings, ...user.warnings],
    errors: [...project.errors, ...user.errors]
  }
}

export function setHookCommandEnabled(raw: string, event: HookEvent, command: string, enabled: boolean): HookConfigEditResult {
  let parsed: unknown
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {}
  } catch (error) {
    return { ok: false, error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}` }
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: 'settings.json must contain a JSON object' }
  }

  if (!isRecord(parsed.hooks)) {
    return { ok: false, error: 'hooks must be an object keyed by hook event' }
  }

  const eventEntries = parsed.hooks[event]
  if (!Array.isArray(eventEntries)) {
    return { ok: false, error: `hooks.${event} must be an array` }
  }

  const targetCommand = command.trim()
  if (!targetCommand) {
    return { ok: false, error: 'Missing hook command' }
  }

  for (const entry of eventEntries) {
    if (!isRecord(entry)) continue
    if (Array.isArray(entry.hooks)) {
      const match = entry.hooks.find((hook) => isRecord(hook) && hook.command === targetCommand)
      if (isRecord(match)) {
        match.enabled = enabled
        return { ok: true, content: `${JSON.stringify(parsed, null, 2)}\n` }
      }
    } else if (entry.command === targetCommand) {
      entry.enabled = enabled
      return { ok: true, content: `${JSON.stringify(parsed, null, 2)}\n` }
    }
  }

  return { ok: false, error: `Hook command not found for ${event}` }
}

function normalizeHookEntry(
  entry: unknown,
  event: string,
  sourcePath: string,
  errors: string[]
): Array<Omit<ParsedHookCommand, 'event' | 'order' | 'sourceScope' | 'sourcePath' | 'canBlock'>> {
  if (!isRecord(entry)) {
    errors.push(`hooks.${event} entries must be objects`)
    return []
  }

  if (Array.isArray(entry.hooks)) {
    return entry.hooks.flatMap((hook) => normalizeHookCommand(hook, event, sourcePath, errors, stringValue(entry.matcher)))
  }

  return normalizeHookCommand(entry, event, sourcePath, errors, stringValue(entry.matcher))
}

function normalizeHookCommand(
  hook: unknown,
  event: string,
  sourcePath: string,
  errors: string[],
  matcher?: string
): Array<Omit<ParsedHookCommand, 'event' | 'order' | 'sourceScope' | 'sourcePath' | 'canBlock'>> {
  if (!isRecord(hook)) {
    errors.push(`hooks.${event}.hooks entries must be objects`)
    return []
  }

  const command = stringValue(hook.command)
  if (!command) {
    errors.push(`hooks.${event} command hook in ${sourcePath} is missing command`)
    return []
  }

  return [{
    matcher,
    command,
    type: stringValue(hook.type) || 'command',
    timeoutSeconds: numberValue(hook.timeoutSeconds ?? hook.timeout),
    enabled: hook.enabled !== false,
    raw: hook
  }]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

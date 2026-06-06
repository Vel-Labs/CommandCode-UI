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

export type HookCommandUpdate = {
  command?: string
  matcher?: string
  timeoutSeconds?: number | null
}

export type HookConfigTogglePreviewResult = HookConfigEditResult & {
  sourceScope?: HookScope
  sourcePath?: string
  event?: HookEvent
  command?: string
  enabled?: boolean
}

export type HookConfigEditPreviewResult = HookConfigEditResult & {
  sourceScope?: HookScope
  sourcePath?: string
  event?: HookEvent
  command?: string
  action?: 'update' | 'remove'
  update?: HookCommandUpdate
}

export type HookConfigToggleApplyResult = HookConfigTogglePreviewResult & {
  backupPath?: string
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
  const prepared = prepareEditableHookConfig(raw, event, command)
  if (!prepared.ok) return prepared

  prepared.match.hook.enabled = enabled
  return { ok: true, content: formatEditableHookConfig(prepared.parsed) }
}

export function updateHookCommand(raw: string, event: HookEvent, command: string, update: HookCommandUpdate): HookConfigEditResult {
  const prepared = prepareEditableHookConfig(raw, event, command)
  if (!prepared.ok) return prepared

  if (update.command !== undefined) {
    const nextCommand = update.command.trim()
    if (!nextCommand) return { ok: false, error: 'Missing replacement hook command' }
    prepared.match.hook.command = nextCommand
  }

  if (update.timeoutSeconds !== undefined) {
    if (update.timeoutSeconds === null) {
      delete prepared.match.hook.timeout
      delete prepared.match.hook.timeoutSeconds
    } else {
      if (!Number.isFinite(update.timeoutSeconds) || update.timeoutSeconds < 0) {
        return { ok: false, error: 'Hook timeout must be a non-negative number' }
      }
      prepared.match.hook.timeoutSeconds = update.timeoutSeconds
      delete prepared.match.hook.timeout
    }
  }

  if (update.matcher !== undefined) {
    const nextMatcher = update.matcher.trim()
    if (prepared.match.parent) {
      if (prepared.match.siblings.length > 1) {
        return { ok: false, error: 'Cannot change matcher for grouped hook with multiple commands' }
      }
      if (nextMatcher) {
        prepared.match.parent.matcher = nextMatcher
      } else {
        delete prepared.match.parent.matcher
      }
    } else if (nextMatcher) {
      prepared.match.hook.matcher = nextMatcher
    } else {
      delete prepared.match.hook.matcher
    }
  }

  return { ok: true, content: formatEditableHookConfig(prepared.parsed) }
}

export function removeHookCommand(raw: string, event: HookEvent, command: string): HookConfigEditResult {
  const prepared = prepareEditableHookConfig(raw, event, command)
  if (!prepared.ok) return prepared

  if (prepared.match.parent) {
    prepared.match.siblings.splice(prepared.match.index, 1)
    if (prepared.match.siblings.length === 0) {
      prepared.eventEntries.splice(prepared.match.entryIndex, 1)
    }
  } else {
    prepared.eventEntries.splice(prepared.match.entryIndex, 1)
  }

  return { ok: true, content: formatEditableHookConfig(prepared.parsed) }
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

type EditableHookMatch = {
  hook: Record<string, unknown>
  entryIndex: number
  index: number
  siblings: unknown[]
  parent?: Record<string, unknown>
}

type EditableHookConfigPrepared = {
  ok: true
  parsed: Record<string, unknown>
  eventEntries: unknown[]
  match: EditableHookMatch
} | {
  ok: false
  error: string
}

function prepareEditableHookConfig(raw: string, event: HookEvent, command: string): EditableHookConfigPrepared {
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

  for (const [entryIndex, entry] of eventEntries.entries()) {
    if (!isRecord(entry)) continue
    if (Array.isArray(entry.hooks)) {
      for (const [index, hook] of entry.hooks.entries()) {
        if (isRecord(hook) && hook.command === targetCommand) {
          return {
            ok: true,
            parsed,
            eventEntries,
            match: { hook, parent: entry, siblings: entry.hooks, entryIndex, index }
          }
        }
      }
    } else if (entry.command === targetCommand) {
      return {
        ok: true,
        parsed,
        eventEntries,
        match: { hook: entry, siblings: eventEntries, entryIndex, index: entryIndex }
      }
    }
  }

  return { ok: false, error: `Hook command not found for ${event}` }
}

function formatEditableHookConfig(parsed: Record<string, unknown>): string {
  return `${JSON.stringify(parsed, null, 2)}\n`
}

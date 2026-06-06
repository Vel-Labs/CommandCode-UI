import type { HookEvent, HookScope, ParsedHookCommand } from './hooksConfig'
import { buildHookPayloadPreview } from './hooksPayload'

export type HookDryRunRequest = {
  cwd?: string
  sourceScope: HookScope
  event: HookEvent
  command: string
  matcher?: string
  enabled?: boolean
  toolName?: string
  permissionMode?: string
}

export type HookDryRunResult = {
  ok: boolean
  willRun: boolean
  reason: string
  sourceScope?: HookScope
  event?: HookEvent
  command?: string
  matcher?: string
  toolName?: string
  payloadJson?: string
  execution?: 'not-run'
  error?: string
}

export function buildHookDryRun(request: HookDryRunRequest): HookDryRunResult {
  if (request.sourceScope !== 'project' && request.sourceScope !== 'user') {
    return {
      ok: false,
      willRun: false,
      reason: 'sourceScope must be project or user',
      error: 'sourceScope must be project or user',
      execution: 'not-run'
    }
  }

  const command = typeof request.command === 'string' ? request.command.trim() : ''
  if (!command) {
    return {
      ok: false,
      willRun: false,
      reason: 'Missing hook command',
      error: 'Missing hook command',
      execution: 'not-run'
    }
  }

  const toolName = normalizeToolName(request)
  const event = typeof request.event === 'string' && request.event.trim() ? request.event.trim() : 'Stop'
  const matcher = typeof request.matcher === 'string' ? request.matcher.trim() : undefined
  const payload = buildHookPayloadPreview({
    event,
    cwd: request.cwd || '<project>',
    command,
    matcher: toolName || matcher,
    permissionMode: request.permissionMode
  })
  const matcherApplies = event === 'Stop' || matcherMatchesTool(matcher, toolName)
  const enabled = request.enabled !== false
  const willRun = enabled && matcherApplies
  const reason = dryRunReason({ enabled, matcher, matcherApplies, toolName })

  return {
    ok: true,
    willRun,
    reason,
    sourceScope: request.sourceScope,
    event,
    command,
    matcher,
    toolName,
    payloadJson: payload.payloadJson,
    execution: 'not-run'
  }
}

export function buildHookDryRunFromParsedHook(
  hook: ParsedHookCommand,
  options: Pick<HookDryRunRequest, 'cwd' | 'toolName' | 'permissionMode'> = {}
): HookDryRunResult {
  return buildHookDryRun({
    cwd: options.cwd,
    sourceScope: hook.sourceScope,
    event: hook.event,
    command: hook.command,
    matcher: hook.matcher,
    enabled: hook.enabled,
    toolName: options.toolName,
    permissionMode: options.permissionMode
  })
}

function normalizeToolName(request: HookDryRunRequest): string | undefined {
  const explicit = request.toolName?.trim()
  if (explicit) return explicit
  if (request.event === 'PreToolUse' || request.event === 'PostToolUse') {
    return request.matcher?.split('|')[0]?.trim() || 'Bash'
  }
  return undefined
}

function matcherMatchesTool(matcher: string | undefined, toolName: string | undefined): boolean {
  if (!matcher) return true
  if (!toolName) return false
  const parts = matcher.split('|').map((part) => part.trim().toLowerCase()).filter(Boolean)
  if (parts.length === 0) return true
  return parts.includes(toolName.trim().toLowerCase())
}

function dryRunReason({
  enabled,
  matcher,
  matcherApplies,
  toolName
}: {
  enabled: boolean
  matcher?: string
  matcherApplies: boolean
  toolName?: string
}): string {
  if (!enabled) return 'Hook is disabled; Command Code would not run this hook.'
  if (!matcherApplies) return `Matcher "${matcher}" does not match sample tool "${toolName || '<none>'}".`
  return 'Dry-run only: the GUI built a sample payload and did not execute the hook command.'
}

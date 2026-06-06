import type { HookEvent } from './hooksConfig'

export type HookPayloadPreviewOptions = {
  event: HookEvent
  cwd: string
  command?: string
  matcher?: string
  permissionMode?: string
}

export type HookPayloadPreview = {
  description: string
  payloadJson: string
}

export function buildHookPayloadPreview(options: HookPayloadPreviewOptions): HookPayloadPreview {
  const event = options.event || 'Stop'
  const matcher = options.matcher?.trim()
  const payload: Record<string, unknown> = {
    hook_event_name: event,
    session_id: 'ccgui-dry-run-session',
    transcript_path: '<dry-run-transcript.jsonl>',
    cwd: options.cwd || '<project>',
    permission_mode: options.permissionMode || 'standard',
    ccgui_dry_run: true
  }

  if (event === 'PreToolUse' || event === 'PostToolUse') {
    payload.tool_name = matcher || 'Bash'
    payload.tool_input = sampleToolInput(matcher)
  }

  if (event === 'Stop') {
    payload.stop_reason = 'dry-run'
  }

  if (options.command?.trim()) {
    payload.ccgui_preview_command = options.command.trim()
  }

  return {
    description: `${event} dry-run payload${matcher ? ` for ${matcher}` : ''}`,
    payloadJson: `${JSON.stringify(payload, null, 2)}\n`
  }
}

function sampleToolInput(matcher?: string): Record<string, unknown> {
  const normalized = matcher?.toLowerCase() || ''
  if (normalized.includes('read')) return { file_path: '<path-to-read>' }
  if (normalized.includes('write')) return { file_path: '<path-to-write>', content: '<new-content>' }
  if (normalized.includes('edit')) return { file_path: '<path-to-edit>', old_string: '<old>', new_string: '<new>' }
  return { command: 'echo dry-run' }
}

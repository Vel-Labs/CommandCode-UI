import { describe, expect, it } from 'vitest'
import { buildHookPayloadPreview } from '../src/core/hooksPayload'

describe('hook payload preview', () => {
  it('builds a Stop dry-run payload without starting a session', () => {
    const preview = buildHookPayloadPreview({
      event: 'Stop',
      cwd: '/repo',
      command: 'command-code-bonk --sound done',
      permissionMode: 'plan'
    })
    const payload = JSON.parse(preview.payloadJson)

    expect(preview.description).toBe('Stop dry-run payload')
    expect(payload).toMatchObject({
      hook_event_name: 'Stop',
      session_id: 'ccgui-dry-run-session',
      transcript_path: '<dry-run-transcript.jsonl>',
      cwd: '/repo',
      permission_mode: 'plan',
      ccgui_dry_run: true,
      stop_reason: 'dry-run',
      ccgui_preview_command: 'command-code-bonk --sound done'
    })
    expect(payload.tool_input).toBeUndefined()
  })

  it('builds tool payload samples from matchers', () => {
    const read = JSON.parse(buildHookPayloadPreview({
      event: 'PreToolUse',
      cwd: '/repo',
      matcher: 'Read'
    }).payloadJson)
    const edit = JSON.parse(buildHookPayloadPreview({
      event: 'PostToolUse',
      cwd: '/repo',
      matcher: 'Edit'
    }).payloadJson)

    expect(read).toMatchObject({
      hook_event_name: 'PreToolUse',
      tool_name: 'Read',
      tool_input: { file_path: '<path-to-read>' },
      ccgui_dry_run: true
    })
    expect(edit).toMatchObject({
      hook_event_name: 'PostToolUse',
      tool_name: 'Edit',
      tool_input: { file_path: '<path-to-edit>', old_string: '<old>', new_string: '<new>' },
      ccgui_dry_run: true
    })
  })

  it('falls back to a shell-style sample for broad or missing matchers', () => {
    const payload = JSON.parse(buildHookPayloadPreview({
      event: 'PreToolUse',
      cwd: '/repo'
    }).payloadJson)

    expect(payload).toMatchObject({
      tool_name: 'Bash',
      tool_input: { command: 'echo dry-run' },
      ccgui_dry_run: true
    })
  })
})

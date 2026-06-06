import { describe, expect, it } from 'vitest'
import { buildHookDryRun, buildHookDryRunFromParsedHook } from '../src/core/hooksDryRun'
import type { ParsedHookCommand } from '../src/core/hooksConfig'

describe('hooks dry-run helper', () => {
  it('builds a non-executing payload for an enabled matching hook', () => {
    const result = buildHookDryRun({
      cwd: '/repo',
      sourceScope: 'project',
      event: 'PreToolUse',
      command: 'node scripts/block-shell.js',
      matcher: 'Bash|Shell',
      toolName: 'Bash'
    })

    expect(result).toMatchObject({
      ok: true,
      willRun: true,
      execution: 'not-run',
      sourceScope: 'project',
      event: 'PreToolUse',
      command: 'node scripts/block-shell.js',
      matcher: 'Bash|Shell',
      toolName: 'Bash'
    })
    expect(result.reason).toContain('did not execute')
    expect(JSON.parse(result.payloadJson || '{}')).toMatchObject({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      ccgui_preview_command: 'node scripts/block-shell.js',
      ccgui_dry_run: true
    })
  })

  it('marks disabled hooks as skipped without executing', () => {
    const result = buildHookDryRun({
      cwd: '/repo',
      sourceScope: 'user',
      event: 'Stop',
      command: 'command-code-bonk --sound done',
      enabled: false
    })

    expect(result).toMatchObject({
      ok: true,
      willRun: false,
      execution: 'not-run'
    })
    expect(result.reason).toContain('disabled')
  })

  it('marks matcher mismatches as skipped', () => {
    const result = buildHookDryRun({
      cwd: '/repo',
      sourceScope: 'project',
      event: 'PostToolUse',
      command: 'node scripts/audit-write.js',
      matcher: 'Write|Edit',
      toolName: 'Read'
    })

    expect(result).toMatchObject({
      ok: true,
      willRun: false,
      execution: 'not-run',
      toolName: 'Read'
    })
    expect(result.reason).toContain('does not match')
  })

  it('fails closed for invalid scope or missing command', () => {
    expect(buildHookDryRun({
      cwd: '/repo',
      sourceScope: 'other' as 'project',
      event: 'Stop',
      command: 'echo done'
    })).toMatchObject({
      ok: false,
      willRun: false,
      execution: 'not-run',
      error: 'sourceScope must be project or user'
    })

    expect(buildHookDryRun({
      cwd: '/repo',
      sourceScope: 'project',
      event: 'Stop',
      command: ''
    })).toMatchObject({
      ok: false,
      willRun: false,
      execution: 'not-run',
      error: 'Missing hook command'
    })
  })

  it('accepts parsed hook commands as input', () => {
    const hook: ParsedHookCommand = {
      event: 'Stop',
      command: 'echo done',
      type: 'command',
      enabled: true,
      canBlock: false,
      order: 0,
      sourceScope: 'project',
      sourcePath: '/repo/.commandcode/settings.json',
      raw: {}
    }

    const result = buildHookDryRunFromParsedHook(hook, { cwd: '/repo' })

    expect(result).toMatchObject({
      ok: true,
      willRun: true,
      execution: 'not-run',
      event: 'Stop',
      command: 'echo done'
    })
    expect(JSON.parse(result.payloadJson || '{}')).toMatchObject({
      hook_event_name: 'Stop',
      stop_reason: 'dry-run'
    })
  })
})

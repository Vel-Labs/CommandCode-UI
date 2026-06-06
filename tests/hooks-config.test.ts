import { describe, expect, it } from 'vitest'
import { mergeHookConfigs, parseHookSettingsJson } from '../src/core/hooksConfig'

describe('hooks config parser', () => {
  it('accepts empty settings without hooks', () => {
    const result = parseHookSettingsJson('{}', 'project', '/repo/.commandcode/settings.json')

    expect(result.ok).toBe(true)
    expect(result.hooks).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('parses documented command hooks with matcher, timeout, enabled state, and blocking behavior', () => {
    const result = parseHookSettingsJson(JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [
              { type: 'command', command: 'node scripts/check-shell.js', timeout: 10 },
              { type: 'command', command: 'node scripts/disabled.js', enabled: false }
            ]
          }
        ],
        Stop: [
          {
            hooks: [
              { type: 'command', command: 'command-code-bonk --sound done' }
            ]
          }
        ]
      }
    }), 'project', '/repo/.commandcode/settings.json')

    expect(result.ok).toBe(true)
    expect(result.hooks).toHaveLength(3)
    expect(result.hooks[0]).toMatchObject({
      event: 'PreToolUse',
      matcher: 'Bash',
      command: 'node scripts/check-shell.js',
      timeoutSeconds: 10,
      enabled: true,
      canBlock: true,
      order: 0,
      sourceScope: 'project'
    })
    expect(result.hooks[1]).toMatchObject({ enabled: false, canBlock: true, order: 1 })
    expect(result.hooks[2]).toMatchObject({
      event: 'Stop',
      command: 'command-code-bonk --sound done',
      canBlock: false,
      order: 2
    })
  })

  it('supports direct command entries under an event array', () => {
    const result = parseHookSettingsJson(JSON.stringify({
      hooks: {
        PostToolUse: [
          { type: 'command', command: 'node scripts/audit-write.js', matcher: 'Write' }
        ]
      }
    }), 'user', '/Users/me/.commandcode/settings.json')

    expect(result.ok).toBe(true)
    expect(result.hooks).toEqual([
      expect.objectContaining({
        event: 'PostToolUse',
        matcher: 'Write',
        command: 'node scripts/audit-write.js',
        sourceScope: 'user'
      })
    ])
  })

  it('rejects invalid JSON and invalid hooks shapes before writes', () => {
    expect(parseHookSettingsJson('{ nope', 'project', '/repo/.commandcode/settings.json')).toMatchObject({
      ok: false,
      hooks: []
    })

    const invalidHooks = parseHookSettingsJson(JSON.stringify({ hooks: [] }), 'project', '/repo/.commandcode/settings.json')
    expect(invalidHooks.ok).toBe(false)
    expect(invalidHooks.errors).toContain('hooks must be an object keyed by hook event')

    const missingCommand = parseHookSettingsJson(JSON.stringify({
      hooks: { Stop: [{ hooks: [{ type: 'command' }] }] }
    }), 'project', '/repo/.commandcode/settings.json')
    expect(missingCommand.ok).toBe(false)
    expect(missingCommand.errors[0]).toContain('missing command')
  })

  it('warns on unknown events while preserving parsed commands for diagnostics', () => {
    const result = parseHookSettingsJson(JSON.stringify({
      hooks: {
        FutureEvent: [{ type: 'command', command: 'echo future' }]
      }
    }), 'project', '/repo/.commandcode/settings.json')

    expect(result.ok).toBe(true)
    expect(result.warnings).toEqual(['Unsupported hook event "FutureEvent" in /repo/.commandcode/settings.json'])
    expect(result.hooks[0]).toMatchObject({ event: 'FutureEvent', command: 'echo future' })
  })

  it('merges project hooks before user hooks to reflect documented project precedence', () => {
    const user = parseHookSettingsJson(JSON.stringify({
      hooks: { Stop: [{ type: 'command', command: 'echo user' }] }
    }), 'user', '/Users/me/.commandcode/settings.json')
    const project = parseHookSettingsJson(JSON.stringify({
      hooks: { Stop: [{ type: 'command', command: 'echo project' }] }
    }), 'project', '/repo/.commandcode/settings.json')

    expect(mergeHookConfigs(user, project).hooks.map((hook) => hook.command)).toEqual(['echo project', 'echo user'])
  })
})

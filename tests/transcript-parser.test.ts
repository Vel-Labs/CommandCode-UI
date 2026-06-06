import { describe, expect, it } from 'vitest'
import { parseTranscriptJsonl } from '../src/core/transcriptParser'

describe('parseTranscriptJsonl', () => {
  it('parses user, assistant, tool, error, and unknown transcript entries', () => {
    const parsed = parseTranscriptJsonl([
      JSON.stringify({ id: 'u1', role: 'user', content: 'Fix the tests', timestamp: '2026-06-06T10:00:00.000Z' }),
      JSON.stringify({ id: 'a1', role: 'assistant', content: [{ type: 'text', text: 'I will inspect the failure.' }] }),
      JSON.stringify({ id: 't1', type: 'tool_call', tool_name: 'exec_command', content: { input: 'npm test' } }),
      JSON.stringify({ id: 'e1', type: 'error', error: 'Command failed' }),
      JSON.stringify({ id: 'x1', type: 'checkpoint', payload: { durable: true } })
    ].join('\n'))

    expect(parsed.counts).toEqual({
      user: 1,
      assistant: 1,
      tool: 1,
      error: 1,
      event: 0,
      unknown: 1
    })
    expect(parsed.entries.map((entry) => entry.kind)).toEqual(['user', 'assistant', 'tool', 'error', 'unknown'])
    expect(parsed.entries[0]).toMatchObject({
      id: 'u1',
      line: 1,
      label: 'User',
      text: 'Fix the tests',
      timestamp: '2026-06-06T10:00:00.000Z'
    })
    expect(parsed.entries[1]).toMatchObject({
      label: 'Assistant',
      text: 'I will inspect the failure.'
    })
    expect(parsed.entries[2]).toMatchObject({
      label: 'Tool: exec_command',
      text: 'npm test'
    })
    expect(parsed.entries[3]).toMatchObject({
      label: 'Error',
      text: 'Command failed'
    })
    expect(parsed.entries[4]).toMatchObject({
      label: 'Unknown: checkpoint',
      text: ''
    })
  })

  it('keeps hook and session lifecycle events distinct from tool entries', () => {
    const parsed = parseTranscriptJsonl([
      JSON.stringify({ type: 'hook', event: 'PostToolUse', message: 'Hook finished' }),
      JSON.stringify({ type: 'system', content: 'Session completed' })
    ].join('\n'))

    expect(parsed.counts.event).toBe(2)
    expect(parsed.entries.map((entry) => entry.label)).toEqual(['Event: PostToolUse', 'Event: system'])
    expect(parsed.entries.map((entry) => entry.text)).toEqual(['Hook finished', 'Session completed'])
  })

  it('records invalid JSONL lines as parser errors without dropping surrounding entries', () => {
    const parsed = parseTranscriptJsonl([
      JSON.stringify({ role: 'user', content: 'before' }),
      '{"role":"assistant",',
      JSON.stringify({ role: 'assistant', content: 'after' })
    ].join('\n'))

    expect(parsed.counts.error).toBe(1)
    expect(parsed.entries).toHaveLength(3)
    expect(parsed.entries[1]).toMatchObject({
      line: 2,
      kind: 'error',
      label: 'Parse error',
      raw: '{"role":"assistant",'
    })
    expect(parsed.entries[2]).toMatchObject({
      line: 3,
      kind: 'assistant',
      text: 'after'
    })
  })

  it('ignores blank lines and creates stable line-based ids when missing', () => {
    const parsed = parseTranscriptJsonl('\n{"role":"user","content":"hello"}\n\n')

    expect(parsed.entries).toHaveLength(1)
    expect(parsed.entries[0]).toMatchObject({
      id: 'line-2',
      line: 2,
      kind: 'user',
      text: 'hello'
    })
  })
})

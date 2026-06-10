import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { projectCommandCodeTranscriptJsonl } from '../src/core/nativeConversationProjector'

function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/native-conversation/${name}.jsonl`, import.meta.url), 'utf8')
}

describe('projectCommandCodeTranscriptJsonl', () => {
  it.each([
    ['f8f3b448-b607-4ba6-bbbd-36479c8a6357', 'This is **Command Code GUI**'],
    ['8e368167-93c1-47fa-a1a7-0f2c36c2ad13', 'helps the Command Code community'],
    ['3be8341f-2d6f-44f1-8039-8df8eeb2ef5f', 'highest-impact improvements']
  ])('projects clean assistant text from %s', (name, expectedText) => {
    const events = projectCommandCodeTranscriptJsonl(fixture(name))
    const assistantText = events
      .filter((event) => event.kind === 'assistant_message')
      .map((event) => event.text)
      .join('\n')

    expect(assistantText).toContain(expectedText)
    expect(assistantText).not.toMatch(/\[38|\[39m|Ask your question|to interrupt|esc to interrupt|↓ 76|\bTE\b|\bm63\b/)
  })

  it('keeps reasoning and tool rows as non-prose events', () => {
    const events = projectCommandCodeTranscriptJsonl(fixture('3be8341f-2d6f-44f1-8039-8df8eeb2ef5f'))

    expect(events.filter((event) => event.kind === 'activity').map((event) => event.text)).toEqual([
      'Activity: explore 1',
      'Activity: explore 1',
      'Activity: read_file 1',
      'Activity: read_file 1',
      'Activity: plan 1',
      'Activity: plan 1'
    ])
    expect(events.filter((event) => event.kind === 'thinking').map((event) => event.text)).toEqual([
      'Reasoning available',
      'Reasoning available'
    ])
    expect(events.filter((event) => event.kind === 'assistant_message').map((event) => event.text)).toEqual([
      'Excellent exploration results. Let me synthesize the findings with the taste preferences to identify actionable QoL improvements.',
      'The highest-impact improvements are: clean up dead code, make readiness states explicit, add browser/Electron receipts, and keep the terminal as a diagnostic fallback rather than the primary chat view.'
    ])
  })

  it('does not promote terminal-looking fragments from non-text parts', () => {
    const events = projectCommandCodeTranscriptJsonl([
      JSON.stringify({
        id: 'u1',
        role: 'user',
        content: [{ type: 'text', text: 'status' }]
      }),
      JSON.stringify({
        id: 'a1',
        role: 'assistant',
        content: [
          { type: 'reasoning', text: '[38;2;9✻ Thinking... to interrupt • 47s • ↓ 76' },
          { type: 'tool-call', toolName: 'explore', input: { messages: [{ content: 'TE m63 Ask your question...' }] } }
        ]
      }),
      JSON.stringify({
        id: 't1',
        role: 'tool',
        content: [{ type: 'tool-result', toolName: 'explore', output: { type: 'text', value: '[39m129' } }]
      }),
      JSON.stringify({
        id: 'a2',
        role: 'assistant',
        content: [{ type: 'text', text: 'Clean final answer.' }]
      })
    ].join('\n'))

    expect(events.filter((event) => event.kind === 'assistant_message')).toEqual([
      { id: 'a2:assistant', kind: 'assistant_message', text: 'Clean final answer.' }
    ])
  })
})

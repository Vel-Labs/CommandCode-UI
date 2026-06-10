import { describe, expect, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { commandCodeProjectSlug, matchTranscriptForPrompt } from '../src/core/nativeTranscriptBinding'

function writeTranscript(baseDir: string, cwd: string, id: string, rows: unknown[]): string {
  const dir = path.join(baseDir, 'projects', commandCodeProjectSlug(cwd))
  mkdirSync(dir, { recursive: true })
  const transcriptPath = path.join(dir, `${id}.jsonl`)
  writeFileSync(transcriptPath, rows.map((row) => JSON.stringify(row)).join('\n'), 'utf8')
  return transcriptPath
}

describe('native transcript binding', () => {
  it('matches a prompt to the unambiguous Command Code JSONL transcript', () => {
    const baseDir = path.join(os.tmpdir(), `ccgui-binding-${Date.now()}-one`)
    const cwd = '/Users/steven/Workspace/40_Code/projects/command-code-gui'
    const submittedAtMs = Date.parse('2026-06-09T03:45:22.000Z')
    const transcriptPath = writeTranscript(baseDir, cwd, 'session-a', [
      {
        id: 'u1',
        timestamp: '2026-06-09T03:45:22.510Z',
        role: 'user',
        content: [{ type: 'text', text: 'what is this project repo about?' }]
      }
    ])

    expect(matchTranscriptForPrompt({
      baseDir,
      cwd,
      prompt: 'what is this project repo about?',
      submittedAtMs
    })).toEqual({
      status: 'bound',
      candidates: [{
        sessionId: 'session-a',
        transcriptPath,
        mtimeMs: expect.any(Number),
        matchedPromptTimestamp: '2026-06-09T03:45:22.510Z'
      }],
      match: {
        sessionId: 'session-a',
        transcriptPath,
        mtimeMs: expect.any(Number),
        matchedPromptTimestamp: '2026-06-09T03:45:22.510Z'
      }
    })
  })

  it('returns ambiguous when identical prompts have no clear timestamp winner', () => {
    const baseDir = path.join(os.tmpdir(), `ccgui-binding-${Date.now()}-ambiguous`)
    const cwd = '/repo'
    const submittedAtMs = Date.parse('2026-06-09T03:45:22.000Z')
    writeTranscript(baseDir, cwd, 'session-a', [
      { id: 'u1', timestamp: '2026-06-09T03:45:22.100Z', role: 'user', content: [{ type: 'text', text: 'same prompt' }] }
    ])
    writeTranscript(baseDir, cwd, 'session-b', [
      { id: 'u2', timestamp: '2026-06-09T03:45:22.500Z', role: 'user', content: [{ type: 'text', text: 'same prompt' }] }
    ])

    const result = matchTranscriptForPrompt({ baseDir, cwd, prompt: 'same prompt', submittedAtMs })
    expect(result.status).toBe('ambiguous')
    expect(result.candidates.map((candidate) => candidate.sessionId).sort()).toEqual(['session-a', 'session-b'])
    expect(result.match).toBeUndefined()
  })

  it('returns unbound when no matching user row exists', () => {
    const baseDir = path.join(os.tmpdir(), `ccgui-binding-${Date.now()}-none`)
    const cwd = '/repo'
    writeTranscript(baseDir, cwd, 'session-a', [
      { id: 'u1', timestamp: '2026-06-09T03:45:22.100Z', role: 'user', content: [{ type: 'text', text: 'other prompt' }] }
    ])

    expect(matchTranscriptForPrompt({
      baseDir,
      cwd,
      prompt: 'same prompt',
      submittedAtMs: Date.parse('2026-06-09T03:45:22.000Z')
    })).toEqual({ status: 'unbound', candidates: [] })
  })
})

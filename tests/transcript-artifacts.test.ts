import { describe, expect, it } from 'vitest'
import { suggestTranscriptArtifacts } from '../src/renderer/src/services/transcriptArtifacts'

describe('suggestTranscriptArtifacts', () => {
  it('suggests relative and in-root absolute transcript artifacts for explicit user clicks', () => {
    const result = suggestTranscriptArtifacts(
      'Wrote docs/report.md and /workspace/app/out/index.html',
      '/workspace/app'
    )

    expect(result).toEqual({
      artifacts: [
        { raw: 'docs/report.md', path: '/workspace/app/docs/report.md', kind: 'markdown', exists: true },
        { raw: '/workspace/app/out/index.html', path: '/workspace/app/out/index.html', kind: 'html', exists: true }
      ],
      rejectedCount: 0
    })
  })

  it('rejects outside-root absolute paths and parent traversal before invoking file preview', () => {
    const result = suggestTranscriptArtifacts(
      'Ignore /etc/passwd.txt and ../secret.md, keep ./notes/todo.jsonl',
      '/workspace/app'
    )

    expect(result.artifacts).toEqual([
      { raw: './notes/todo.jsonl', path: '/workspace/app/notes/todo.jsonl', kind: 'json', exists: true }
    ])
    expect(result.rejectedCount).toBe(2)
  })
})

import { describe, expect, it } from 'vitest'
import type { GitEnvironmentStatus } from '../src/core/types'
import { gitEnvironmentDisplay } from '../src/renderer/src/services/gitEnvironmentDisplay'

const baseStatus: GitEnvironmentStatus = {
  ok: true,
  cwd: '/repo',
  root: '/repo',
  branch: 'main',
  ahead: 0,
  behind: 0,
  filesChanged: 0,
  insertions: 0,
  deletions: 0,
  added: 0,
  modified: 0,
  deleted: 0,
  untracked: 0,
  files: [],
  raw: ''
}

describe('git environment display', () => {
  it('labels a clean branch without implying unavailable state', () => {
    expect(gitEnvironmentDisplay(baseStatus)).toEqual({
      label: 'main',
      detail: 'clean',
      tone: 'good',
      title: 'Git main: clean'
    })
  })

  it('surfaces local and remote work as visible header detail', () => {
    expect(gitEnvironmentDisplay({
      ...baseStatus,
      branch: 'feature/status',
      ahead: 2,
      filesChanged: 3
    })).toMatchObject({
      label: 'feature/status',
      detail: '3 files · 2 ahead',
      tone: 'warn'
    })
  })

  it('keeps unavailable git status explicit', () => {
    expect(gitEnvironmentDisplay({
      ...baseStatus,
      ok: false,
      branch: undefined,
      error: 'Not a git repository'
    })).toMatchObject({
      label: 'git unavailable',
      detail: 'Not a git repository',
      tone: 'warn'
    })
  })
})

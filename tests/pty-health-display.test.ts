import { describe, expect, it } from 'vitest'
import type { PtyDoctorResult } from '../src/core/ptyDoctor'
import { ptyHealthDisplay } from '../src/renderer/src/services/ptyHealthDisplay'

const healthy: PtyDoctorResult = {
  healthy: true,
  shell: '/bin/zsh',
  output: 'ok',
  error: '',
  exitCode: 0,
  signal: null,
  available: true
}

describe('pty health display', () => {
  it('labels a healthy PTY without hiding the shell receipt', () => {
    expect(ptyHealthDisplay(healthy)).toEqual({
      label: 'PTY connected',
      detail: '/bin/zsh',
      tone: 'good',
      title: 'PTY healthy via /bin/zsh'
    })
  })

  it('keeps available-but-failing PTY state distinct from unavailable', () => {
    expect(ptyHealthDisplay({
      ...healthy,
      healthy: false,
      error: 'spawn failed',
      exitCode: null
    })).toMatchObject({
      label: 'PTY unhealthy',
      detail: 'spawn failed',
      tone: 'warn'
    })
  })

  it('surfaces unavailable node-pty as a hard failure', () => {
    expect(ptyHealthDisplay({
      healthy: false,
      shell: '',
      output: '',
      error: 'node-pty not installed',
      exitCode: null,
      signal: null,
      available: false
    })).toEqual({
      label: 'PTY unavailable',
      detail: 'node-pty not installed',
      tone: 'bad',
      title: 'node-pty not installed'
    })
  })
})

import type { PtyDoctorResult } from '../../../core/ptyDoctor'

export type PtyHealthDisplay = {
  label: string
  detail: string
  tone: 'default' | 'good' | 'warn' | 'bad'
  title: string
}

export function ptyHealthDisplay(ptyHealth: PtyDoctorResult | null): PtyHealthDisplay {
  if (!ptyHealth) {
    return {
      label: 'PTY checking',
      detail: 'doctor running',
      tone: 'default',
      title: 'Checking PTY availability'
    }
  }

  if (ptyHealth.healthy) {
    return {
      label: 'PTY connected',
      detail: ptyHealth.shell || 'shell ready',
      tone: 'good',
      title: `PTY healthy${ptyHealth.shell ? ` via ${ptyHealth.shell}` : ''}`
    }
  }

  if (ptyHealth.available) {
    const detail = ptyHealth.error || exitDetail(ptyHealth) || 'spawn failed'
    return {
      label: 'PTY unhealthy',
      detail,
      tone: 'warn',
      title: `PTY available but unhealthy: ${detail}`
    }
  }

  const detail = ptyHealth.error || 'node-pty unavailable'
  return {
    label: 'PTY unavailable',
    detail,
    tone: 'bad',
    title: detail
  }
}

function exitDetail(ptyHealth: PtyDoctorResult): string {
  if (ptyHealth.exitCode !== null) return `exit ${ptyHealth.exitCode}`
  if (ptyHealth.signal !== null) return `signal ${ptyHealth.signal}`
  return ''
}

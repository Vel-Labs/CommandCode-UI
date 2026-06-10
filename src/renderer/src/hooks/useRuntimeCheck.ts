import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import { ptyHealthLabel } from '../services/appStorage'

export function useRuntimeCheck({
  transport,
  commandExecutable,
  refreshPtyHealth,
  setStatusLine
}: {
  transport: TransportAPI
  commandExecutable: string
  refreshPtyHealth: () => Promise<PtyDoctorResult>
  setStatusLine: (value: string) => void
}) {
  const runCheck = async (): Promise<void> => {
    const [result, pty] = await Promise.all([
      transport.check(commandExecutable),
      refreshPtyHealth().catch(() => null)
    ])
    const ptySuffix = pty ? ` · ${ptyHealthLabel(pty)}` : ''
    setStatusLine(result.ok ? `OK ${result.command}: ${result.version || result.stdout.trim()}${ptySuffix}` : `Failed: ${result.stderr || result.error}${ptySuffix}`)
  }

  return { runCheck }
}

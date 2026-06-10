import { useCallback, useEffect, useState } from 'react'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'

const failedPtyHealth: PtyDoctorResult = {
  healthy: false,
  shell: '',
  output: '',
  error: 'PTY health check failed',
  exitCode: null,
  signal: null,
  available: false
}

export function usePtyHealth(transport: TransportAPI) {
  const [ptyHealth, setPtyHealth] = useState<PtyDoctorResult | null>(null)

  const refreshPtyHealth = useCallback(async (): Promise<PtyDoctorResult> => {
    const result = await transport.ptyHealth()
    setPtyHealth(result)
    return result
  }, [transport])

  useEffect(() => {
    let cancelled = false
    refreshPtyHealth()
      .then((result) => {
        if (!cancelled) setPtyHealth(result)
      })
      .catch(() => {
        if (!cancelled) setPtyHealth(failedPtyHealth)
      })
    return () => {
      cancelled = true
    }
  }, [refreshPtyHealth])

  return {
    ptyHealth,
    refreshPtyHealth
  }
}

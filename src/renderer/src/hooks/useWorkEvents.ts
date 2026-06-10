import { useCallback, useState } from 'react'
import type { WorkEvent } from '../appTypes'

export function useWorkEvents() {
  const [workEvents, setWorkEvents] = useState<WorkEvent[]>([])

  const addWorkEvent = useCallback((label: string, detail: string, tone: WorkEvent['tone'] = 'default'): void => {
    setWorkEvents((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, label, detail, tone },
      ...prev
    ].slice(0, 12))
  }, [])

  return {
    workEvents,
    addWorkEvent
  }
}

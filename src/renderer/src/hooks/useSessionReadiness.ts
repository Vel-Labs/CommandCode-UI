import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { TransportAPI } from '../../../core/transport'
import type { SessionTab } from '../appTypes'
import {
  initialSessionReadiness,
  reduceSessionReadiness,
  type SessionReadinessEvent,
  type SessionReadinessState
} from '../services/sessionReadiness'

type UseSessionReadinessOptions = {
  tabs: SessionTab[]
  setTabs: Dispatch<SetStateAction<SessionTab[]>>
  activeTabId?: string
  transport: TransportAPI
  setTerminalInputEnabled: Dispatch<SetStateAction<boolean>>
}

export function useSessionReadiness({
  tabs,
  setTabs,
  activeTabId,
  transport,
  setTerminalInputEnabled
}: UseSessionReadinessOptions) {
  const tabIds = useMemo(() => tabs.map((tab) => tab.id).join('\0'), [tabs])
  const tabsRef = useRef(tabs)

  useEffect(() => {
    tabsRef.current = tabs
  }, [tabs])

  const applySessionReadinessEvent = useCallback((sessionId: string, event: SessionReadinessEvent): void => {
    setTabs((prev) => prev.map((tab) => {
      if (tab.id !== sessionId) return tab
      return { ...tab, readiness: reduceSessionReadiness(tab.readiness, event).state }
    }))
  }, [setTabs])

  const createAttachedReadiness = useCallback((sessionId: string): SessionReadinessState => {
    return reduceSessionReadiness(initialSessionReadiness(sessionId), { type: 'attach' }).state
  }, [])

  const backgroundExistingTabs = useCallback((items: SessionTab[]): SessionTab[] => {
    return items.map((tab) => ({
      ...tab,
      readiness: reduceSessionReadiness(tab.readiness, { type: 'background' }).state
    }))
  }, [])

  useEffect(() => {
    setTerminalInputEnabled(false)
    setTabs((prev) => prev.map((tab) => {
      const event: SessionReadinessEvent = activeTabId && tab.id === activeTabId
        ? { type: 'foreground' }
        : { type: 'background' }
      return { ...tab, readiness: reduceSessionReadiness(tab.readiness, event).state }
    }))
  }, [activeTabId, setTabs, setTerminalInputEnabled])

  useEffect(() => {
    if (!tabIds) return
    const unsubscribers = tabs.flatMap((tab) => [
      transport.onSessionData(tab.id, (_data, metadata) => {
        const currentTab = tabsRef.current.find((item) => item.id === tab.id) || tab
        const event: SessionReadinessEvent = metadata.source === 'replay' || currentTab.lastPrompt
          ? { type: 'output', source: metadata.source === 'replay' ? 'replay' : 'live' }
          : { type: 'ready' }
        applySessionReadinessEvent(tab.id, event)
      }),
      transport.onSessionTelemetry(tab.id, (telemetry) => {
        setTabs((prev) => prev.map((item) => item.id === tab.id ? { ...item, telemetry } : item))
      }),
      transport.onSessionError(tab.id, (message) => {
        applySessionReadinessEvent(tab.id, { type: 'error', message })
      })
    ])
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [applySessionReadinessEvent, setTabs, tabIds, transport])

  return {
    applySessionReadinessEvent,
    createAttachedReadiness,
    backgroundExistingTabs
  }
}

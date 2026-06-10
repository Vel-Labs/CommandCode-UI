import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { projectCommandCodeTranscriptJsonl } from '../../../core/nativeConversationProjector'
import type { TransportAPI } from '../../../core/transport'
import type { LiveConversationEvent, LiveConversationHistoryTurn } from '../services/liveConversation'
import { conversationReadinessFromEvents, mergeLiveConversationTurnHistory, parseLiveConversation } from '../services/liveConversation'
import { TimelineEvent } from './LiveConversationEvents'

type LiveConversationCache = {
  rawOutput: string
  activityMemory: string[]
  history: LiveConversationHistoryTurn[]
  structuredEvents: LiveConversationEvent[]
  startedAt?: number
}

const liveConversationCache = new Map<string, LiveConversationCache>()

export function LiveConversationPane({
  transport,
  sessionId,
  active,
  lastPrompt,
  cwd,
  mock,
  structuredTranscriptPath,
  transcriptBindingStatus = 'unbound',
  commandCodeSessionId,
  onOpenArtifact,
  onOpenRawTerminal,
  onOpenThinking,
  onInputRequired,
  onConversationReadiness,
  onInputCommit
}: {
  transport: TransportAPI
  sessionId?: string
  active: boolean
  lastPrompt?: string
  cwd?: string
  mock?: boolean
  structuredTranscriptPath?: string
  transcriptBindingStatus?: 'unbound' | 'binding' | 'bound' | 'ambiguous' | 'failed'
  commandCodeSessionId?: string
  onOpenArtifact?: (path: string) => void
  onOpenRawTerminal?: () => void
  onOpenThinking?: () => void
  onInputRequired?: () => void
  onConversationReadiness?: (sessionId: string, state: 'thinking' | 'ready' | 'input') => void
  onInputCommit?: () => void
}): JSX.Element {
  const cached = sessionId ? liveConversationCache.get(sessionId) : undefined
  const [rawOutput, setRawOutput] = useState(cached?.rawOutput || '')
  const [activityMemory, setActivityMemory] = useState<string[]>(cached?.activityMemory || [])
  const [history, setHistory] = useState<LiveConversationHistoryTurn[]>(cached?.history || [])
  const [structuredEvents, setStructuredEvents] = useState<LiveConversationEvent[]>(cached?.structuredEvents || [])
  const [startedAt, setStartedAt] = useState<number | undefined>(cached?.startedAt)
  const [now, setNow] = useState(Date.now())
  const previousPromptRef = useRef<string | undefined>(lastPrompt?.trim() || undefined)
  const previousEventsRef = useRef<LiveConversationEvent[]>([])
  const previousSessionRef = useRef<string | undefined>(sessionId)
  const historyRef = useRef<LiveConversationHistoryTurn[]>(cached?.history || [])
  const inputRequiredReportedRef = useRef(false)
  const conversationReadinessReportedRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const previousSessionId = previousSessionRef.current
    const previousPrompt = previousPromptRef.current
    const nextPrompt = lastPrompt?.trim() || undefined
    const nextCached = sessionId ? liveConversationCache.get(sessionId) : undefined
    let nextHistory = nextCached?.history || []
    let nextActivityMemory = nextCached?.activityMemory || []
    let nextRawOutput = nextCached?.rawOutput || ''
    let nextStructuredEvents = nextCached?.structuredEvents || []
    if (sessionId && previousSessionId === sessionId && previousPrompt && previousPrompt !== nextPrompt) {
      nextHistory = mergeLiveConversationTurnHistory(historyRef.current, previousEventsRef.current, previousPrompt)
      nextActivityMemory = []
      nextRawOutput = ''
      const cachedSession = liveConversationCache.get(sessionId) || { rawOutput: '', activityMemory: [], history: [], structuredEvents: [] }
      liveConversationCache.set(sessionId, { ...cachedSession, rawOutput: nextRawOutput, activityMemory: nextActivityMemory, history: nextHistory })
    }

    setRawOutput(nextRawOutput)
    setActivityMemory(nextActivityMemory)
    setHistory(nextHistory)
    setStructuredEvents(nextStructuredEvents)
    setStartedAt(nextCached?.startedAt)
    previousPromptRef.current = nextPrompt
    previousSessionRef.current = sessionId
  }, [lastPrompt, sessionId])

  useEffect(() => {
    if (!sessionId) return
    return transport.onSessionData(sessionId, (data, metadata) => {
      const receivedAt = Date.now()
      setStartedAt((current) => {
        const next = current ?? receivedAt
        const cachedSession = liveConversationCache.get(sessionId) || { rawOutput: '', activityMemory: [], history: [], structuredEvents: [] }
        liveConversationCache.set(sessionId, { ...cachedSession, startedAt: next })
        return next
      })
      setRawOutput((current) => {
        const next = metadata.source === 'replay' ? data.slice(-200_000) : `${current}${data}`.slice(-200_000)
        const cachedSession = liveConversationCache.get(sessionId) || { rawOutput: '', activityMemory: [], history: [], structuredEvents: [] }
        liveConversationCache.set(sessionId, { ...cachedSession, rawOutput: next })
        return next
      })
    })
  }, [sessionId, transport])

  useEffect(() => {
    if (!sessionId || !structuredTranscriptPath) {
      setStructuredEvents([])
      return
    }

    let canceled = false
    const loadStructuredTranscript = async (): Promise<void> => {
      const result = await transport.readTranscript(structuredTranscriptPath)
      if (canceled) return
      if (result.error) {
        setStructuredEvents([{ id: 'structured-transcript-error', kind: 'session_event', text: result.error }])
        return
      }
      const next = projectCommandCodeTranscriptJsonl(result.content) as LiveConversationEvent[]
      setStructuredEvents(next)
      const cachedSession = liveConversationCache.get(sessionId) || { rawOutput: '', activityMemory: [], history: [], structuredEvents: [] }
      liveConversationCache.set(sessionId, { ...cachedSession, structuredEvents: next })
    }

    void loadStructuredTranscript()
    const interval = window.setInterval(() => void loadStructuredTranscript(), 2000)
    return () => {
      canceled = true
      window.clearInterval(interval)
    }
  }, [sessionId, structuredTranscriptPath, transport])

  const liveEvents = useMemo(() => parseLiveConversation(rawOutput, lastPrompt), [lastPrompt, rawOutput])
  const events = useMemo(() => {
    if (!mock && !structuredTranscriptPath) {
      const liveStatus = liveEvents.filter((event) => event.kind !== 'assistant_message')
      return [...liveStatus, transcriptBindingDiagnostic(transcriptBindingStatus, commandCodeSessionId, Boolean(lastPrompt?.trim()))]
    }
    if (!structuredTranscriptPath) return liveEvents
    const liveStatus = liveEvents.filter((event) => event.kind !== 'assistant_message')
    if (structuredEvents.length) {
      const hasStructuredAssistant = structuredEvents.some((event) => event.kind === 'assistant_message')
      const status = hasStructuredAssistant ? [] : liveStatus.filter((event) => event.kind !== 'user_message')
      return [...structuredEvents, ...status]
    }
    return [
      ...liveStatus,
      {
        id: 'structured-transcript-waiting',
        kind: 'session_event',
        text: 'Waiting for Command Code transcript.'
      } satisfies LiveConversationEvent
    ]
  }, [commandCodeSessionId, lastPrompt, liveEvents, mock, structuredEvents, structuredTranscriptPath, transcriptBindingStatus])
  useEffect(() => {
    if (structuredTranscriptPath) return
    const activity = events.find((event) => event.kind === 'activity')
    if (!activity?.detail?.length) return
    setActivityMemory((current) => {
      const next = mergeLines(current, activity.detail || [])
      if (sessionId) {
        const cachedSession = liveConversationCache.get(sessionId) || { rawOutput: '', activityMemory: [], history: [], structuredEvents: [] }
        liveConversationCache.set(sessionId, { ...cachedSession, activityMemory: next })
      }
      return next
    })
  }, [events, sessionId, structuredTranscriptPath])
  const displayEvents = useMemo(() => {
    if (structuredTranscriptPath) return events
    if (!activityMemory.length) return events
    return events.map((event) => {
      if (event.kind !== 'activity') return event
      return {
        ...event,
        text: summarizeActivityDetail(activityMemory),
        detail: activityMemory
      }
    })
  }, [activityMemory, events, structuredTranscriptPath])
  const needsInput = displayEvents.some((event) => event.kind === 'approval' || event.kind === 'terminal_required')
  const hasWorking = displayEvents.some((event) => event.kind === 'working')
  useEffect(() => {
    if (!needsInput) {
      inputRequiredReportedRef.current = false
      return
    }
    if (inputRequiredReportedRef.current) return
    inputRequiredReportedRef.current = true
    onInputRequired?.()
  }, [needsInput, onInputRequired])
  useEffect(() => {
    const nextState = conversationReadinessFromEvents(displayEvents)
    if (!nextState) return
    const reportKey = `${sessionId || 'none'}:${lastPrompt?.trim() || ''}:${nextState}`
    if (conversationReadinessReportedRef.current === reportKey) return
    conversationReadinessReportedRef.current = reportKey
    if (sessionId) onConversationReadiness?.(sessionId, nextState)
  }, [displayEvents, lastPrompt, onConversationReadiness, sessionId])
  useEffect(() => {
    previousEventsRef.current = displayEvents
  }, [displayEvents])
  useEffect(() => {
    historyRef.current = history
  }, [history])
  const timelineEvents = useMemo(() => {
    if (structuredTranscriptPath) return displayEvents
    const completed = history.flatMap((turn) => turn.events)
    const livePrompt = lastPrompt?.trim()
    const liveEvents = livePrompt && history.some((turn) => turn.prompt === livePrompt) && !hasWorking
      ? displayEvents.filter((event) => event.kind !== 'user_message')
      : displayEvents
    return [...completed, ...liveEvents]
  }, [displayEvents, hasWorking, history, lastPrompt])

  useEffect(() => {
    if (!hasWorking) return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [hasWorking])

  return (
    <div className={`live-conversation-pane ${active ? 'live-conversation-pane--active' : ''}`}>
      <div className="native-chat-timeline" aria-live="polite">
        {timelineEvents.map((event, index) => (
          <TimelineEvent
            key={`${index}-${event.id}`}
            event={event}
            elapsedMs={startedAt ? now - startedAt : 0}
            cwd={cwd}
            sessionId={sessionId}
            transport={transport}
            onOpenArtifact={onOpenArtifact}
            onOpenRawTerminal={onOpenRawTerminal}
            onOpenThinking={onOpenThinking}
            onInputCommit={onInputCommit}
          />
        ))}
      </div>
    </div>
  )
}

function mergeLines(current: string[], incoming: string[]): string[] {
  const seen = new Set(current)
  const merged = [...current]
  let changed = false
  for (const line of incoming) {
    if (!line || seen.has(line)) continue
    seen.add(line)
    merged.push(line)
    changed = true
  }
  if (!changed) return current
  return merged.slice(-80)
}

function summarizeActivityDetail(lines: string[]): string {
  const counts = lines.reduce<Record<string, number>>((acc, line) => {
    const verb = line.match(/^([A-Z]+|Read|Listed|Edited|Wrote|Searched|Ran)\b/)?.[1]?.toUpperCase()
    if (!verb || verb === 'RUNNING') return acc
    acc[verb] = (acc[verb] || 0) + 1
    return acc
  }, {})
  const summary = Object.entries(counts).map(([verb, count]) => `${verb.toLowerCase()} ${count}`).join(', ')
  return summary ? `Activity: ${summary}` : 'Activity'
}

function transcriptBindingDiagnostic(
  status: 'unbound' | 'binding' | 'bound' | 'ambiguous' | 'failed',
  commandCodeSessionId: string | undefined,
  hasPrompt: boolean
): LiveConversationEvent {
  if (status === 'binding') {
    return {
      id: 'structured-transcript-binding',
      kind: 'session_event',
      text: 'Binding Command Code transcript.'
    }
  }

  if (status === 'ambiguous') {
    return {
      id: 'structured-transcript-ambiguous',
      kind: 'terminal_required',
      text: 'Transcript binding is ambiguous.',
      detail: ['Open the advanced terminal or transcript inspector to choose the right Command Code session.']
    }
  }

  if (status === 'failed') {
    return {
      id: 'structured-transcript-failed',
      kind: 'terminal_required',
      text: 'Transcript binding failed.',
      detail: ['Native chat is waiting for structured Command Code transcript truth. Raw terminal output is still available for diagnostics.']
    }
  }

  if (status === 'bound') {
    return {
      id: 'structured-transcript-bound-empty',
      kind: 'session_event',
      text: commandCodeSessionId ? `Bound to Command Code transcript ${commandCodeSessionId}.` : 'Bound to Command Code transcript.'
    }
  }

  return {
    id: 'structured-transcript-unbound',
    kind: 'session_event',
    text: hasPrompt ? 'Waiting for Command Code transcript association.' : 'Ready for a structured Command Code transcript.'
  }
}

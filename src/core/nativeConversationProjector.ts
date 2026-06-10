export type NativeConversationEventKind =
  | 'user_message'
  | 'assistant_message'
  | 'activity'
  | 'thinking'
  | 'file_reference'
  | 'session_event'

export type NativeConversationEvent = {
  id: string
  kind: NativeConversationEventKind
  text: string
  detail?: string[]
  path?: string
}

type TranscriptRow = {
  id?: unknown
  timestamp?: unknown
  sessionId?: unknown
  role?: unknown
  content?: unknown
}

type TranscriptPart = Record<string, unknown>

export function projectCommandCodeTranscriptJsonl(content: string): NativeConversationEvent[] {
  const events: NativeConversationEvent[] = []

  content.split(/\r?\n/).forEach((lineContent, lineIndex) => {
    const trimmed = lineContent.trim()
    if (!trimmed) return

    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      events.push({
        id: `line-${lineIndex + 1}:parse-error`,
        kind: 'session_event',
        text: 'Transcript row could not be parsed.'
      })
      return
    }

    if (!isRecord(parsed)) return
    events.push(...projectTranscriptRow(parsed, lineIndex + 1))
  })

  return compactProjectedEvents(events)
}

function projectTranscriptRow(row: TranscriptRow, line: number): NativeConversationEvent[] {
  const role = typeof row.role === 'string' ? row.role : ''
  const rowId = typeof row.id === 'string' && row.id.trim() ? row.id.trim() : `line-${line}`
  const parts = Array.isArray(row.content) ? row.content.filter(isRecord) : []
  const events: NativeConversationEvent[] = []

  if (role === 'user') {
    const text = joinTextParts(parts)
    if (text) events.push({ id: `${rowId}:user`, kind: 'user_message', text })
    return events
  }

  if (role === 'assistant') {
    const toolDetails = parts.flatMap((part, index) => toolCallDetail(part, index))
    if (toolDetails.length) {
      events.push({
        id: `${rowId}:activity`,
        kind: 'activity',
        text: summarizeActivityDetail(toolDetails),
        detail: toolDetails
      })
    }

    const reasoningCount = parts.filter((part) => part.type === 'reasoning').length
    const text = joinTextParts(parts)
    if (text) events.push({ id: `${rowId}:assistant`, kind: 'assistant_message', text })
    if (reasoningCount > 0 && !text) {
      events.push({
        id: `${rowId}:reasoning`,
        kind: 'thinking',
        text: 'Reasoning available',
        detail: [`${reasoningCount} reasoning part${reasoningCount === 1 ? '' : 's'}`]
      })
    }
    return events
  }

  if (role === 'tool') {
    const toolDetails = parts.flatMap((part, index) => toolResultDetail(part, index))
    if (toolDetails.length) {
      events.push({
        id: `${rowId}:tool-result`,
        kind: 'activity',
        text: summarizeActivityDetail(toolDetails),
        detail: toolDetails
      })
    }
  }

  return events
}

function compactProjectedEvents(events: NativeConversationEvent[]): NativeConversationEvent[] {
  const projected: NativeConversationEvent[] = []
  const seenFileRefs = new Set<string>()

  for (const event of events) {
    projected.push(event)
    if (event.kind !== 'assistant_message') continue
    for (const filePath of fileReferences(event.text)) {
      if (seenFileRefs.has(filePath)) continue
      seenFileRefs.add(filePath)
      projected.push({
        id: `${event.id}:file:${seenFileRefs.size}`,
        kind: 'file_reference',
        text: filePath,
        path: filePath
      })
    }
  }

  return projected
}

function joinTextParts(parts: TranscriptPart[]): string {
  return parts
    .filter((part) => part.type === 'text')
    .map((part) => stringValue(part.text) ?? stringValue(part.content) ?? '')
    .map((text) => text.trim())
    .filter(Boolean)
    .join('\n\n')
}

function toolCallDetail(part: TranscriptPart, index: number): string[] {
  if (part.type !== 'tool-call') return []
  const toolName = stringValue(part.toolName) ?? stringValue(part.name) ?? `tool ${index + 1}`
  const inputSummary = summarizeToolPayload(part.input)
  return [inputSummary ? `${toolName}: ${inputSummary}` : `${toolName} started`]
}

function toolResultDetail(part: TranscriptPart, index: number): string[] {
  if (part.type !== 'tool-result') return []
  const toolName = stringValue(part.toolName) ?? stringValue(part.name) ?? `tool ${index + 1}`
  const output = summarizeToolPayload(part.output)
  return [output ? `${toolName}: ${output}` : `${toolName} completed`]
}

function summarizeToolPayload(value: unknown): string | undefined {
  const text = extractText(value)
    ?.replace(/\s+/g, ' ')
    .trim()
  if (!text) return undefined
  return text.length > 180 ? `${text.slice(0, 177)}...` : text
}

function extractText(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => extractText(item))
      .filter((item): item is string => Boolean(item?.trim()))
    return parts.length ? parts.join(' ') : undefined
  }
  if (isRecord(value)) {
    return (
      extractText(value.value) ??
      extractText(value.text) ??
      extractText(value.content) ??
      extractText(value.messages) ??
      extractText(value.output) ??
      extractText(value.result)
    )
  }
  return undefined
}

function summarizeActivityDetail(lines: string[]): string {
  const counts = lines.reduce<Record<string, number>>((acc, line) => {
    const toolName = line.match(/^([A-Za-z0-9_-]+):?/)?.[1]?.toLowerCase()
    if (!toolName) return acc
    acc[toolName] = (acc[toolName] || 0) + 1
    return acc
  }, {})
  const summary = Object.entries(counts).map(([toolName, count]) => `${toolName} ${count}`).join(', ')
  return summary ? `Activity: ${summary}` : 'Activity'
}

function fileReferences(text: string): string[] {
  const matches = text.match(/(?:^|[\s`])((?:\.{1,2}\/|\/)?(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.[A-Za-z0-9]+)/g) ?? []
  return matches.map((match) => match.trim().replace(/^`|`$/g, ''))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

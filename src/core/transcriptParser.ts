export type TranscriptEntryKind = 'user' | 'assistant' | 'tool' | 'error' | 'event' | 'unknown'

export type ParsedTranscriptEntry = {
  id: string
  line: number
  kind: TranscriptEntryKind
  label: string
  text: string
  timestamp?: string
  raw: unknown
  parseError?: string
}

export type ParsedTranscript = {
  entries: ParsedTranscriptEntry[]
  counts: Record<TranscriptEntryKind, number>
}

const emptyCounts = (): Record<TranscriptEntryKind, number> => ({
  user: 0,
  assistant: 0,
  tool: 0,
  error: 0,
  event: 0,
  unknown: 0
})

export function parseTranscriptJsonl(content: string): ParsedTranscript {
  const counts = emptyCounts()
  const entries: ParsedTranscriptEntry[] = []

  content.split(/\r?\n/).forEach((lineContent, index) => {
    const trimmed = lineContent.trim()
    if (!trimmed) return

    const line = index + 1
    try {
      const parsed = JSON.parse(trimmed) as unknown
      const entry = normalizeTranscriptEntry(parsed, line)
      counts[entry.kind] += 1
      entries.push(entry)
    } catch (err) {
      const entry: ParsedTranscriptEntry = {
        id: `line-${line}`,
        line,
        kind: 'error',
        label: 'Parse error',
        text: err instanceof Error ? err.message : 'Invalid JSONL entry',
        raw: lineContent,
        parseError: err instanceof Error ? err.message : 'Invalid JSONL entry'
      }
      counts.error += 1
      entries.push(entry)
    }
  })

  return { entries, counts }
}

function normalizeTranscriptEntry(raw: unknown, line: number): ParsedTranscriptEntry {
  if (!isRecord(raw)) {
    return baseEntry(line, 'unknown', 'Unknown entry', String(raw), raw)
  }

  const kind = classifyEntry(raw)
  const label = entryLabel(raw, kind)
  const text = entryText(raw, kind)
  const timestamp = stringValue(raw.timestamp) ?? stringValue(raw.created_at) ?? stringValue(raw.createdAt)

  return {
    id: stringValue(raw.id) ?? `line-${line}`,
    line,
    kind,
    label,
    text,
    timestamp,
    raw
  }
}

function baseEntry(line: number, kind: TranscriptEntryKind, label: string, text: string, raw: unknown): ParsedTranscriptEntry {
  return {
    id: `line-${line}`,
    line,
    kind,
    label,
    text,
    raw
  }
}

function classifyEntry(entry: Record<string, unknown>): TranscriptEntryKind {
  const type = lowerString(entry.type)
  const role = lowerString(entry.role)
  const level = lowerString(entry.level)

  if (type === 'error' || level === 'error' || typeof entry.error === 'string') return 'error'
  if (role === 'user' || type === 'user') return 'user'
  if (role === 'assistant' || type === 'assistant') return 'assistant'
  if (
    role === 'tool' ||
    type === 'tool' ||
    type === 'tool_call' ||
    type === 'tool_result' ||
    type === 'function_call' ||
    type === 'function_result' ||
    typeof entry.tool === 'string' ||
    typeof entry.tool_name === 'string'
  ) return 'tool'
  if (type === 'event' || type === 'hook' || type === 'system' || typeof entry.event === 'string') return 'event'
  return 'unknown'
}

function entryLabel(entry: Record<string, unknown>, kind: TranscriptEntryKind): string {
  const toolName = stringValue(entry.tool) ?? stringValue(entry.tool_name) ?? stringValue(entry.name)
  const eventName = stringValue(entry.event) ?? stringValue(entry.hook) ?? stringValue(entry.type)

  if (kind === 'user') return 'User'
  if (kind === 'assistant') return 'Assistant'
  if (kind === 'tool') return toolName ? `Tool: ${toolName}` : 'Tool'
  if (kind === 'event') return eventName ? `Event: ${eventName}` : 'Event'
  if (kind === 'error') return 'Error'
  return stringValue(entry.type) ? `Unknown: ${String(entry.type)}` : 'Unknown entry'
}

function entryText(entry: Record<string, unknown>, kind: TranscriptEntryKind): string {
  if (kind === 'error') {
    return stringValue(entry.error) ?? stringValue(entry.message) ?? extractText(entry.content) ?? ''
  }

  return (
    extractText(entry.content) ??
    extractText(entry.message) ??
    extractText(entry.text) ??
    extractText(entry.output) ??
    extractText(entry.result) ??
    ''
  )
}

function extractText(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => extractText(item))
      .filter((item): item is string => Boolean(item?.trim()))
    return parts.length ? parts.join('\n') : undefined
  }
  if (isRecord(value)) {
    return (
      extractText(value.text) ??
      extractText(value.content) ??
      extractText(value.input) ??
      extractText(value.output) ??
      extractText(value.result) ??
      extractText(value.value)
    )
  }
  return undefined
}

function lowerString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.toLowerCase() : undefined
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export type LiveConversationEventKind =
  | 'user_message'
  | 'assistant_message'
  | 'working'
  | 'thinking'
  | 'activity'
  | 'approval'
  | 'file_reference'
  | 'terminal_required'
  | 'session_event'

export type LiveConversationEvent = {
  id: string
  kind: LiveConversationEventKind
  text: string
  detail?: string[]
  options?: LiveConversationOption[]
  path?: string
}

export type LiveConversationHistoryTurn = {
  prompt: string
  events: LiveConversationEvent[]
}

export type LiveConversationOption = {
  key: string
  label: string
}

export type ConversationReadinessState = 'thinking' | 'ready' | 'input'

const ansiPattern = /\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1b\\))/g
const c0ControlPattern = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g

export function stripTerminalControl(input: string): string {
  return input
    .replace(ansiPattern, '')
    .replace(/\r/g, '\n')
    .replace(c0ControlPattern, '')
}

export function parseLiveConversation(rawOutput: string, lastPrompt?: string): LiveConversationEvent[] {
  const cleaned = stripTerminalControl(rawOutput)
  const prompt = lastPrompt?.trim()
  const allLines = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  const currentTurn = currentTurnLines(allLines, prompt)
  const lines = currentTurn.lines
  const promptMatched = currentTurn.promptMatched

  const assistantLines: string[] = []
  const workingLines: string[] = []
  const thinkingLines: string[] = []
  const activityLines: string[] = []
  const terminalLines: string[] = []
  const fileReferenceLines: string[] = []
  const seen = new Set<string>()
  let sawCurrentTurnSignal = !prompt || promptMatched
  const approvals = prompt && !promptMatched ? [] : approvalEvents(lines)

  for (const line of lines) {
    const normalized = normalizeLine(line)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)

    if (prompt && isPromptEcho(normalized, prompt)) continue
    if (isTerminalChromeLine(normalized, prompt)) continue

    const working = workingLine(normalized)
    if (working) {
      sawCurrentTurnSignal = true
      workingLines.push(working)
      continue
    }

    const thinking = thinkingLine(normalized)
    if (thinking) {
      if (promptMatched) sawCurrentTurnSignal = true
      thinkingLines.push(thinking)
      continue
    }

    const activity = activityLine(normalized)
    if (activity) {
      sawCurrentTurnSignal = true
      activityLines.push(activity)
      if (isWriteActivity(activity)) fileReferenceLines.push(activity)
      continue
    }

    if (approvals.some((approval) => approvalContainsLine(approval, normalized))) continue

    if (isLikelyTerminalInteraction(normalized) || (terminalLines.length > 0 && isLikelyTerminalContinuation(normalized))) {
      terminalLines.push(normalized)
      continue
    }

    if (!prompt || promptMatched || sawCurrentTurnSignal) {
      assistantLines.push(normalized)
    }
  }

  const events: LiveConversationEvent[] = []
  const assistantText = compactAssistantText(assistantLines)
  if (prompt) {
    events.push({ id: 'user-live', kind: 'user_message', text: prompt })
  }

  if (workingLines.length && !assistantText) {
    events.push({
      id: 'working-live',
      kind: 'working',
      text: workingLabel(workingLines),
      detail: compactProgressLines(workingLines)
    })
  }

  const hasActiveWorking = workingLines.length > 0 && !assistantText

  if (thinkingLines.length && !hasActiveWorking && (!prompt || promptMatched)) {
    events.push({
      id: 'thinking-live',
      kind: 'thinking',
      text: thinkingLabel(thinkingLines),
      detail: compactProgressLines(thinkingLines)
    })
  }

  if (activityLines.length) {
    events.push({
      id: 'activity-live',
      kind: 'activity',
      text: summarizeActivityLines(activityLines),
      detail: compactLines(activityLines)
    })
  }

  if (approvals.length) {
    events.push(...approvals)
  }

  if (assistantText) {
    events.push({ id: 'assistant-live', kind: 'assistant_message', text: assistantText })
  }

  const fileReferences = uniqueFileReferences([...fileReferenceLines, assistantText])
  fileReferences.forEach((path, index) => {
    events.push({
      id: `file-live-${index}`,
      kind: 'file_reference',
      text: path,
      path
    })
  })

  if (!assistantText && terminalLines.length && !approvals.length && events.length === (prompt ? 1 : 0)) {
    events.push({
      id: 'terminal-live',
      kind: 'terminal_required',
      text: 'Command Code needs terminal input.',
      detail: terminalLines.slice(-8)
    })
  }

  if (events.length === (prompt ? 1 : 0) && prompt && !promptMatched) {
    events.push({
      id: 'working-live',
      kind: 'working',
      text: 'Sending to Command Code',
      detail: ['Waiting for the current prompt to appear in the PTY stream.']
    })
  } else if (events.length === (prompt ? 1 : 0)) {
    events.push({
      id: 'session-live',
      kind: 'session_event',
      text: prompt ? 'Waiting for Command Code output.' : 'Waiting for a prompt.'
    })
  }

  return events
}

export function mergeLiveConversationTurnHistory(
  history: LiveConversationHistoryTurn[],
  events: LiveConversationEvent[],
  prompt?: string
): LiveConversationHistoryTurn[] {
  const normalizedPrompt = prompt?.trim()
  if (!normalizedPrompt) return history
  const userIndex = events.findIndex((event) => event.kind === 'user_message' && event.text.trim() === normalizedPrompt)
  if (userIndex < 0) return history
  const turnEvents = events.slice(userIndex)
  if (!turnEvents.some((event) => event.kind !== 'user_message' && event.kind !== 'working' && event.kind !== 'session_event')) {
    return history
  }
  const withoutExisting = history.filter((turn) => turn.prompt !== normalizedPrompt)
  return [...withoutExisting, { prompt: normalizedPrompt, events: turnEvents }].slice(-20)
}

export function conversationReadinessFromEvents(events: LiveConversationEvent[]): ConversationReadinessState | undefined {
  if (events.some((event) => event.kind === 'approval' || event.kind === 'terminal_required')) return 'input'
  if (events.some((event) => event.kind === 'assistant_message')) return 'ready'
  if (events.some((event) => event.kind === 'working' || event.kind === 'thinking' || event.kind === 'activity' || event.kind === 'file_reference')) return 'thinking'
  return undefined
}

export function compactPtyDiagnosticTranscript(content: string, maxLines = 80): string {
  const retained: string[] = []
  let latestThinking = ''
  let latestProgress = ''

  for (const rawLine of stripTerminalControl(content).split(/\n+/)) {
    const normalized = normalizeLine(rawLine.trim())
    if (!normalized) continue

    const thinking = thinkingLine(normalized)
    if (thinking) {
      latestThinking = thinking
      continue
    }

    const progress = workingLine(normalized)
    if (progress) {
      latestProgress = progress
      continue
    }

    if (isTerminalChromeLine(normalized)) continue
    if (/^[─━\-\s]{8,}$/.test(normalized)) continue
    if (retained.at(-1) === normalized) continue
    retained.push(normalized)
  }

  const statusLines = [
    latestThinking ? `Latest thinking: ${latestThinking}` : '',
    latestProgress ? `Latest progress: ${latestProgress}` : ''
  ].filter(Boolean)
  return [...retained.slice(Math.max(0, retained.length - maxLines + statusLines.length)), ...statusLines].join('\n')
}

function currentTurnLines(lines: string[], prompt?: string): { lines: string[]; promptMatched: boolean } {
  if (!prompt) return { lines, promptMatched: false }
  let promptIndex = -1
  lines.forEach((line, index) => {
    const normalized = normalizeLine(line)
    if (isPromptEcho(normalized, prompt)) {
      promptIndex = index
    }
  })
  return promptIndex >= 0
    ? { lines: lines.slice(promptIndex + 1), promptMatched: true }
    : { lines, promptMatched: false }
}

function normalizeLine(line: string): string {
  return line
    .replace(/[│┃║]/g, '')
    .replace(/^;?\d+(?:;\d+)*m(?=\S)/, '')
    .replace(/\[?\d+(?:;\d+)+m/g, '')
    .replace(/\[[\d;:]*$/g, '')
    .replace(/^\d+[A-Z]\s+(?=[A-Z]+\s+\()/, '')
    .replace(/\s+/g, ' ')
    .replace(/^[>›]\s*Ask your question\.\.\.$/i, '')
    .trim()
}

function isPromptEcho(line: string, prompt: string): boolean {
  return line === prompt || line === `> ${prompt}` || line === `› ${prompt}` || line === `received: ${prompt}`
}

function isTerminalChromeLine(line: string, prompt?: string): boolean {
  if (!line) return true
  if (line === '>' || line === '›') return true
  if (/^Command Code GUI$/i.test(line)) return true
  if (/^Command Code GUI mock session$/i.test(line)) return true
  if (/^Start a session from the left rail/i.test(line)) return true
  if (/^attaching session\b/i.test(line)) return true
  if (/^session exited\b/i.test(line)) return true
  if (/^Command Code v[\d.]+/i.test(line)) return true
  if (/^#\s*Command Code v[\d.]+/i.test(line)) return true
  if (/^models?:\s/i.test(line)) return true
  if (/^#\s*models?:\s/i.test(line)) return true
  if (/^cwd:\s/i.test(line)) return true
  if (/^binary:\s/i.test(line)) return true
  if (/^args:\s/i.test(line)) return true
  if (/^received:\s/i.test(line)) return true
  if (/^ESC to cancel$/i.test(line)) return true
  if (/^\([^)]+\.[A-Za-z0-9]+\)$/i.test(line)) return true
  if (/^[░█]+$/.test(line)) return true
  if (/^\d+\s+matched\)$/i.test(line)) return true
  if (/^[┌┐└┘─━\-\s]{12,}$/.test(line)) return true
  if (/^~\//.test(line)) return true
  if (/^#\s*~\//.test(line)) return true
  if (/^Type \/help\b/i.test(line)) return true
  if (/^\? for shortcuts\b/i.test(line)) return true
  if (/^\[ctrl\+[a-z] to expand\]$/i.test(line)) return true
  if (/\bcontinuous learning\b/i.test(line)) return true
  if (/\bTASTE\b/.test(line)) return true
  if (/^(?:[>›❯]\s*)?Ask your question\.\.\.$/i.test(line)) return true
  if (prompt && line.endsWith(prompt) && /^args:\s/i.test(line)) return true
  return false
}

function workingLine(line: string): string | undefined {
  const cleaned = stripToolLeader(line)
  if (/^;?\d+(?:;\d+)*m/i.test(cleaned)) return undefined
  if (/^[A-Za-z][.…]+\s+esc to interrupt\b/i.test(cleaned)) return undefined
  if (/^(?:✧|◇|○|⌘|·|-)?\s*(Articulating|Elaborating)\.{3}$/i.test(cleaned)) return cleaned.replace(/^(?:✧|◇|○|⌘|·|-)\s*/, '')
  if (/^Processing[.…]+$/i.test(cleaned)) return cleaned.replace(/[.…]+/g, '...')
  if (/^[a-z][a-z-]{3,30}[.…]+$/i.test(cleaned)) return cleaned.replace(/[.…]+/g, '...')
  const progress = cleaned.match(/^(?:[^\w\s]\s*)?([A-Z][A-Za-z ]{2,40}?)[.…]*\s+esc to interrupt\s+•\s+((?:\d+m\s+)?\d+s)(?:\s+•\s+↓\s+(\d+(?:\.\d+)?[km]?))?(?:\s+(?:\d+m\s+)?\d+s)?$/i)
  if (progress?.[1] && progress[2]) {
    const label = `${progress[1].trim()}... esc to interrupt • ${progress[2]}`
    return progress[3] ? `${label} • ↓ ${progress[3]}` : label
  }
  const progressFallback = cleaned.match(/\besc to interrupt\b.*?•\s+((?:\d+m\s+)?\d+s)(?:\s+•\s+↓\s+(\d+(?:\.\d+)?[km]?))?/i)
  if (progressFallback?.[1]) {
    const label = `Working... esc to interrupt • ${progressFallback[1]}`
    return progressFallback[2] ? `${label} • ↓ ${progressFallback[2]}` : label
  }
  const interruptedProgress = cleaned.match(/^(?:[^\w\s]\s*)?([A-Z][A-Za-z ]{2,40}?)[.…]*\s+esc to in(?:terrupt)?\b/i)
  if (interruptedProgress?.[1]) return `${interruptedProgress[1].trim()}...`
  if (/^Running\s+\([^)]+\)\.{0,3}$/i.test(cleaned)) return cleaned
  if (/^\[ctrl\+o to expand\]$/i.test(cleaned)) return undefined
  return undefined
}

function thinkingLine(line: string): string | undefined {
  if (/^(?:✻|✱|\*)\s*Thinking[.…]*(?:\s+\(\d+\s+lines?\))?(?:\s+\[ctrl\+o to expand\])?$/i.test(line)) {
    return line
      .replace(/^(?:✻|✱|\*)\s*/, '')
      .replace(/[.…]+/g, '...')
      .replace(/\s+/g, ' ')
      .trim()
  }
  const thought = line.match(/^(?:✻|✱|\*)\s*Thought\s+for\s+(.+?)(?:\s+\[ctrl\+o to expand\])?$/i)
  if (thought?.[1]) return `Thought for ${thought[1]}`
  return undefined
}

function activityLine(line: string): string | undefined {
  const cleaned = stripToolLeader(line)
  if (/^(READ|LIST|EDIT|WRITE|SEARCH|GREP|GLOB|BASH|RUN|PATCH)\s+(?:\(.+\)|\[.+\])$/i.test(cleaned)) return cleaned
  if (/^(EXPLORE|PLAN|REVIEW|UPDATE|TODO)\s+(?:\(.+\)|\[.+\])$/i.test(cleaned)) return cleaned
  const indexedTool = cleaned.match(/^(READ|LIST|EDIT|WRITE|SEARCH|GREP|GLOB|BASH|RUN|PATCH|EXPLORE|PLAN|REVIEW|UPDATE|TODO)\[\d+\]\s+(\(.+\)|\[.+\])$/i)
  if (indexedTool?.[1] && indexedTool[2]) return `${indexedTool[1].toUpperCase()} ${indexedTool[2]}`
  const embeddedTool = cleaned.match(/\b(READ|LIST|EDIT|WRITE|SEARCH|GREP|GLOB|BASH|RUN|PATCH|EXPLORE|PLAN|REVIEW|UPDATE|TODO)\s+(\([^)]{2,220}\)|\[[^\]]{2,220}\])/i)
  if (embeddedTool?.[1] && embeddedTool[2]) return `${embeddedTool[1].toUpperCase()} ${embeddedTool[2]}`
  if (/^Done\s+\(\d+(?:m\s*)?\d*s?\s+\|\s+[\d.]+[km]?\s+tokens?\)$/i.test(cleaned)) return cleaned
  if (/^(?:[●◉◯█■□▪▫]\s*)?(?:Scanning Codex|Codex:\s+\d+\s+sessions?|Learning your coding taste|learned your coding taste|Organizing your sessions|Taste Already Learned|Learning Complete|Command Code automatically uses|Learned\s+\d+\s+preferences)/i.test(cleaned)) return cleaned
  if (/^(Read|Listed|Edited|Wrote|Searched|Ran)\s+.+$/i.test(cleaned)) return cleaned
  if (/^Editing\s+.+\s+[+-]\d+/i.test(cleaned)) return cleaned
  if (/^\d+\s+files?\s+changed\b/i.test(cleaned)) return cleaned
  return undefined
}

function stripToolLeader(line: string): string {
  return line
    .replace(/^(?:L|⎿|└|↳)\s+/, '')
    .replace(/^[⎿└↳]\s*/, '')
    .trim()
}

function isWriteActivity(line: string): boolean {
  const cleaned = stripToolLeader(line)
  return /^(EDIT|WRITE|PATCH)\s+\(.+\)$/i.test(cleaned) || /^(Edited|Wrote)\s+/i.test(cleaned) || /^Editing\s+/i.test(cleaned) || /^\d+\s+files?\s+changed\b/i.test(cleaned)
}

function approvalEvents(lines: string[]): LiveConversationEvent[] {
  const normalized = lines.map(normalizeLine).filter(Boolean)
  const events: LiveConversationEvent[] = []

  const tasteIndex = normalized.findIndex((line) => /Analyze that session to build your coding taste package\?/i.test(line))
  if (tasteIndex >= 0) {
    const title = normalized.slice(Math.max(0, tasteIndex - 3), tasteIndex).find((line) => /Build Your Coding Taste/i.test(line))
    const detail = [
      ...(title ? [title] : []),
      ...normalized.slice(Math.max(0, tasteIndex - 1), tasteIndex + 1)
    ]
    events.push({
      id: 'approval-taste-live',
      kind: 'approval',
      text: 'Analyze Codex session?',
      detail,
      options: [
        { key: 'enter', label: 'Analyze session' },
        { key: 'esc', label: 'Skip' },
        { key: 'n', label: 'Never' }
      ]
    })
  }

  const planIndex = normalized.findIndex((line) => /Enter plan mode for read-only exploration and planning\?/i.test(line))
  if (planIndex >= 0) {
    const planLabel = normalized.slice(planIndex + 1, planIndex + 4).find((line) => /Switch to plan mode/i.test(line)) || 'Switch to plan mode'
    events.push({
      id: 'approval-plan-live',
      kind: 'approval',
      text: 'Enter plan mode?',
      detail: [normalized[planIndex] || 'Enter plan mode for read-only exploration and planning?'],
      options: [
        { key: 'enter', label: planLabel },
        { key: 'esc', label: 'Stay in standard mode' }
      ]
    })
  }

  const promptIndex = normalized.findIndex((line) => /Command Code needs to|Execute Shell Command|needs permission|allow all edits|tell Command Code what to do differently|confirm/i.test(line))
  if (promptIndex < 0) return events

  const windowLines = normalized.slice(promptIndex, promptIndex + 12)
  const options = windowLines
    .map((line) => line.match(/^(?:❯\s*)?(\d+)\.\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({ key: match[1] || '', label: match[2]?.trim() || '' }))
    .filter((option) => option.key && option.label)

  if (options.length < 2) return events

  const title = windowLines.find((line) => /Execute Shell Command|Permission|Confirm|Command Code needs/i.test(line)) || 'Command Code needs input'
  const detail = windowLines.filter((line) => !/^(?:❯\s*)?\d+\.\s+/.test(line)).slice(0, 4)

  events.push({
    id: 'approval-live',
    kind: 'approval',
    text: title,
    detail,
    options: options.slice(0, 5)
  })
  return events
}

function approvalContainsLine(item: LiveConversationEvent, line: string): boolean {
  if (item.text === line) return true
  if (item.detail?.includes(line)) return true
  if (item.id === 'approval-taste-live' && /Build Your Coding Taste/i.test(line)) return true
  if (item.options?.some((option) => line === option.label || line === `${option.key}. ${option.label}` || line === `❯ ${option.key}. ${option.label}`)) return true
  if (/enter ok|esc skip|n never/i.test(line)) return true
  return /^(?:❯\s*)?\d+\.\s+/.test(line)
}

function isLikelyTerminalInteraction(line: string): boolean {
  if (/^(?:❯|›)\s+/.test(line)) return true
  if (/^(choose|select|confirm)\b/i.test(line)) return true
  if (/^press\s+/i.test(line)) return true
  if (/^\[[ x]\]\s+/.test(line)) return true
  return false
}

function isLikelyTerminalContinuation(line: string): boolean {
  if (/^[A-Za-z0-9_./:-]+(?:\s+[A-Za-z0-9_./:-]+){0,4}$/.test(line)) return true
  if (/^\d+\.\s+/.test(line)) return true
  return false
}

function compactAssistantText(lines: string[]): string {
  return lines
    .filter((line) => !/^\[ctrl\+o to expand\]$/i.test(line) && !/^[-_]{3,}$/.test(line) && !isGarbledAssistantFragment(line))
    .map((line) => line.replace(/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏⠶]\s*/, ''))
    .join('\n')
    .trim()
}

function isGarbledAssistantFragment(line: string): boolean {
  const cleaned = line.trim()
  if (/^[A-Za-z]$/.test(cleaned)) return true
  if (/^[A-Za-z][.…]+\s+esc to interrupt\b/i.test(cleaned)) return true
  if (/^;?\d+(?:;\d+)*m$/i.test(cleaned)) return true
  if (/^\[?\??\d*(?:;?\d+)*[A-Za-z]?$/.test(cleaned) && cleaned.length <= 4) return true
  if (/^[─━\-\s]+$/.test(cleaned)) return true
  if (/\b(READ|LIST|EDIT|WRITE|SEARCH|GREP|GLOB|BASH|RUN|PATCH|EXPLORE|PLAN|REVIEW|UPDATE|TODO)\s*(?:\[\d+\])?\s*(?:\(|\[)/i.test(cleaned)) return true
  if (/\besc to in(?:terrupt)?\b/i.test(cleaned)) return true
  if (/^↓\s*\d+(?:\.\d+)?[km]?$/i.test(cleaned)) return true
  if (/^•\s+↓\s*\d+(?:\.\d+)?[km]?$/i.test(cleaned)) return true
  if (/^•\s+(?:\d+m\s+)?\d+s\s+•\s+↓\s+\d+(?:\.\d+)?[km]?$/i.test(cleaned)) return true
  if (/^\)+\.?$/.test(cleaned)) return true
  if (/^tokens?\)?\.?$/i.test(cleaned)) return true
  return false
}

function compactLines(lines: string[]): string[] {
  const compacted: string[] = []
  for (const line of lines) {
    if (compacted.at(-1) === line) continue
    compacted.push(line)
  }
  return compacted.slice(-8)
}

function compactProgressLines(lines: string[]): string[] {
  const byPrefix = new Map<string, string>()
  for (const line of lines) {
    const key = line
      .replace(/\s+•\s+(?:\d+m\s+)?\d+s\b.*$/i, '')
      .replace(/\s+\([^)]+\).*$/i, '')
      .replace(/\s+\[ctrl\+o to expand\]$/i, '')
      .trim()
    byPrefix.set(key || line, line)
  }
  return [...byPrefix.values()].slice(-6)
}

function summarizeActivityLines(lines: string[]): string {
  const compactedLines = compactLines(lines)
  if (compactedLines.some((line) => /Learning your coding taste|Scanning Codex|Taste Already Learned|Learning Complete|Learned\s+\d+\s+preferences/i.test(line))) {
    const learned = [...compactedLines].reverse().find((line) => /Learned\s+\d+\s+preferences/i.test(line))
    if (learned) return learned.replace(/^[●◉◯█■□▪▫]\s*/, '')
    if (compactedLines.some((line) => /Learning Complete/i.test(line))) return 'Learning Complete'
    if (compactedLines.some((line) => /Taste Already Learned/i.test(line))) return 'Taste Already Learned'
    const scan = [...compactedLines].reverse().find((line) => /Scanning Codex:/i.test(line))
    if (scan) return scan.replace(/^[●◉◯█■□▪▫]\s*/, '')
    return 'Learning your coding taste'
  }
  const latestEdit = [...compactedLines].reverse().find((line) => /^Editing\s+/i.test(line) || /^\d+\s+files?\s+changed\b/i.test(line))
  if (latestEdit) return latestEdit
  const counts = compactedLines.reduce<Record<string, number>>((acc, line) => {
    const verb = line.match(/^([A-Z]+|Read|Listed|Edited|Wrote|Searched|Ran)\b/)?.[1]?.toUpperCase()
    if (!verb) return acc
    acc[verb] = (acc[verb] || 0) + 1
    return acc
  }, {})
  const summary = Object.entries(counts).map(([verb, count]) => `${verb.toLowerCase()} ${count}`).join(', ')
  return summary ? `Activity: ${summary}` : 'Activity'
}

function workingLabel(lines: string[]): string {
  const latestProgress = [...lines].reverse().find((line) => /\besc to interrupt\b/i.test(line))
  if (latestProgress) return progressLabel(latestProgress) || 'Thinking'
  const latestRunning = [...lines].reverse().find((line) => /^Running\s+\(/i.test(line))
  if (latestRunning) return 'Thinking'
  const latestPlainProgress = [...lines].reverse().find((line) => /^[A-Za-z][A-Za-z -]{2,32}[.…]+$/i.test(line))
  if (latestPlainProgress) return progressLabel(latestPlainProgress) || 'Thinking'
  return 'Thinking'
}

function progressLabel(line: string): string | undefined {
  const cleaned = line
    .replace(/\s+esc to interrupt\b.*$/i, '')
    .replace(/\s+\([^)]+\).*$/i, '')
    .replace(/[.…]+$/g, '')
    .trim()
  if (!/^[A-Za-z][A-Za-z -]{2,32}$/.test(cleaned)) return undefined
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function thinkingLabel(lines: string[]): string {
  const latestThought = [...lines].reverse().find((line) => /^Thought for\b/i.test(line))
  if (latestThought) return latestThought
  const latestThinking = [...lines].reverse().find((line) => /^Thinking/i.test(line))
  if (latestThinking) return latestThinking
  return 'Thinking...'
}

function uniqueFileReferences(lines: string[]): string[] {
  const refs = new Set<string>()
  const patterns = [
    /\b(?:EDIT|WRITE|PATCH|READ)\s+\(([^)]+\.[A-Za-z0-9]+)\)/gi,
    /\bEditing\s+([^\s]+?\.[A-Za-z0-9]+)\b/gi,
    /\b([A-Za-z0-9_./-]+\.(?:ts|tsx|js|jsx|css|md|json|py|rs|go|swift|java|rb|yml|yaml|toml))\b/gi
  ]

  for (const line of lines) {
    if (!line) continue
    for (const pattern of patterns) {
      for (const match of line.matchAll(pattern)) {
        const value = match[1]?.trim()
        if (value && !value.startsWith('http')) refs.add(value)
      }
    }
  }

  return [...refs].slice(0, 6)
}

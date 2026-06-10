import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export type TranscriptBindingStatus = 'unbound' | 'binding' | 'bound' | 'ambiguous' | 'failed'

export type TranscriptCandidate = {
  sessionId: string
  transcriptPath: string
  mtimeMs: number
  matchedPromptTimestamp?: string
}

export type TranscriptMatchResult = {
  status: TranscriptBindingStatus
  candidates: TranscriptCandidate[]
  match?: TranscriptCandidate
  error?: string
}

export function commandCodeProjectSlug(cwd: string): string {
  return path.resolve(cwd)
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function commandCodeProjectTranscriptDir(cwd: string, baseDir = path.join(os.homedir(), '.commandcode')): string {
  return path.join(baseDir, 'projects', commandCodeProjectSlug(cwd))
}

export function listCommandCodeTranscriptCandidates(cwd: string, baseDir?: string): TranscriptCandidate[] {
  const dir = commandCodeProjectTranscriptDir(cwd, baseDir)
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter((entry) => entry.endsWith('.jsonl') && !entry.endsWith('.checkpoints.jsonl'))
    .flatMap((entry) => {
      const transcriptPath = path.join(dir, entry)
      try {
        const stat = statSync(transcriptPath)
        if (!stat.isFile()) return []
        return [{
          sessionId: entry.replace(/\.jsonl$/, ''),
          transcriptPath,
          mtimeMs: stat.mtimeMs
        }]
      } catch {
        return []
      }
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
}

export function matchTranscriptForPrompt(options: {
  cwd: string
  prompt: string
  submittedAtMs: number
  startedAfterMs?: number
  baseDir?: string
  windowMs?: number
}): TranscriptMatchResult {
  const prompt = normalizePrompt(options.prompt)
  if (!prompt) return { status: 'failed', candidates: [], error: 'Prompt is required.' }

  const candidates = listCommandCodeTranscriptCandidates(options.cwd, options.baseDir)
  const windowMs = options.windowMs ?? 10 * 60 * 1000
  const matches = candidates.flatMap((candidate) => {
    if (options.startedAfterMs && candidate.mtimeMs + 1000 < options.startedAfterMs) return []
    const matchedPromptTimestamp = transcriptContainsPrompt(candidate.transcriptPath, prompt, options.submittedAtMs, windowMs)
    return matchedPromptTimestamp ? [{ ...candidate, matchedPromptTimestamp }] : []
  })

  if (matches.length === 0) return { status: 'unbound', candidates: [] }
  if (matches.length === 1) return { status: 'bound', candidates: matches, match: matches[0] }

  const sorted = matches.sort((a, b) => {
    const aDistance = Math.abs(Date.parse(a.matchedPromptTimestamp || '') - options.submittedAtMs)
    const bDistance = Math.abs(Date.parse(b.matchedPromptTimestamp || '') - options.submittedAtMs)
    return aDistance - bDistance
  })
  const [first, second] = sorted
  const firstDistance = Math.abs(Date.parse(first?.matchedPromptTimestamp || '') - options.submittedAtMs)
  const secondDistance = Math.abs(Date.parse(second?.matchedPromptTimestamp || '') - options.submittedAtMs)

  if (first && second && secondDistance - firstDistance > 1000) {
    return { status: 'bound', candidates: sorted, match: first }
  }

  return { status: 'ambiguous', candidates: sorted }
}

function transcriptContainsPrompt(filePath: string, prompt: string, submittedAtMs: number, windowMs: number): string | undefined {
  let content = ''
  try {
    content = readFileSync(filePath, 'utf8')
  } catch {
    return undefined
  }

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(line)
    } catch {
      continue
    }
    if (!isRecord(parsed) || parsed.role !== 'user') continue
    const rowPrompt = normalizePrompt(extractText(parsed.content) || '')
    if (rowPrompt !== prompt) continue
    const timestamp = typeof parsed.timestamp === 'string' ? parsed.timestamp : undefined
    if (!timestamp) return new Date(submittedAtMs).toISOString()
    const rowTime = Date.parse(timestamp)
    if (Number.isNaN(rowTime)) return timestamp
    if (Math.abs(rowTime - submittedAtMs) <= windowMs) return timestamp
  }

  return undefined
}

function normalizePrompt(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function extractText(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map((item) => extractText(item))
      .filter((item): item is string => Boolean(item?.trim()))
      .join('\n')
  }
  if (isRecord(value)) {
    return extractText(value.text) ?? extractText(value.content) ?? extractText(value.value)
  }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

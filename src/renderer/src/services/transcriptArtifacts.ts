export type TranscriptArtifactSuggestion = {
  raw: string
  path: string
  kind: string
  exists: boolean
}

export type TranscriptArtifactSuggestions = {
  artifacts: TranscriptArtifactSuggestion[]
  rejectedCount: number
}

const fileLikePattern = /(?:^|[\s"'(])((?:\/|\.{1,2}\/)[^\s"'<>`]+|[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+\.[A-Za-z0-9]+)/g

export function suggestTranscriptArtifacts(text: string, cwd?: string): TranscriptArtifactSuggestions {
  const artifacts: TranscriptArtifactSuggestion[] = []
  const seen = new Set<string>()
  let rejectedCount = 0

  for (const rawCandidate of extractCandidates(text)) {
    const resolved = resolveCandidate(rawCandidate, cwd)
    if (!resolved) {
      rejectedCount += 1
      continue
    }
    if (seen.has(resolved)) {
      rejectedCount += 1
      continue
    }
    seen.add(resolved)
    artifacts.push({
      raw: rawCandidate,
      path: resolved,
      kind: artifactKind(rawCandidate),
      exists: true
    })
  }

  return { artifacts, rejectedCount }
}

function extractCandidates(text: string): string[] {
  const candidates: string[] = []
  for (const match of text.matchAll(fileLikePattern)) {
    const raw = match[1]
    if (!raw) continue
    const trimmed = raw.replace(/[),.;:!?}\]]+$/g, '')
    if (!trimmed || artifactKind(trimmed) === 'unknown') continue
    candidates.push(trimmed)
  }
  return candidates
}

function resolveCandidate(raw: string, cwd?: string): string | undefined {
  if (raw.startsWith('/')) {
    return cwd && (raw === cwd || raw.startsWith(`${cwd.replace(/\/+$/, '')}/`)) ? raw : undefined
  }
  if (!cwd?.trim()) return undefined

  const normalizedRoot = cwd.replace(/\/+$/, '')
  const parts = raw.split('/').filter(Boolean)
  const resolvedParts = normalizedRoot.split('/').filter(Boolean)
  for (const part of parts) {
    if (part === '.') continue
    if (part === '..') {
      if (!resolvedParts.length) return undefined
      resolvedParts.pop()
      continue
    }
    resolvedParts.push(part)
  }
  const resolved = `/${resolvedParts.join('/')}`
  return resolved === normalizedRoot || resolved.startsWith(`${normalizedRoot}/`) ? resolved : undefined
}

function artifactKind(filePath: string): string {
  const ext = extension(filePath)
  if (ext === '.md' || ext === '.markdown') return 'markdown'
  if (ext === '.html' || ext === '.htm') return 'html'
  if (ext === '.txt' || ext === '.log') return 'text'
  if (ext === '.ansi') return 'ansi'
  if (ext === '.json' || ext === '.jsonl') return 'json'
  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.svg') return 'image'
  if (ext === '.pdf') return 'pdf'
  if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx' || ext === '.css') return 'code'
  return 'unknown'
}

function extension(filePath: string): string {
  const basename = filePath.split('/').pop() || ''
  const index = basename.lastIndexOf('.')
  return index >= 0 ? basename.slice(index).toLowerCase() : ''
}

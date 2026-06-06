import { existsSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'

export type ArtifactKind = 'markdown' | 'html' | 'text' | 'ansi' | 'image' | 'json' | 'pdf' | 'code' | 'unknown'
export type ArtifactRejectionReason = 'outside-allowed-roots' | 'missing-workspace-root' | 'directory' | 'duplicate'

export type ArtifactCandidate = {
  raw: string
  path: string
  kind: ArtifactKind
  exists: boolean
  root?: string
}

export type RejectedArtifactCandidate = ArtifactCandidate & {
  reason: ArtifactRejectionReason
}

export type ArtifactDetectionOptions = {
  cwd?: string
  allowedRoots: string[]
  maxCandidates?: number
}

export type ArtifactDetectionResult = {
  artifacts: ArtifactCandidate[]
  rejected: RejectedArtifactCandidate[]
}

const fileLikePattern = /(?:^|[\s"'(])((?:\/|\.{1,2}\/)[^\s"'<>`]+|[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+\.[A-Za-z0-9]+)/g

export function detectArtifactsInText(text: string, options: ArtifactDetectionOptions): ArtifactDetectionResult {
  const artifacts: ArtifactCandidate[] = []
  const rejected: RejectedArtifactCandidate[] = []
  const seen = new Set<string>()
  const maxCandidates = options.maxCandidates ?? 50

  for (const rawCandidate of extractPathCandidates(text)) {
    if (artifacts.length + rejected.length >= maxCandidates) break

    const resolved = resolveCandidatePath(rawCandidate, options.cwd)
    const candidate = candidateFor(rawCandidate, resolved)

    if (!options.cwd?.trim() && !path.isAbsolute(rawCandidate)) {
      rejected.push({ ...candidate, reason: 'missing-workspace-root' })
      continue
    }

    const root = findAllowedRoot(resolved, options.allowedRoots)
    if (!root) {
      rejected.push({ ...candidate, reason: 'outside-allowed-roots' })
      continue
    }

    const rootedCandidate = { ...candidate, root }
    if (seen.has(rootedCandidate.path)) {
      rejected.push({ ...rootedCandidate, reason: 'duplicate' })
      continue
    }

    if (rootedCandidate.exists && statSync(rootedCandidate.path).isDirectory()) {
      rejected.push({ ...rootedCandidate, reason: 'directory' })
      continue
    }

    seen.add(rootedCandidate.path)
    artifacts.push(rootedCandidate)
  }

  return { artifacts, rejected }
}

function extractPathCandidates(text: string): string[] {
  const candidates: string[] = []
  for (const match of text.matchAll(fileLikePattern)) {
    const raw = match[1]
    if (!raw) continue
    const trimmed = trimTrailingPunctuation(raw)
    if (!trimmed || !hasSupportedExtension(trimmed)) continue
    candidates.push(trimmed)
  }
  return candidates
}

function trimTrailingPunctuation(value: string): string {
  return value.replace(/[),.;:!?}\]]+$/g, '')
}

function resolveCandidatePath(raw: string, cwd?: string): string {
  if (path.isAbsolute(raw)) return path.resolve(raw)
  return path.resolve(cwd?.trim() || '.', raw)
}

function candidateFor(raw: string, resolved: string): ArtifactCandidate {
  return {
    raw,
    path: resolved,
    kind: artifactKind(resolved),
    exists: existsSync(resolved)
  }
}

function findAllowedRoot(filePath: string, allowedRoots: string[]): string | undefined {
  for (const root of allowedRoots) {
    if (isPathUnderRoot(filePath, root)) return resolveBoundaryPath(root)
  }
  return undefined
}

function isPathUnderRoot(filePath: string, root: string): boolean {
  const realTarget = resolveBoundaryPath(filePath)
  const realRoot = resolveBoundaryPath(root)
  return realTarget === realRoot || realTarget.startsWith(realRoot + path.sep)
}

function resolveBoundaryPath(filePath: string): string {
  const resolved = path.resolve(filePath)
  try {
    return realpathSync(resolved)
  } catch {
    let current = resolved
    const missingParts: string[] = []
    while (!existsSync(current)) {
      const parent = path.dirname(current)
      if (parent === current) return resolved
      missingParts.unshift(path.basename(current))
      current = parent
    }
    try {
      return path.join(realpathSync(current), ...missingParts)
    } catch {
      return resolved
    }
  }
}

function hasSupportedExtension(filePath: string): boolean {
  return artifactKind(filePath) !== 'unknown'
}

function artifactKind(filePath: string): ArtifactKind {
  const ext = path.extname(filePath).toLowerCase()
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

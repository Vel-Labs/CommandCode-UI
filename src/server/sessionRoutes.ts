import { closeSync, existsSync, fstatSync, openSync, readFileSync, readSync, statSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  getCommandExecutable,
  normalizeCwd,
  runHeadless
} from '../core/cli'
import { matchTranscriptForPrompt } from '../core/nativeTranscriptBinding'
import type { CoreSessionManager } from '../core/sessions'
import type {
  HeadlessRunOptions,
  SessionStartOptions
} from '../core/types'
import { isPathUnderRoot } from '../shared/pathContainment'
import type { RouteHandler } from './http'

type AddRoute = (method: string, pattern: string, handler: RouteHandler) => void

type SessionRoutesOptions = {
  sessionManager: CoreSessionManager
  registerWorkspace: (sessionId: string, cwd: string) => void
  cleanupSession: (sessionId: string) => void
  resetIdleTimer: (sessionId: string) => void
}

const MAX_FILE_READ_BYTES = 1_048_576 // 1MB
const MAX_TRANSCRIPT_TAIL_BYTES = 262_144 // 256KB

export function registerSessionRoutes(addRoute: AddRoute, {
  sessionManager,
  registerWorkspace,
  cleanupSession,
  resetIdleTimer
}: SessionRoutesOptions): void {
  addRoute('POST', '/api/headless', async ({ body }) => {
    const options = body as HeadlessRunOptions
    if (options.useMock) {
      return {
        command: getCommandExecutable(options.commandExecutable),
        args: [],
        cwd: normalizeCwd(options.cwd),
        exitCode: 0,
        signal: null,
        stdout: `[Mock headless] Would run: ${options.prompt}\nModel: ${options.model || 'default'}\nMax turns: ${options.maxTurns ?? 'unlimited'}\nYolo: ${options.yolo ? 'yes' : 'no'}`,
        stderr: '',
        timedOut: false,
        durationMs: 0
      }
    }
    return runHeadless(options)
  })

  addRoute('POST', '/api/sessions', async ({ body }) => {
    const options = body as SessionStartOptions
    const result = sessionManager.start(options)
    if (sessionManager.isActive(result.id)) {
      registerWorkspace(result.id, result.cwd)
      resetIdleTimer(result.id)
    }
    return result
  })

  addRoute('POST', '/api/sessions/:id/write', async ({ body, params }) => {
    const { data } = body as { data?: string }
    sessionManager.write(params.id!, data ?? '')
    resetIdleTimer(params.id!)
    return { ok: true }
  })

  addRoute('POST', '/api/sessions/transcript', async ({ body }) => {
    const { transcriptPath } = body as { transcriptPath?: string }
    if (!transcriptPath) return { error: 'No transcript path provided' }

    const resolved = path.resolve(transcriptPath)
    if (!isAllowedTranscriptPath(resolved)) {
      return { error: 'Access denied — path outside Command Code transcript stores' }
    }

    if (!existsSync(resolved) || statSync(resolved).isDirectory()) {
      return { error: 'Transcript not found' }
    }

    const ext = path.extname(resolved).toLowerCase()
    const stat = statSync(resolved)
    if (stat.size > MAX_FILE_READ_BYTES) {
      if (ext === '.ansi' || ext === '.log' || ext === '.txt' || ext === '.jsonl') {
        const content = readFileTail(resolved, MAX_TRANSCRIPT_TAIL_BYTES, ext === '.jsonl')
        return { content, path: resolved, ext, truncated: true }
      }
      return { error: `Transcript too large (${(stat.size / 1024 / 1024).toFixed(1)}MB). Max: 1MB.` }
    }

    const content = readFileSync(resolved, 'utf8')
    return { content, path: resolved, ext }
  })

  addRoute('POST', '/api/sessions/structured-transcript-match', async ({ body }) => {
    const { cwd, prompt, submittedAtMs, startedAfterMs } = body as {
      cwd?: string
      prompt?: string
      submittedAtMs?: number
      startedAfterMs?: number
    }
    if (!cwd?.trim()) return { status: 'failed', candidates: [], error: 'Project path is required.' }
    if (!prompt?.trim()) return { status: 'failed', candidates: [], error: 'Prompt is required.' }
    if (!Number.isFinite(submittedAtMs)) return { status: 'failed', candidates: [], error: 'submittedAtMs is required.' }

    return matchTranscriptForPrompt({
      cwd,
      prompt,
      submittedAtMs: Number(submittedAtMs),
      startedAfterMs: Number.isFinite(startedAfterMs) ? Number(startedAfterMs) : undefined
    })
  })

  addRoute('POST', '/api/sessions/:id/resize', async ({ body, params }) => {
    const { cols, rows } = body as { cols?: number; rows?: number }
    sessionManager.resize(params.id!, cols ?? 80, rows ?? 24)
    return { ok: true }
  })

  addRoute('POST', '/api/sessions/:id/stop', async ({ params }) => {
    sessionManager.stop(params.id!)
    resetIdleTimer(params.id!)
    return { ok: true }
  })

  addRoute('POST', '/api/sessions/:id/interrupt', async ({ params }) => {
    sessionManager.interrupt(params.id!)
    resetIdleTimer(params.id!)
    return { ok: true }
  })

  addRoute('DELETE', '/api/sessions/:id', async ({ params }) => {
    sessionManager.forceKill(params.id!)
    cleanupSession(params.id!)
    return { ok: true }
  })
}

function isAllowedTranscriptPath(filePath: string): boolean {
  const home = os.homedir()
  const allowedRoots = [
    path.join(home, '.commandcode', 'projects'),
    path.join(home, '.commandcode', 'sessions'),
    path.join(home, '.commandcode', 'transcripts'),
    path.join(home, '.commandcode-gui-starter', 'transcripts')
  ]
  return allowedRoots.some((root) => isPathUnderRoot(filePath, root))
}

function readFileTail(filePath: string, maxBytes: number, alignToLine = false): string {
  const fd = openSync(filePath, 'r')
  try {
    const stat = fstatSync(fd)
    const length = Math.min(maxBytes, stat.size)
    const buffer = Buffer.alloc(length)
    readSync(fd, buffer, 0, length, Math.max(0, stat.size - length))
    const content = buffer.toString('utf8')
    if (!alignToLine || stat.size <= length) return content
    const firstNewline = content.indexOf('\n')
    return firstNewline >= 0 ? content.slice(firstNewline + 1) : content
  } finally {
    closeSync(fd)
  }
}

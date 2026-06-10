import {
  normalizeCwd,
  runProcess
} from '../core/cli'
import type { GitEnvironmentStatus, IdeStatusResult } from '../core/types'
import type { RouteHandler } from './http'

type AddRoute = (method: string, pattern: string, handler: RouteHandler) => void

export function registerDiagnosticsRoutes(addRoute: AddRoute): void {
  addRoute('POST', '/api/ide-status', async ({ body }) => {
    const { commandExecutable, cwd } = body as { commandExecutable?: string; cwd?: string }
    const command = commandExecutable?.trim() || process.env.COMMAND_CODE_BIN || 'cmd'
    const dir = cwd?.trim() || '.'
    const result = await runProcess(command, ['--ide-status'], dir, 30_000)

    const lines = result.stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    const ideResult: IdeStatusResult = {
      ok: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      lines,
      error: result.exitCode === 0 ? undefined : `Command exited with ${result.exitCode}`
    }

    return ideResult
  })

  addRoute('POST', '/api/git/status', async ({ body }) => {
    const { cwd } = body as { cwd?: string }
    let dir: string
    try {
      dir = normalizeCwd(cwd)
    } catch (err) {
      return {
        ok: false,
        cwd: cwd || '.',
        filesChanged: 0,
        insertions: 0,
        deletions: 0,
        added: 0,
        modified: 0,
        deleted: 0,
        untracked: 0,
        files: [],
        raw: '',
        error: err instanceof Error ? err.message : 'Invalid project directory'
      } satisfies GitEnvironmentStatus
    }

    const rootResult = await runProcess('git', ['rev-parse', '--show-toplevel'], dir, 10_000)
    if (rootResult.exitCode !== 0) {
      return {
        ok: false,
        cwd: dir,
        filesChanged: 0,
        insertions: 0,
        deletions: 0,
        added: 0,
        modified: 0,
        deleted: 0,
        untracked: 0,
        files: [],
        raw: rootResult.stderr || rootResult.stdout,
        error: 'Not a git repository'
      } satisfies GitEnvironmentStatus
    }

    const root = rootResult.stdout.trim() || dir
    const [statusResult, worktreeDiff, stagedDiff] = await Promise.all([
      runProcess('git', ['status', '--porcelain=v1', '--branch'], root, 10_000),
      runProcess('git', ['diff', '--numstat'], root, 10_000),
      runProcess('git', ['diff', '--cached', '--numstat'], root, 10_000)
    ])

    if (statusResult.exitCode !== 0) {
      return {
        ok: false,
        cwd: dir,
        root,
        filesChanged: 0,
        insertions: 0,
        deletions: 0,
        added: 0,
        modified: 0,
        deleted: 0,
        untracked: 0,
        files: [],
        raw: statusResult.stderr || statusResult.stdout,
        error: 'Git status failed'
      } satisfies GitEnvironmentStatus
    }

    return parseGitStatus(dir, root, statusResult.stdout, `${worktreeDiff.stdout}\n${stagedDiff.stdout}`)
  })
}

function parseNumstat(raw: string): { insertions: number; deletions: number } {
  let insertions = 0
  let deletions = 0
  for (const line of raw.split(/\r?\n/)) {
    const [adds, dels] = line.trim().split(/\s+/)
    const addCount = Number(adds)
    const delCount = Number(dels)
    if (Number.isFinite(addCount)) insertions += addCount
    if (Number.isFinite(delCount)) deletions += delCount
  }
  return { insertions, deletions }
}

function parseGitStatus(cwd: string, root: string | undefined, raw: string, numstatRaw: string): GitEnvironmentStatus {
  const lines = raw.split(/\r?\n/).filter(Boolean)
  const branchLine = lines.find((line) => line.startsWith('## '))
  const branchMatch = branchLine?.match(/^##\s+([^\s.]+|[^.\s]+(?:\/[^\s.]+)?)/)
  const ahead = Number(branchLine?.match(/ahead\s+(\d+)/)?.[1] ?? 0)
  const behind = Number(branchLine?.match(/behind\s+(\d+)/)?.[1] ?? 0)
  const files = lines
    .filter((line) => !line.startsWith('## '))
    .map((line) => ({
      status: line.slice(0, 2).trim() || line.slice(0, 2),
      path: line.slice(3).trim()
    }))
    .filter((file) => file.path)

  const { insertions, deletions } = parseNumstat(numstatRaw)

  return {
    ok: true,
    cwd,
    root,
    branch: branchMatch?.[1],
    ahead,
    behind,
    filesChanged: files.length,
    insertions,
    deletions,
    added: files.filter((file) => file.status.includes('A')).length,
    modified: files.filter((file) => file.status.includes('M') || file.status.includes('R') || file.status.includes('C')).length,
    deleted: files.filter((file) => file.status.includes('D')).length,
    untracked: files.filter((file) => file.status === '??').length,
    files: files.slice(0, 20),
    raw
  }
}

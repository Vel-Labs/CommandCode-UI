import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { appendFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import type { IPty } from 'node-pty'
import type { SessionStartOptions, SessionStartResult, SessionExitPayload } from './types'
import { buildInteractiveArgs, getCommandExecutable, normalizeCwd } from './cli'

export type PtySpawnFn = (command: string, args: string[], options: {
  cwd: string
  cols: number
  rows: number
  env: NodeJS.ProcessEnv
}) => IPty

type SessionRecord = {
  id: string
  terminal?: IPty
  command: string
  args: string[]
  cwd: string
  mock: boolean
  model?: string
  transcriptPath: string
  mockTimer?: NodeJS.Timeout
}

export type SessionEvents = {
  'session:data': [sessionId: string, data: string]
  'session:exit': [payload: SessionExitPayload]
  'session:error': [sessionId: string, error: Error]
}

export class CoreSessionManager extends EventEmitter<SessionEvents> {
  private readonly sessions = new Map<string, SessionRecord>()
  private readonly replayBuffers = new Map<string, string>()
  private readonly transcriptBuffers = new Map<string, string>()
  private readonly transcriptFlushTimers = new Map<string, NodeJS.Timeout>()
  private readonly transcriptWrites = new Map<string, Promise<void>>()
  private readonly ptyFactory?: PtySpawnFn
  private static readonly MAX_REPLAY_BYTES = 262_144 // 256KB
  private static readonly TRANSCRIPT_FLUSH_BYTES = 32_768
  private static readonly TRANSCRIPT_FLUSH_INTERVAL_MS = 100

  constructor(ptyFactory?: PtySpawnFn) {
    super()
    this.ptyFactory = ptyFactory
  }

  start(options: SessionStartOptions): SessionStartResult {
    const id = randomUUID()
    const shellSession = options.terminalMode === 'shell'
    const command = shellSession ? this.getShellExecutable() : getCommandExecutable(options.commandExecutable)
    const cwd = normalizeCwd(options.cwd)
    const args = shellSession ? this.getShellArgs() : buildInteractiveArgs(options)
    const transcriptPath = this.createTranscriptPath(id)

    const record: SessionRecord = {
      id,
      command,
      args,
      cwd,
      mock: Boolean(options.useMock),
      model: options.model?.trim() || undefined,
      transcriptPath
    }

    this.sessions.set(id, record)

    if (options.useMock) {
      this.startMock(record)
    } else if (this.ptyFactory) {
      this.startPty(record, options.cols ?? 120, options.rows ?? 34)
    } else {
      this.emitData(record, '\r\n\x1b[31mNo PTY factory configured. Real sessions require a PTY provider.\x1b[0m\r\n')
      this.emitExit(record, 1, null)
      this.sessions.delete(record.id)
    }

    return { id, command, args, cwd, mock: record.mock, model: record.model, transcriptPath }
  }

  write(id: string, data: string): void {
    const record = this.sessions.get(id)
    if (!record) return

    if (record.mock) {
      this.writeMock(record, data)
      return
    }

    record.terminal?.write(data)
  }

  resize(id: string, cols: number, rows: number): void {
    const record = this.sessions.get(id)
    if (!record?.terminal) return

    const safeCols = Math.max(40, Math.min(400, Math.floor(cols)))
    const safeRows = Math.max(10, Math.min(120, Math.floor(rows)))
    record.terminal.resize(safeCols, safeRows)
  }

  stop(id: string): void {
    const record = this.sessions.get(id)
    if (!record) return

    if (record.mock) {
      this.writeMock(record, '/exit\r')
      return
    }

    record.terminal?.write('/exit\r')
  }

  interrupt(id: string): void {
    const record = this.sessions.get(id)
    if (!record) return

    if (record.mock) {
      this.emitData(record, '\r\n\x1b[33mInterrupt received. Use Force Stop to kill.\x1b[0m\r\n')
      return
    }

    record.terminal?.write('\x03')
  }

  forceKill(id: string): void {
    const record = this.sessions.get(id)
    if (!record) return

    if (record.mock) {
      if (record.mockTimer) clearTimeout(record.mockTimer)
      this.replayBuffers.delete(id)
      this.flushTranscript(record)
      this.emitExit(record, 0, null)
      this.sessions.delete(id)
      return
    }

    try {
      record.terminal?.kill()
    } finally {
      this.flushTranscript(record)
      this.sessions.delete(id)
      this.replayBuffers.delete(id)
    }
  }

  getReplay(id: string): string | undefined {
    const buffer = this.replayBuffers.get(id)
    if (buffer && buffer.length > 0) {
      return buffer
    }
    return undefined
  }

  isActive(id: string): boolean {
    return this.sessions.has(id)
  }

  killAll(): void {
    for (const id of this.sessions.keys()) {
      this.forceKill(id)
    }
  }

  private startPty(record: SessionRecord, cols: number, rows: number): void {
    if (!this.ptyFactory) return

    const terminal = this.ptyFactory(record.command, record.args, {
      cwd: record.cwd,
      cols,
      rows,
      env: {
        ...process.env,
        TERM_PROGRAM: 'CommandCodeGUI',
        COLORTERM: process.env.COLORTERM || 'truecolor',
        FORCE_COLOR: process.env.FORCE_COLOR || '1'
      }
    })

    record.terminal = terminal

    terminal.onData((data) => {
      this.appendTranscript(record, data)
      this.emit('session:data', record.id, data)
    })

    terminal.onExit(({ exitCode, signal }) => {
      this.emitExit(record, exitCode ?? null, signal ?? null)
    })
  }

  private startMock(record: SessionRecord): void {
    const banner = [
      '\x1b[35mCommand Code GUI mock session\x1b[0m',
      '',
      `cwd: ${record.cwd}`,
      `binary: ${record.command}`,
      `args: ${record.args.join(' ') || '(none)'}`,
      '',
      'Type /help, /plan, /design, /exit, or any prompt. Mock mode never touches your files.',
      ''
    ].join('\r\n')

    this.emitData(record, banner + '\r\n> ')
  }

  private getShellExecutable(): string {
    if (process.platform === 'win32') return process.env.ComSpec || 'cmd.exe'
    return process.env.SHELL || '/bin/zsh'
  }

  private getShellArgs(): string[] {
    if (process.platform === 'win32') return []
    return ['-l']
  }

  private writeMock(record: SessionRecord, data: string): void {
    const normalized = data.replace(/\r/g, '\n')
    if (!normalized.includes('\n')) {
      this.emitData(record, data)
      return
    }

    const prompt = normalized.trim()
    if (!prompt) {
      this.emitData(record, '\r\n> ')
      return
    }

    this.emitData(record, `\r\n\x1b[2mreceived:\x1b[0m ${prompt}\r\n`)

    if (prompt === '/exit') {
      this.emitData(record, '\x1b[35mclosing mock session\x1b[0m\r\n')
      this.emitExit(record, 0, null)
      return
    }

    const response = this.mockResponse(prompt)
    record.mockTimer = setTimeout(() => {
      this.emitData(record, response + '\r\n> ')
    }, 300)
  }

  private mockResponse(prompt: string): string {
    if (prompt.startsWith('/help')) {
      return [
        '\x1b[1mMock slash commands\x1b[0m',
        '/plan <task>     enter planning posture',
        '/design surface  run a design-surface pass',
        '/model           switch models',
        '/rewind          checkpoint browser in the real CLI',
        '/exit            close this mock session'
      ].join('\r\n')
    }

    if (prompt.startsWith('/plan')) {
      return [
        '\x1b[34mPlan mode\x1b[0m',
        '1. Preserve the CLI as the execution source of truth.',
        '2. Wrap interactive sessions with a PTY.',
        '3. Use headless mode for structured one-shot jobs.',
        '4. Add state only behind stable outputs or official APIs.'
      ].join('\r\n')
    }

    if (prompt.startsWith('/design')) {
      return [
        '\x1b[35mDesign surface pass\x1b[0m',
        'Keep the interface dense but calm: black grid, single accent family, explicit modes, no nested cards.'
      ].join('\r\n')
    }

    return 'Mock agent: I would send this prompt to Command Code in a real session.'
  }

  private emitData(record: SessionRecord, data: string): void {
    this.appendTranscript(record, data)
    // Append to replay buffer (ring-buffer truncation from the front)
    let buffer = this.replayBuffers.get(record.id) || ''
    buffer += data
    if (buffer.length > CoreSessionManager.MAX_REPLAY_BYTES) {
      buffer = buffer.slice(buffer.length - CoreSessionManager.MAX_REPLAY_BYTES)
    }
    this.replayBuffers.set(record.id, buffer)
    this.emit('session:data', record.id, data)
  }

  private emitExit(record: SessionRecord, exitCode: number | null, signal: number | string | null): void {
    const payload: SessionExitPayload = { sessionId: record.id, exitCode, signal }
    this.sessions.delete(record.id)
    this.replayBuffers.delete(record.id)
    this.flushTranscript(record)
    this.emit('session:exit', payload)
  }

  private createTranscriptPath(id: string): string {
    const dir = path.join(os.homedir(), '.commandcode-gui-starter', 'transcripts')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${id}.ansi`)
  }

  private appendTranscript(record: SessionRecord, data: string): void {
    const buffered = (this.transcriptBuffers.get(record.id) || '') + data
    this.transcriptBuffers.set(record.id, buffered)

    if (Buffer.byteLength(buffered, 'utf8') >= CoreSessionManager.TRANSCRIPT_FLUSH_BYTES) {
      this.flushTranscript(record)
      return
    }

    if (!this.transcriptFlushTimers.has(record.id)) {
      const timer = setTimeout(() => {
        this.transcriptFlushTimers.delete(record.id)
        this.flushTranscript(record)
      }, CoreSessionManager.TRANSCRIPT_FLUSH_INTERVAL_MS)
      this.transcriptFlushTimers.set(record.id, timer)
    }
  }

  private flushTranscript(record: SessionRecord): void {
    const timer = this.transcriptFlushTimers.get(record.id)
    if (timer) {
      clearTimeout(timer)
      this.transcriptFlushTimers.delete(record.id)
    }

    const data = this.transcriptBuffers.get(record.id)
    if (!data) return
    this.transcriptBuffers.delete(record.id)

    const previous = this.transcriptWrites.get(record.id) ?? Promise.resolve()
    const write = previous
      .catch(() => undefined)
      .then(() => appendFile(record.transcriptPath, data))
      .catch((err) => {
        this.emit('session:error', record.id, err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => {
        if (this.transcriptWrites.get(record.id) === write) {
          this.transcriptWrites.delete(record.id)
        }
      })
    this.transcriptWrites.set(record.id, write)
  }

  async flushTranscriptsForTesting(): Promise<void> {
    for (const record of this.sessions.values()) {
      this.flushTranscript(record)
    }
    await Promise.all(this.transcriptWrites.values())
  }
}

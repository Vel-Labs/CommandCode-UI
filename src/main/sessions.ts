import type { WebContents } from 'electron'
import { spawn as ptySpawn } from 'node-pty'
import { CoreSessionManager } from '../core/sessions'
import type { SessionStartOptions, SessionStartResult } from '../shared/types'

function ptyFactory(command: string, args: string[], options: {
  cwd: string
  cols: number
  rows: number
  env: NodeJS.ProcessEnv
}) {
  return ptySpawn(command, args, {
    name: process.env.TERM || 'xterm-256color',
    cols: options.cols,
    rows: options.rows,
    cwd: options.cwd,
    env: options.env
  })
}

export class SessionManager {
  private readonly core = new CoreSessionManager(ptyFactory)

  constructor() {
    this.core.on('session:data', (sessionId, data) => {
      const record = this.getWebContents(sessionId)
      record?.send(`cc:session-data:${sessionId}`, data)
    })

    this.core.on('session:exit', (payload) => {
      const record = this.getWebContents(payload.sessionId)
      record?.send(`cc:session-exit:${payload.sessionId}`, payload)
      this.webContentsStore.delete(payload.sessionId)
    })

    this.core.on('session:error', (sessionId, error) => {
      const record = this.getWebContents(sessionId)
      record?.send(`cc:session-exit:${sessionId}`, {
        sessionId,
        exitCode: 1,
        signal: null
      })
      this.webContentsStore.delete(sessionId)
    })
  }

  private readonly webContentsStore = new Map<string, WebContents>()

  private getWebContents(sessionId: string): WebContents | undefined {
    return this.webContentsStore.get(sessionId)
  }

  start(webContents: WebContents, options: SessionStartOptions): SessionStartResult {
    const result = this.core.start(options)
    this.webContentsStore.set(result.id, webContents)
    return result
  }

  write(id: string, data: string): void {
    this.core.write(id, data)
  }

  resize(id: string, cols: number, rows: number): void {
    this.core.resize(id, cols, rows)
  }

  stop(id: string): void {
    this.core.stop(id)
  }

  forceKill(id: string): void {
    this.core.forceKill(id)
  }

  killAll(): void {
    this.core.killAll()
  }
}

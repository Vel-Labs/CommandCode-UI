import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import WebSocket from 'ws'
import { createAppServer } from '../src/server/index'
import type { SessionTelemetrySnapshot } from '../src/core/types'

type Options = {
  commandExecutable: string
  model: string
  prompt: string
  timeoutMs: number
  exitAfterMs: number
  out: string
}

type StreamMessage = {
  type?: string
  data?: string
  telemetry?: SessionTelemetrySnapshot
  exitCode?: number | null
  signal?: number | string | null
}

type Receipt = {
  ok: boolean
  startedAt: string
  finishedAt: string
  serverUrl: string
  projectDir: string
  session?: {
    id: string
    command: string
    args: string[]
    cwd: string
    mock: boolean
    model?: string
    transcriptPath: string
  }
  checks: Record<string, boolean>
  counts: {
    replayFrames: number
    dataFrames: number
    telemetryFrames: number
    exitFrames: number
    outputBytes: number
  }
  latestTelemetry?: SessionTelemetrySnapshot
  exit?: {
    exitCode: number | null
    signal: number | string | null
  }
  cleanup: {
    deleteStatus?: number
    error?: string
  }
  error?: string
}

const options = parseArgs(process.argv.slice(2))

async function main(): Promise<void> {
  const startedAt = new Date()
  const projectDir = mkdtempSync(path.join(tmpdir(), 'ccgui-real-session-'))
  const app = createAppServer(0, '127.0.0.1')
  const receipt: Receipt = {
    ok: false,
    startedAt: startedAt.toISOString(),
    finishedAt: '',
    serverUrl: '',
    projectDir,
    checks: {
      sessionStarted: false,
      realSession: false,
      websocketConnected: false,
      streamOutputObserved: false,
      telemetryObserved: false,
      outputTelemetryObserved: false,
      writeTelemetryObserved: false,
      cleanupAttempted: false
    },
    counts: {
      replayFrames: 0,
      dataFrames: 0,
      telemetryFrames: 0,
      exitFrames: 0,
      outputBytes: 0
    },
    cleanup: {}
  }

  let sessionId: string | undefined
  let ws: WebSocket | undefined
  let exitWriteSent = false

  try {
    await app.start()
    receipt.serverUrl = app.url

    const session = await apiPost<Receipt['session'] & { telemetry?: SessionTelemetrySnapshot }>(app, '/api/sessions', {
      cwd: projectDir,
      commandExecutable: options.commandExecutable,
      initialPrompt: options.prompt,
      model: options.model,
      permissionMode: 'plan',
      trust: true,
      skipOnboarding: true,
      useMock: false,
      cols: 120,
      rows: 32
    })
    sessionId = session.id
    receipt.session = {
      id: session.id,
      command: session.command,
      args: session.args,
      cwd: session.cwd,
      mock: session.mock,
      model: session.model,
      transcriptPath: session.transcriptPath
    }
    receipt.latestTelemetry = session.telemetry
    receipt.checks.sessionStarted = Boolean(session.id)
    receipt.checks.realSession = session.mock === false

    ws = new WebSocket(sessionWebSocketUrl(app.url, app.token, session.id))
    ws.on('open', () => {
      receipt.checks.websocketConnected = true
    })
    ws.on('message', (raw) => {
      const message = parseMessage(raw.toString())
      if (!message) return
      if (message.type === 'replay') {
        receipt.counts.replayFrames += 1
        receipt.counts.outputBytes += Buffer.byteLength(message.data ?? '', 'utf8')
      } else if (message.type === 'data') {
        receipt.counts.dataFrames += 1
        receipt.counts.outputBytes += Buffer.byteLength(message.data ?? '', 'utf8')
      } else if (message.type === 'telemetry' && message.telemetry) {
        receipt.counts.telemetryFrames += 1
        receipt.latestTelemetry = message.telemetry
        if (message.telemetry.outputChunks > 0 && message.telemetry.outputBytes > 0) {
          receipt.checks.outputTelemetryObserved = true
        }
        if (message.telemetry.inputChunks > 0 && message.telemetry.inputBytes > 0) {
          receipt.checks.writeTelemetryObserved = true
        }
      } else if (message.type === 'exit') {
        receipt.counts.exitFrames += 1
        receipt.exit = { exitCode: message.exitCode ?? null, signal: message.signal ?? null }
      }

      if (receipt.counts.outputBytes > 0) {
        receipt.checks.streamOutputObserved = true
      }
      if (receipt.counts.telemetryFrames > 0) {
        receipt.checks.telemetryObserved = true
      }
    })

    setTimeout(() => {
      if (!sessionId || exitWriteSent) return
      exitWriteSent = true
      void apiPost(app, `/api/sessions/${sessionId}/write`, { data: '/exit\r' }).catch(() => undefined)
    }, options.exitAfterMs).unref()

    await delay(options.timeoutMs)
  } catch (error) {
    receipt.error = error instanceof Error ? error.message : String(error)
  } finally {
    if (sessionId) {
      receipt.checks.cleanupAttempted = true
      try {
        const deleted = await fetch(`${app.url}/api/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: { 'X-Auth-Token': app.token }
        })
        receipt.cleanup.deleteStatus = deleted.status
      } catch (error) {
        receipt.cleanup.error = error instanceof Error ? error.message : String(error)
      }
    }
    ws?.close()
    await app.stop()
    receipt.finishedAt = new Date().toISOString()
    receipt.ok = requiredChecks(receipt).every((name) => receipt.checks[name])
    writeFileSync(options.out, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
    console.log(`receipt: ${options.out}`)
    console.log(`ok: ${receipt.ok}`)
    console.log(`checks: ${JSON.stringify(receipt.checks)}`)
    process.exit(receipt.ok ? 0 : 1)
  }
}

function parseArgs(args: string[]): Options {
  const next: Options = {
    commandExecutable: process.env.COMMAND_CODE_BIN || 'cmd',
    model: process.env.COMMAND_CODE_MODEL || 'deepseek-v4-pro',
    prompt: 'Reply with exactly: OK real session telemetry smoke.',
    timeoutMs: 45_000,
    exitAfterMs: 18_000,
    out: path.join(tmpdir(), `ccgui-real-session-receipt-${Date.now()}.json`)
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    const value = args[index + 1]
    if (arg === '--command' && value) {
      next.commandExecutable = value
      index += 1
    } else if (arg === '--model' && value) {
      next.model = value
      index += 1
    } else if (arg === '--prompt' && value) {
      next.prompt = value
      index += 1
    } else if (arg === '--timeout-ms' && value) {
      next.timeoutMs = Math.max(5_000, Number(value) || next.timeoutMs)
      index += 1
    } else if (arg === '--exit-after-ms' && value) {
      next.exitAfterMs = Math.max(1_000, Number(value) || next.exitAfterMs)
      index += 1
    } else if (arg === '--out' && value) {
      next.out = path.resolve(value)
      index += 1
    }
  }

  return next
}

async function apiPost<T>(app: ReturnType<typeof createAppServer>, route: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${app.url}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': app.token
    },
    body: JSON.stringify(body)
  })
  const json = await response.json().catch(() => ({})) as T
  if (!response.ok) {
    throw new Error(`${route} returned ${response.status}: ${JSON.stringify(json)}`)
  }
  return json
}

function sessionWebSocketUrl(baseUrl: string, token: string, sessionId: string): string {
  const url = new URL(baseUrl)
  url.protocol = 'ws:'
  url.pathname = `/ws/sessions/${sessionId}`
  url.searchParams.set('token', token)
  return url.toString()
}

function parseMessage(raw: string): StreamMessage | undefined {
  try {
    return JSON.parse(raw) as StreamMessage
  } catch {
    return undefined
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function requiredChecks(receipt: Receipt): Array<keyof Receipt['checks']> {
  return [
    'sessionStarted',
    'realSession',
    'websocketConnected',
    'streamOutputObserved',
    'telemetryObserved',
    'outputTelemetryObserved',
    'writeTelemetryObserved',
    'cleanupAttempted'
  ]
}

void main()

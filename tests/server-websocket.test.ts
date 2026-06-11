import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import WebSocket from 'ws'
import { createAppServer } from '../src/server/index'

type TestServer = ReturnType<typeof createAppServer>

const servers: TestServer[] = []
const tempDirs: string[] = []

async function startServer(): Promise<TestServer> {
  const app = createAppServer(0, '127.0.0.1')
  await app.start()
  servers.push(app)
  return app
}

function tempProject(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'ccgui-ws-'))
  tempDirs.push(dir)
  return dir
}

async function apiPost<T>(app: TestServer, route: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${app.url}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': app.token
    },
    body: JSON.stringify(body)
  })
  expect(res.status).toBe(200)
  return res.json() as Promise<T>
}

function collectUntil(ws: WebSocket, predicate: (messages: unknown[]) => boolean): Promise<unknown[]> {
  const messages: unknown[] = []
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out waiting for WebSocket messages: ${JSON.stringify(messages)}`))
    }, 2000)

    const cleanup = () => {
      clearTimeout(timeout)
      ws.off('message', onMessage)
      ws.off('error', onError)
    }

    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }

    const onMessage = (raw: WebSocket.RawData) => {
      messages.push(JSON.parse(raw.toString()) as unknown)
      if (predicate(messages)) {
        cleanup()
        resolve(messages)
      }
    }

    ws.on('message', onMessage)
    ws.on('error', onError)
  })
}

afterEach(async () => {
  while (servers.length) {
    const app = servers.pop()!
    await app.stop()
  }
  while (tempDirs.length) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true })
  }
})

describe('session WebSocket stream telemetry', () => {
  it('sends replay and current telemetry to late-attaching clients', async () => {
    const app = await startServer()
    const cwd = tempProject()
    const session = await apiPost<{ id: string }>(app, '/api/sessions', {
      cwd,
      useMock: true,
      model: 'deepseek-v4-pro'
    })

    const wsUrl = new URL(app.url)
    wsUrl.protocol = 'ws:'
    wsUrl.pathname = `/ws/sessions/${session.id}`
    wsUrl.searchParams.set('token', app.token)

    const ws = new WebSocket(wsUrl)
    const messages = await collectUntil(ws, (items) => {
      const hasReplay = items.some((item) => isMessage(item, 'replay'))
      const hasTelemetry = items.some((item) => (
        isMessage(item, 'telemetry') &&
        typeof item.telemetry === 'object' &&
        item.telemetry !== null &&
        (item.telemetry as { outputChunks?: unknown }).outputChunks === 1
      ))
      return hasReplay && hasTelemetry
    })
    ws.close()

    const replay = messages.find((item) => isMessage(item, 'replay')) as { data: string } | undefined
    const telemetry = messages.find((item) => isMessage(item, 'telemetry')) as { telemetry: { model?: string; outputBytes?: number } } | undefined

    expect(replay?.data).toContain('Command Code GUI mock session')
    expect(telemetry?.telemetry.model).toBe('deepseek-v4-pro')
    expect(telemetry?.telemetry.outputBytes).toBeGreaterThan(0)
  })
})

function isMessage(item: unknown, type: string): item is { type: string; [key: string]: unknown } {
  return typeof item === 'object' && item !== null && (item as { type?: unknown }).type === type
}

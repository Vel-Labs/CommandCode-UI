import type { Server } from 'node:http'
import { parse as parseUrl } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'
import type { CoreSessionManager } from '../core/sessions'
import type { SessionExitPayload } from '../core/types'
import { extractParams, extractToken } from './http'

type SessionWebSocketOptions = {
  httpServer: Server
  token: string
  sessionManager: CoreSessionManager
  resetIdleTimer: (sessionId: string) => void
}

export function createSessionWebSocketServer({
  httpServer,
  token,
  sessionManager,
  resetIdleTimer
}: SessionWebSocketOptions): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', (ws, req) => {
    const reqToken = extractToken(req)
    if (!reqToken || reqToken !== token) {
      ws.close(4001, 'Unauthorized')
      return
    }

    const parsed = parseUrl(req.url ?? '/', true)
    const pathname = parsed.pathname ?? '/'
    const params = extractParams(pathname, '/ws/sessions/:id')
    if (!params?.id) {
      ws.close(4002, 'Missing session id')
      return
    }

    const sessionId = params.id

    // Send replay buffer on connect so early output is never lost.
    const replay = sessionManager.getReplay(sessionId)
    if (replay && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'replay', data: replay }))
    }

    const onData = (sid: string, data: string) => {
      if (sid !== sessionId) return
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', data }))
      }
    }

    const onExit = (payload: SessionExitPayload) => {
      if (payload.sessionId !== sessionId) return
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'exit', ...payload }))
      }
      cleanup()
    }

    const cleanup = () => {
      sessionManager.off('session:data', onData)
      sessionManager.off('session:exit', onExit)
    }

    sessionManager.on('session:data', onData)
    sessionManager.on('session:exit', onExit)

    ws.on('close', cleanup)
    ws.on('error', cleanup)

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === 'write') {
          sessionManager.write(sessionId, msg.data ?? '')
          resetIdleTimer(sessionId)
        } else if (msg.type === 'resize') {
          sessionManager.resize(sessionId, msg.cols ?? 80, msg.rows ?? 24)
        }
      } catch {
        // Ignore malformed messages.
      }
    })
  })

  return wss
}

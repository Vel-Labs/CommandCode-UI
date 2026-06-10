import type { SessionDataCallback, SessionExitCallback } from '../../../core/transport'
import type { BrowserApiClient } from './browserApiClient'

type SessionCallbacks = {
  data: Set<SessionDataCallback>
  exit: Set<SessionExitCallback>
}

export type BrowserSessionSocketManager = {
  onSessionData: (sessionId: string, callback: SessionDataCallback) => () => void
  onSessionExit: (sessionId: string, callback: SessionExitCallback) => () => void
}

export function createBrowserSessionSocketManager(api: BrowserApiClient): BrowserSessionSocketManager {
  const sockets = new Map<string, WebSocket>()
  const sessionCallbacks = new Map<string, SessionCallbacks>()

  function cleanupIfIdle(sessionId: string, callbacks: SessionCallbacks): void {
    if (callbacks.data.size > 0 || callbacks.exit.size > 0) return

    const ws = sockets.get(sessionId)
    if (ws) {
      try { ws.close() } catch { /* ignore */ }
      sockets.delete(sessionId)
    }
  }

  function ensureSocket(sessionId: string): WebSocket {
    const existing = sockets.get(sessionId)
    if (existing && (existing.readyState === WebSocket.CONNECTING || existing.readyState === WebSocket.OPEN)) {
      return existing
    }

    if (existing) {
      try { existing.close() } catch { /* ignore */ }
      sockets.delete(sessionId)
    }

    const token = api.getToken()
    const url = token
      ? `${api.wsUrl(`/ws/sessions/${sessionId}`)}?token=${token}`
      : api.wsUrl(`/ws/sessions/${sessionId}`)

    const ws = new WebSocket(url)
    sockets.set(sessionId, ws)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        const callbacks = sessionCallbacks.get(sessionId)
        if (!callbacks) return

        if (msg.type === 'replay' && typeof msg.data === 'string') {
          callbacks.data.forEach((cb) => cb(msg.data, { source: 'replay' }))
        } else if (msg.type === 'data' && typeof msg.data === 'string') {
          callbacks.data.forEach((cb) => cb(msg.data, { source: 'live' }))
        } else if (msg.type === 'exit') {
          callbacks.exit.forEach((cb) => cb(msg))
        }
      } catch {
        // Ignore malformed socket frames; API responses carry structured errors.
      }
    }

    ws.onclose = () => {
      sockets.delete(sessionId)
    }

    ws.onerror = () => {
      // Let onclose handle cleanup.
    }

    return ws
  }

  function callbacksFor(sessionId: string): SessionCallbacks {
    const existing = sessionCallbacks.get(sessionId)
    if (existing) return existing

    const callbacks = { data: new Set<SessionDataCallback>(), exit: new Set<SessionExitCallback>() }
    sessionCallbacks.set(sessionId, callbacks)
    return callbacks
  }

  return {
    onSessionData: (sessionId, callback) => {
      const callbacks = callbacksFor(sessionId)
      callbacks.data.add(callback)
      ensureSocket(sessionId)
      return () => {
        callbacks.data.delete(callback)
        cleanupIfIdle(sessionId, callbacks)
      }
    },

    onSessionExit: (sessionId, callback) => {
      const callbacks = callbacksFor(sessionId)
      callbacks.exit.add(callback)
      ensureSocket(sessionId)
      return () => {
        callbacks.exit.delete(callback)
        cleanupIfIdle(sessionId, callbacks)
      }
    }
  }
}

import type { SessionDataCallback, SessionErrorCallback, SessionExitCallback, SessionTelemetryCallback } from '../../../core/transport'
import type { SessionTelemetrySnapshot } from '../../../core/types'
import type { BrowserApiClient } from './browserApiClient'

type SessionCallbacks = {
  data: Set<SessionDataCallback>
  exit: Set<SessionExitCallback>
  telemetry: Set<SessionTelemetryCallback>
  error: Set<SessionErrorCallback>
}

export type BrowserSessionSocketManager = {
  onSessionData: (sessionId: string, callback: SessionDataCallback) => () => void
  onSessionExit: (sessionId: string, callback: SessionExitCallback) => () => void
  onSessionTelemetry: (sessionId: string, callback: SessionTelemetryCallback) => () => void
  onSessionError: (sessionId: string, callback: SessionErrorCallback) => () => void
}

export function createBrowserSessionSocketManager(api: BrowserApiClient): BrowserSessionSocketManager {
  const sockets = new Map<string, WebSocket>()
  const sessionCallbacks = new Map<string, SessionCallbacks>()

  function cleanupIfIdle(sessionId: string, callbacks: SessionCallbacks): void {
    if (callbacks.data.size > 0 || callbacks.exit.size > 0 || callbacks.telemetry.size > 0 || callbacks.error.size > 0) return

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
        } else if (msg.type === 'telemetry' && isTelemetrySnapshot(msg.telemetry)) {
          callbacks.telemetry.forEach((cb) => cb(msg.telemetry))
        } else if (msg.type === 'error' && typeof msg.message === 'string') {
          callbacks.error.forEach((cb) => cb(msg.message))
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

    const callbacks = {
      data: new Set<SessionDataCallback>(),
      exit: new Set<SessionExitCallback>(),
      telemetry: new Set<SessionTelemetryCallback>(),
      error: new Set<SessionErrorCallback>()
    }
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
    },

    onSessionTelemetry: (sessionId, callback) => {
      const callbacks = callbacksFor(sessionId)
      callbacks.telemetry.add(callback)
      ensureSocket(sessionId)
      return () => {
        callbacks.telemetry.delete(callback)
        cleanupIfIdle(sessionId, callbacks)
      }
    },

    onSessionError: (sessionId, callback) => {
      const callbacks = callbacksFor(sessionId)
      callbacks.error.add(callback)
      ensureSocket(sessionId)
      return () => {
        callbacks.error.delete(callback)
        cleanupIfIdle(sessionId, callbacks)
      }
    }
  }
}

function isTelemetrySnapshot(value: unknown): value is SessionTelemetrySnapshot {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SessionTelemetrySnapshot>
  return typeof candidate.sessionId === 'string' &&
    typeof candidate.command === 'string' &&
    Array.isArray(candidate.args) &&
    typeof candidate.cwd === 'string' &&
    typeof candidate.startedAtMs === 'number' &&
    typeof candidate.inputChunks === 'number' &&
    typeof candidate.outputChunks === 'number'
}

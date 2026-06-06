import type { TransportAPI, SessionDataCallback, SessionExitCallback } from '../../core/transport'
import type {
  AgentConfig,
  AppGuiPreferences,
  AppGuiPreferencesResult,
  CliExecResult,
  CommandCodeCheck,
  CommandCodeStatus,
  CommandCodeUpdateResult,
  DiscoveredSession,
  FileEntry,
  GitEnvironmentStatus,
  HeadlessRunOptions,
  HeadlessRunResult,
  IdeStatusResult,
  McpServer,
  MemoryFile,
  ModelListResult,
  ProjectGuiPreferences,
  ProjectGuiPreferencesResult,
  ProjectCommandCodeReference,
  SessionStartOptions,
  SessionStartResult,
  SkillEntry,
  TastePackage,
  UsageSummary,
  WriteFileResult,
} from '../../core/types'
import type { PtyDoctorResult } from '../../core/ptyDoctor'

let cachedToken = ''
let serverUrl = ''

// In Electron production mode, the main process injects token + port into window
// before any JS loads. Read it immediately at module init time — no race.
if (typeof window !== 'undefined') {
  const injected = (window as unknown as { __CCGUI__?: { token: string; port: number } }).__CCGUI__
  if (injected) {
    cachedToken = injected.token
    serverUrl = `http://127.0.0.1:${injected.port}`
  }
  // Browser dev mode: token arrives via Vite proxy from /api/token
  // Same-origin cookie covers production (server serves HTML and API on same port)
  if (document.cookie.includes('ccgui-token=')) {
    const m = document.cookie.match(/ccgui-token=([^;]+)/)
    if (m && !cachedToken) cachedToken = m[1]!
  }
}

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return cachedToken
}

function applyAuth(init?: RequestInit): RequestInit {
  const token = cachedToken
  const headers = new Headers(init?.headers)
  if (token) headers.set('X-Auth-Token', token)
  return { ...init, headers }
}

function apiUrl(path: string): string {
  return serverUrl ? `${serverUrl}${path}` : path
}

function wsUrl(path: string): string {
  if (serverUrl) {
    const host = serverUrl.replace(/^https?:\/\//, '')
    return `ws://${host}${path}`
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${path}`
}

async function fetchTokenFromServer(): Promise<void> {
  if (cachedToken) return
  try {
    const res = await fetch('/api/token')
    if (!res.ok) return
    const data = await res.json() as { token?: string }
    if (data.token) cachedToken = data.token
  } catch { /* fail silently */ }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  // Browser dev mode: fetch token from server if not yet available
  if (!cachedToken && !serverUrl) {
    await fetchTokenFromServer()
  }

  const res = await fetch(apiUrl(path), applyAuth({
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers }
  }))
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export function createBrowserTransport(): TransportAPI {
  const sockets = new Map<string, WebSocket>()
  const sessionCallbacks = new Map<string, {
    data: Set<SessionDataCallback>
    exit: Set<SessionExitCallback>
  }>()

  function ensureSocket(sessionId: string): WebSocket {
    const existing = sockets.get(sessionId)
    // Reuse CONNECTING and OPEN sockets
    if (existing && (existing.readyState === WebSocket.CONNECTING || existing.readyState === WebSocket.OPEN)) {
      return existing
    }

    // Only close stale sockets that are CLOSING or CLOSED
    if (existing) {
      try { existing.close() } catch { /* ignore */ }
      sockets.delete(sessionId)
    }

    const token = cachedToken
    const url = token
      ? `${wsUrl(`/ws/sessions/${sessionId}`)}?token=${token}`
      : wsUrl(`/ws/sessions/${sessionId}`)

    const ws = new WebSocket(url)
    sockets.set(sessionId, ws)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        const cbs = sessionCallbacks.get(sessionId)
        if (!cbs) return

        if (msg.type === 'replay' && typeof msg.data === 'string') {
          cbs.data.forEach((cb) => cb(msg.data))
        } else if (msg.type === 'data' && typeof msg.data === 'string') {
          cbs.data.forEach((cb) => cb(msg.data))
        } else if (msg.type === 'exit') {
          cbs.exit.forEach((cb) => cb(msg))
        }
      } catch {
        // Ignore parse errors
      }
    }

    ws.onclose = () => {
      sockets.delete(sessionId)
    }

    ws.onerror = () => {
      // Let onclose handle cleanup
    }

    return ws
  }

  return {
    chooseDirectory: async () => {
      const stored = localStorage.getItem('ccgui.cwd')
      return { canceled: false, path: stored || '/' }
    },

    check: async (commandExecutable?) =>
      fetchJson<CommandCodeCheck>('/api/check', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable })
      }),

    status: async (commandExecutable?, cwd?) =>
      fetchJson<CommandCodeStatus>('/api/status', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, cwd })
      }),

    update: async (commandExecutable?, cwd?, checkOnly = true) =>
      fetchJson<CommandCodeUpdateResult>('/api/update', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, cwd, checkOnly })
      }),

    loadAppPreferences: async () =>
      fetchJson<AppGuiPreferencesResult>('/api/app/preferences', {
        method: 'POST'
      }),

    saveAppPreferences: async (preferences: AppGuiPreferences) =>
      fetchJson<AppGuiPreferencesResult>('/api/app/preferences/save', {
        method: 'POST',
        body: JSON.stringify({ preferences })
      }),

    loadProjectPreferences: async (cwd) =>
      fetchJson<ProjectGuiPreferencesResult>('/api/project/preferences', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    saveProjectPreferences: async (cwd, preferences: ProjectGuiPreferences) =>
      fetchJson<ProjectGuiPreferencesResult>('/api/project/preferences/save', {
        method: 'POST',
        body: JSON.stringify({ cwd, preferences })
      }),

    ptyHealth: async () =>
      fetchJson<PtyDoctorResult>('/api/pty-health'),

    listModels: async (commandExecutable?, cwd?) =>
      fetchJson<ModelListResult>('/api/models', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, cwd })
      }),

    startSession: async (options) =>
      fetchJson<SessionStartResult>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    write: async (sessionId, data) =>
      fetchJson<void>(`/api/sessions/${sessionId}/write`, {
        method: 'POST',
        body: JSON.stringify({ data })
      }),

    resize: async (sessionId, cols, rows) =>
      fetchJson<void>(`/api/sessions/${sessionId}/resize`, {
        method: 'POST',
        body: JSON.stringify({ cols, rows })
      }),

    stop: async (sessionId) =>
      fetchJson<void>(`/api/sessions/${sessionId}/stop`, { method: 'POST' }),

    interrupt: async (sessionId) =>
      fetchJson<void>(`/api/sessions/${sessionId}/interrupt`, { method: 'POST' }),

    forceKill: async (sessionId) =>
      fetchJson<void>(`/api/sessions/${sessionId}`, { method: 'DELETE' }),

    kill: async (sessionId) =>
      fetchJson<void>(`/api/sessions/${sessionId}`, { method: 'DELETE' }),

    runHeadless: async (options) =>
      fetchJson<HeadlessRunResult>('/api/headless', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    openExternal: (url: string): Promise<void> => {
      window.open(url, '_blank')
      return Promise.resolve()
    },

    revealTranscript: (_transcriptPath: string): Promise<void> => {
      return Promise.resolve()
    },

    revealPath: (_targetPath: string): Promise<void> => {
      return Promise.resolve()
    },

    readTranscript: async (transcriptPath) =>
      fetchJson<{ content: string; path: string; ext: string; error?: string }>('/api/sessions/transcript', {
        method: 'POST',
        body: JSON.stringify({ transcriptPath })
      }),

    listFiles: async (dir, cwd) =>
      fetchJson<{ entries: FileEntry[]; dir: string; error?: string }>('/api/files/list', {
        method: 'POST',
        body: JSON.stringify({ dir, cwd })
      }),

    readFile: async (filePath, cwd) =>
      fetchJson<{ content: string; path: string; ext: string; error?: string }>('/api/files/read', {
        method: 'POST',
        body: JSON.stringify({ filePath, cwd })
      }),

    ideStatus: async (commandExecutable?, cwd?) =>
      fetchJson<IdeStatusResult>('/api/ide-status', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, cwd })
      }),

    gitStatus: async (cwd?) =>
      fetchJson<GitEnvironmentStatus>('/api/git/status', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    discoverSessions: async (cwd?) =>
      fetchJson<{ sessions: DiscoveredSession[] }>('/api/sessions/discover', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    projectCommandCodeReference: async (cwd?) =>
      fetchJson<{ reference: ProjectCommandCodeReference }>('/api/project/commandcode-reference', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    usage: async (commandExecutable?, cwd?) =>
      fetchJson<UsageSummary>('/api/usage', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, cwd })
      }),

    listTaste: async () =>
      fetchJson<{ packages: TastePackage[] }>('/api/taste/list', {
        method: 'POST'
      }),

    listAgents: async () =>
      fetchJson<{ agents: AgentConfig[] }>('/api/agents/list', {
        method: 'POST'
      }),

    saveAgent: async (agentPath, content, cwd) =>
      fetchJson<WriteFileResult>('/api/agents/save', {
        method: 'POST',
        body: JSON.stringify({ path: agentPath, content, cwd })
      }),

    listMcp: async (commandExecutable?) =>
      fetchJson<{ servers: McpServer[] }>('/api/mcp/list', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable })
      }),

    mcpAction: async (commandExecutable, action, serverName) =>
      fetchJson<CliExecResult>('/api/mcp/action', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, action, serverName })
      }),

    listSkills: async () =>
      fetchJson<{ skills: SkillEntry[] }>('/api/skills/list', {
        method: 'POST'
      }),

    listMemories: async (cwd?) =>
      fetchJson<{ memories: MemoryFile[] }>('/api/memories/list', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    saveMemory: async (filePath, content, cwd) =>
      fetchJson<WriteFileResult>('/api/memories/save', {
        method: 'POST',
        body: JSON.stringify({ path: filePath, content, cwd })
      }),

    onSessionData: (sessionId, callback) => {
      if (!sessionCallbacks.has(sessionId)) {
        sessionCallbacks.set(sessionId, { data: new Set(), exit: new Set() })
      }
      sessionCallbacks.get(sessionId)!.data.add(callback)
      ensureSocket(sessionId)
      return () => {
        const cbs = sessionCallbacks.get(sessionId)
        if (cbs) {
          cbs.data.delete(callback)
          // Clean up socket when no callbacks remain
          if (cbs.data.size === 0 && cbs.exit.size === 0) {
            const ws = sockets.get(sessionId)
            if (ws) {
              try { ws.close() } catch { /* ignore */ }
              sockets.delete(sessionId)
            }
          }
        }
      }
    },

    onSessionExit: (sessionId, callback) => {
      if (!sessionCallbacks.has(sessionId)) {
        sessionCallbacks.set(sessionId, { data: new Set(), exit: new Set() })
      }
      sessionCallbacks.get(sessionId)!.exit.add(callback)
      ensureSocket(sessionId)
      return () => {
        const cbs = sessionCallbacks.get(sessionId)
        if (cbs) {
          cbs.exit.delete(callback)
          if (cbs.data.size === 0 && cbs.exit.size === 0) {
            const ws = sockets.get(sessionId)
            if (ws) {
              try { ws.close() } catch { /* ignore */ }
              sockets.delete(sessionId)
            }
          }
        }
      }
    }
  }
}

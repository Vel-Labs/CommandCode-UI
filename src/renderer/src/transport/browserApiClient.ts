export type BrowserApiClient = {
  fetchJson: <T>(path: string, init?: RequestInit) => Promise<T>
  getToken: () => string
  wsUrl: (path: string) => string
}

type BrowserInjection = {
  token: string
  port: number
}

let cachedToken = ''
let serverUrl = ''

// In Electron production mode, the main process injects token + port into window
// before any JS loads. Read it immediately at module init time so there is no
// race between the renderer bundle and preload.
if (typeof window !== 'undefined') {
  const injected = (window as unknown as { __CCGUI__?: BrowserInjection }).__CCGUI__
  if (injected) {
    cachedToken = injected.token
    serverUrl = `http://127.0.0.1:${injected.port}`
  }

  // Browser dev mode: token arrives via Vite proxy from /api/token.
  // Same-origin cookie covers production when the server serves HTML and API.
  if (document.cookie.includes('ccgui-token=')) {
    const match = document.cookie.match(/ccgui-token=([^;]+)/)
    if (match && !cachedToken) cachedToken = match[1]!
  }
}

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return cachedToken
}

function applyAuth(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers)
  if (cachedToken) headers.set('X-Auth-Token', cachedToken)
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
  } catch {
    // The first authenticated request will surface any real connectivity issue.
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
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

export function createBrowserApiClient(): BrowserApiClient {
  return {
    fetchJson,
    getToken,
    wsUrl
  }
}

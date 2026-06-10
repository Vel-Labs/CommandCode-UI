import { createServer } from 'node:http'
import { parse as parseUrl } from 'node:url'
import { realpathSync } from 'node:fs'
import path from 'node:path'
import { CoreSessionManager, type PtySpawnFn } from '../core/sessions'
import { normalizeCwd } from '../core/cli'
import { resolveBoundaryPath } from '../shared/pathContainment'
import {
  RequestBodyTooLargeError,
  extractParams,
  extractToken,
  generateToken,
  parseBody,
  sendJson,
  serveStatic,
  setAuthCookie,
  type RequestContext,
  type RouteHandler
} from './http'
import { allowedCorsOrigin, staticAssetPath } from './staticAssets'
import { createSessionWebSocketServer } from './websocket'
import { registerCoreRoutes } from './coreRoutes'
import { registerSessionRoutes } from './sessionRoutes'
import { registerFileRoutes } from './fileRoutes'
import { registerDiscoveryRoutes } from './discoveryRoutes'
import { registerDiagnosticsRoutes } from './diagnosticsRoutes'
import { registerHookRoutes } from './hookRoutes'

function defaultPtyFactory(): PtySpawnFn | undefined {
  try {
    const { spawn: ptySpawn } = require('node-pty') as typeof import('node-pty')
    return (command: string, args: string[], options: {
      cwd: string; cols: number; rows: number; env: NodeJS.ProcessEnv
    }) => ptySpawn(command, args, {
      name: process.env.TERM || 'xterm-256color',
      cols: options.cols,
      rows: options.rows,
      cwd: options.cwd,
      env: options.env
    })
  } catch {
    return undefined
  }
}

export function createAppServer(port: number, host: string = '127.0.0.1', opts?: {
  staticDir?: string
  ptyFactory?: PtySpawnFn
  devMode?: boolean
}) {
  const staticDir = opts?.staticDir ? resolveBoundaryPath(opts.staticDir) : undefined
  const devMode = opts?.devMode ?? false
  const token = generateToken()
  const sessionManager = new CoreSessionManager(opts?.ptyFactory ?? defaultPtyFactory())
  const routes = new Map<string, Map<string, RouteHandler>>()

  const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes

  const workspaceRoots = new Map<string, string>() // sessionId → resolved workspace root
  const idleTimers = new Map<string, ReturnType<typeof setTimeout>>()

  function registerWorkspace(sessionId: string, cwd: string): void {
    try {
      workspaceRoots.set(sessionId, realpathSync(path.resolve(cwd)))
    } catch {
      workspaceRoots.set(sessionId, path.resolve(cwd))
    }
  }

  function findWorkspaceRoot(): string | undefined {
    for (const root of workspaceRoots.values()) return root
    return undefined
  }

  function cleanupSession(sessionId: string): void {
    const existing = idleTimers.get(sessionId)
    if (existing) clearTimeout(existing)
    idleTimers.delete(sessionId)
    workspaceRoots.delete(sessionId)
  }

  sessionManager.on('session:exit', (payload) => {
    cleanupSession(payload.sessionId)
  })

  function resolveWorkspaceRoot(cwdInput?: string): { root?: string; error?: string } {
    const activeRoot = findWorkspaceRoot()
    if (!cwdInput?.trim()) {
      return activeRoot ? { root: activeRoot } : { error: 'Access denied — choose a project before browsing files' }
    }

    try {
      const normalized = normalizeCwd(cwdInput)
      return { root: realpathSync(normalized) }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Invalid project directory' }
    }
  }

  // WS server is created after HTTP server

  function addRoute(method: string, pattern: string, handler: RouteHandler): void {
    let methodMap = routes.get(method)
    if (!methodMap) {
      methodMap = new Map()
      routes.set(method, methodMap)
    }
    methodMap.set(pattern, handler)
  }

  // REST endpoints
  registerCoreRoutes(addRoute)
  registerSessionRoutes(addRoute, {
    sessionManager,
    registerWorkspace,
    cleanupSession,
    resetIdleTimer
  })

  registerFileRoutes(addRoute, { resolveWorkspaceRoot })
  registerDiscoveryRoutes(addRoute, { resolveWorkspaceRoot })
  registerDiagnosticsRoutes(addRoute)
  registerHookRoutes(addRoute, { resolveWorkspaceRoot })

  const httpServer = createServer(async (req, res) => {
    // CORS: strict Origin handling for localhost
    const origin = req.headers.origin
    res.setHeader('Access-Control-Allow-Origin', allowedCorsOrigin(origin, devMode))
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Auth-Token')
    res.setHeader('Access-Control-Allow-Credentials', 'true')

    if (req.method === 'OPTIONS') {
      if (!origin && !devMode) {
        res.writeHead(403)
        res.end()
        return
      }
      res.writeHead(204)
      res.end()
      return
    }

    const parsed = parseUrl(req.url ?? '/', true)
    const pathname = parsed.pathname ?? '/'

    // Determine auth state BEFORE handling any request
    const reqToken = extractToken(req)
    const isAuthenticated = !!reqToken && reqToken === token

    // /health — always unauthenticated, never sets cookie
    if (req.method === 'GET' && pathname === '/health') {
      sendJson(res, 200, { ok: true })
      return
    }

    // /api/token — only available in dev mode; never sets cookie
    if (req.method === 'GET' && pathname === '/api/token') {
      if (devMode) {
        sendJson(res, 200, { token })
      } else {
        sendJson(res, 404, { error: 'Not found' })
      }
      return
    }

    // Tokenized initial load: GET /?token=xxx or GET /index.html?token=xxx
    // If valid, set the HttpOnly cookie and redirect to strip the token from the URL.
    // If invalid, return 401 without setting any cookie.
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      const queryToken = parsed.query.token
      if (typeof queryToken === 'string') {
        if (queryToken === token) {
          setAuthCookie(res, token)
          res.writeHead(302, { Location: '/' })
          res.end()
          return
        }
        sendJson(res, 401, { error: 'Unauthorized' })
        return
      }
    }

    // API routes must be matched before static fallback, including GET routes
    // such as /api/pty-health. Otherwise the SPA index can mask API failures.
    if (pathname.startsWith('/api/')) {
      if (!isAuthenticated) {
        sendJson(res, 401, { error: 'Unauthorized' })
        return
      }

      setAuthCookie(res, token)

      const methodMap = routes.get(req.method ?? '')
      if (!methodMap) {
        sendJson(res, 404, { error: 'Not found' })
        return
      }

      let matchedHandler: RouteHandler | undefined
      let matchedParams: Record<string, string> = {}

      for (const [pattern, handler] of methodMap) {
        const params = extractParams(pathname, pattern)
        if (params) {
          matchedHandler = handler
          matchedParams = params
          break
        }
      }

      if (!matchedHandler) {
        sendJson(res, 404, { error: 'Not found' })
        return
      }

      try {
        const body = req.method !== 'GET' && req.method !== 'DELETE'
          ? await parseBody(req)
          : {}

        const ctx: RequestContext = { req, res, body, params: matchedParams }
        const result = await matchedHandler(ctx)
        sendJson(res, 200, result)
      } catch (err) {
        if (err instanceof RequestBodyTooLargeError) {
          sendJson(res, 413, { error: 'Request body too large' })
          return
        }
        const message = err instanceof Error ? err.message : 'Internal server error'
        sendJson(res, 500, { error: message })
      }
      return
    }

    // Static file serving — set cookie only when already authenticated
    if (req.method === 'GET' && staticDir) {
      const fullPath = staticAssetPath(staticDir, pathname)
      if (fullPath) {
        if (isAuthenticated) setAuthCookie(res, token)
        serveStatic(res, fullPath)
        return
      }
    }

    // All other routes require authentication
    if (!isAuthenticated) {
      sendJson(res, 401, { error: 'Unauthorized' })
      return
    }

    // Refresh cookie on authenticated responses
    setAuthCookie(res, token)

    // Route matching
    const methodMap = routes.get(req.method ?? '')
    if (!methodMap) {
      sendJson(res, 404, { error: 'Not found' })
      return
    }

    let matchedHandler: RouteHandler | undefined
    let matchedParams: Record<string, string> = {}

    for (const [pattern, handler] of methodMap) {
      const params = extractParams(pathname, pattern)
      if (params) {
        matchedHandler = handler
        matchedParams = params
        break
      }
    }

    if (!matchedHandler) {
      sendJson(res, 404, { error: 'Not found' })
      return
    }

    try {
      const body = req.method !== 'GET' && req.method !== 'DELETE'
        ? await parseBody(req)
        : {}

      const ctx: RequestContext = { req, res, body, params: matchedParams }
      const result = await matchedHandler(ctx)
      sendJson(res, 200, result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error'
      sendJson(res, 500, { error: message })
    }
  })

  const wss = createSessionWebSocketServer({
    httpServer,
    token,
    sessionManager,
    resetIdleTimer
  })

  function resetIdleTimer(sessionId: string): void {
    const existing = idleTimers.get(sessionId)
    if (existing) clearTimeout(existing)
    idleTimers.set(sessionId, setTimeout(() => {
      sessionManager.forceKill(sessionId)
      cleanupSession(sessionId)
    }, SESSION_IDLE_TIMEOUT))
  }

  let actualPort = port
  let actualUrl = `http://${host}:${port}`
  let actualAuthUrl = `http://${host}:${port}?token=${token}`

  const cookieHeader = `ccgui-token=${token}; Path=/; HttpOnly; SameSite=Strict`

  return {
    httpServer,
    wss,
    token,
    get url() { return actualUrl },
    get authUrl() { return actualAuthUrl },
    cookieHeader,
    sessionManager,
    start: () => {
      return new Promise<void>((resolve) => {
        httpServer.listen(port, host, () => {
          const addr = httpServer.address()
          if (typeof addr === 'object' && addr) {
            actualPort = addr.port
            actualUrl = `http://${host}:${actualPort}`
            actualAuthUrl = `http://${host}:${actualPort}?token=${token}`
          }
          console.log(`Command Code GUI server listening on ${actualUrl}`)
          console.log(`Auth token: ${token}`)
          console.log(`Browser URL: ${actualAuthUrl}`)
          resolve()
        })
      })
    },
    stop: () => {
      return new Promise<void>((resolve) => {
        for (const timer of idleTimers.values()) clearTimeout(timer)
        idleTimers.clear()
        sessionManager.killAll()
        workspaceRoots.clear()
        wss.close()
        httpServer.close(() => resolve())
      })
    }
  }
}

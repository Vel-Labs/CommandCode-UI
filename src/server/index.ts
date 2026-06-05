import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { randomBytes } from 'node:crypto'
import { parse as parseUrl } from 'node:url'
import { readFileSync, existsSync, readdirSync, statSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { WebSocketServer, WebSocket } from 'ws'
import { CoreSessionManager, type PtySpawnFn } from '../core/sessions'
import { ptyDoctorAsync } from '../core/ptyDoctor'
import {
  checkCommandCode,
  commandCodeStatus,
  listModels,
  runHeadless,
  runProcess,
  getCommandExecutable,
  normalizeCwd
} from '../core/cli'
import {
  discoverSessions,
  usageSummary,
  listTastePackages,
  listAgents,
  saveAgent,
  listMcp,
  mcpAction,
  listSkills,
  listMemories,
  saveMemory
} from '../core/discovery'
import type {
  CliExecResult,
  DiscoveredSession,
  FileEntry,
  HeadlessRunOptions,
  IdeStatusResult,
  MemoryFile,
  SessionStartOptions,
  SessionStartResult,
  SkillEntry,
  TastePackage,
  UsageSummary
} from '../core/types'

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

type RequestContext = {
  req: IncomingMessage
  res: ServerResponse
  body: unknown
  params: Record<string, string>
}

type RouteHandler = (ctx: RequestContext) => Promise<unknown>

function extractToken(req: IncomingMessage): string | undefined {
  // Cookie first — same-origin Electron + production serve
  const cookieHeader = req.headers.cookie
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)ccgui-token=([^;]+)/)
    if (match) return match[1]
  }

  // Custom header — dev mode Vite proxy
  const authToken = req.headers['x-auth-token']
  if (typeof authToken === 'string' && authToken.length > 0) return authToken

  // Query param — initial page load or non-cookie access
  const url = parseUrl(req.url ?? '/', true)
  const queryToken = url.query.token
  if (typeof queryToken === 'string') return queryToken

  // Bearer token — programmatic access
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)

  return undefined
}

const MAX_BODY_BYTES = 1_048_576 // 1MB

function parseBody(req: IncomingMessage, maxBytes: number = MAX_BODY_BYTES): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let total = 0
    req.on('data', (chunk: Buffer) => {
      total += chunk.length
      if (total > maxBytes) {
        req.destroy()
        reject(new Error('Request body too large'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw.trim()) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function extractParams(pathname: string, pattern: string): Record<string, string> | null {
  const pathParts = pathname.split('/').filter(Boolean)
  const patternParts = pattern.split('/').filter(Boolean)

  if (pathParts.length !== patternParts.length) return null

  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]!
    const ppath = pathParts[i]!

    if (pp.startsWith(':')) {
      params[pp.slice(1)] = ppath
    } else if (pp !== ppath) {
      return null
    }
  }

  return params
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  })
  res.end(body)
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const types: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2'
  }
  return types[ext] ?? 'application/octet-stream'
}

function serveStatic(res: ServerResponse, filePath: string): void {
  if (!existsSync(filePath)) {
    res.writeHead(404)
    res.end('Not found')
    return
  }
  const content = readFileSync(filePath)
  res.writeHead(200, {
    'Content-Type': getContentType(filePath),
    'Content-Length': content.length
  })
  res.end(content)
}

function setAuthCookie(res: ServerResponse, token: string): void {
  res.setHeader('Set-Cookie', `ccgui-token=${token}; Path=/; HttpOnly; SameSite=Strict`)
}

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
  const staticDir = opts?.staticDir
  const devMode = opts?.devMode ?? false
  const token = generateToken()
  const sessionManager = new CoreSessionManager(opts?.ptyFactory ?? defaultPtyFactory())
  const routes = new Map<string, Map<string, RouteHandler>>()

  const MAX_FILE_READ_BYTES = 1_048_576 // 1MB
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

  function isPathUnderRoot(filePath: string, root: string): boolean {
    const resolved = path.resolve(filePath)
    let realTarget: string
    try { realTarget = realpathSync(resolved) } catch { realTarget = resolved }
    let realRoot: string
    try { realRoot = realpathSync(root) } catch { realRoot = root }
    return realTarget.startsWith(realRoot + path.sep) || realTarget === realRoot
  }

  function findWorkspaceRoot(): string | undefined {
    for (const root of workspaceRoots.values()) return root
    return undefined
  }

  const ALLOWED_MEMORY_NAMES = new Set(['COMMANDCODE.md', 'AGENTS.md', 'CLAUDE.md'])

  function isAllowedMemoryPath(filePath: string, root: string): boolean {
    if (!isPathUnderRoot(filePath, root)) return false
    const relative = path.relative(root, filePath)
    const base = path.basename(filePath)
    if (ALLOWED_MEMORY_NAMES.has(base)) return true
    if (relative.startsWith('.commandcode' + path.sep + 'memory' + path.sep)) return true
    return false
  }

  function isAllowedAgentPath(filePath: string, root: string): boolean {
    if (!isPathUnderRoot(filePath, root)) return false
    const relative = path.relative(root, filePath)
    return relative.startsWith('.commandcode' + path.sep + 'agents' + path.sep)
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
  addRoute('GET', '/health', async () => ({ ok: true }))

  addRoute('GET', '/api/pty-health', async () => {
    return ptyDoctorAsync()
  })

  addRoute('POST', '/api/check', async ({ body }) => {
    const { commandExecutable } = body as Record<string, unknown>
    return checkCommandCode(typeof commandExecutable === 'string' ? commandExecutable : undefined)
  })

  addRoute('POST', '/api/status', async ({ body }) => {
    const { commandExecutable, cwd } = body as Record<string, unknown>
    return commandCodeStatus(
      typeof commandExecutable === 'string' ? commandExecutable : undefined,
      typeof cwd === 'string' ? cwd : undefined
    )
  })

  addRoute('POST', '/api/models', async ({ body }) => {
    const { commandExecutable, cwd } = body as Record<string, unknown>
    return listModels(
      typeof commandExecutable === 'string' ? commandExecutable : undefined,
      typeof cwd === 'string' ? cwd : undefined
    )
  })

  addRoute('POST', '/api/headless', async ({ body }) => {
    const options = body as HeadlessRunOptions
    if (options.useMock) {
      return {
        command: getCommandExecutable(options.commandExecutable),
        args: [],
        cwd: normalizeCwd(options.cwd),
        exitCode: 0,
        signal: null,
        stdout: `[Mock headless] Would run: ${options.prompt}\nModel: ${options.model || 'default'}\nMax turns: ${options.maxTurns ?? 'unlimited'}\nYolo: ${options.yolo ? 'yes' : 'no'}`,
        stderr: '',
        timedOut: false,
        durationMs: 0
      }
    }
    return runHeadless(options)
  })

  addRoute('POST', '/api/sessions', async ({ body }) => {
    const options = body as SessionStartOptions
    const result = sessionManager.start(options)
    registerWorkspace(result.id, result.cwd)
    resetIdleTimer(result.id)
    return result
  })

  addRoute('POST', '/api/sessions/:id/write', async ({ body, params }) => {
    const { data } = body as { data?: string }
    sessionManager.write(params.id!, data ?? '')
    resetIdleTimer(params.id!)
    return { ok: true }
  })

  addRoute('POST', '/api/sessions/:id/resize', async ({ body, params }) => {
    const { cols, rows } = body as { cols?: number; rows?: number }
    sessionManager.resize(params.id!, cols ?? 80, rows ?? 24)
    return { ok: true }
  })

  addRoute('POST', '/api/sessions/:id/stop', async ({ params }) => {
    sessionManager.stop(params.id!)
    resetIdleTimer(params.id!)
    return { ok: true }
  })

  addRoute('POST', '/api/sessions/:id/interrupt', async ({ params }) => {
    sessionManager.interrupt(params.id!)
    resetIdleTimer(params.id!)
    return { ok: true }
  })

  addRoute('DELETE', '/api/sessions/:id', async ({ params }) => {
    sessionManager.forceKill(params.id!)
    return { ok: true }
  })

  // File system browsing — contained to registered workspace roots
  addRoute('POST', '/api/files/list', async ({ body }) => {
    const { dir } = body as { dir?: string }
    const target = path.resolve(dir ?? '.')
    const wsRoot = findWorkspaceRoot()

    if (!existsSync(target) || !statSync(target).isDirectory()) {
      return { error: 'Directory not found', entries: [] }
    }

    if (wsRoot && !isPathUnderRoot(target, wsRoot)) {
      return { error: 'Access denied — path outside workspace root', entries: [] }
    }

    const entries: FileEntry[] = readdirSync(target)
      .map((name) => {
        const fullPath = path.join(target, name)
        let isDirectory = false
        let size: number | undefined
        try {
          const s = statSync(fullPath)
          isDirectory = s.isDirectory()
          size = s.size
        } catch { /* skip permission errors */ }
        return { name, path: fullPath, isDirectory, size }
      })
      .filter((e) => !e.name.startsWith('.') || e.name === '.commandcode')
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name)
      })

    return { entries, dir: target }
  })

  addRoute('POST', '/api/files/read', async ({ body }) => {
    const { filePath: fp } = body as { filePath?: string }
    if (!fp) return { error: 'No path provided' }
    const resolved = path.resolve(fp)
    const wsRoot = findWorkspaceRoot()

    if (wsRoot && !isPathUnderRoot(resolved, wsRoot)) {
      return { error: 'Access denied — path outside workspace root' }
    }

    if (!existsSync(resolved) || statSync(resolved).isDirectory()) {
      return { error: 'File not found' }
    }

    const stat = statSync(resolved)
    if (stat.size > MAX_FILE_READ_BYTES) {
      return { error: `File too large (${(stat.size / 1024 / 1024).toFixed(1)}MB). Max: 1MB.` }
    }

    const content = readFileSync(resolved, 'utf8')
    const ext = path.extname(resolved).toLowerCase()
    return { content, path: resolved, ext }
  })

  // IDE diagnostics
  addRoute('POST', '/api/ide-status', async ({ body }) => {
    const { commandExecutable, cwd } = body as { commandExecutable?: string; cwd?: string }
    const command = commandExecutable?.trim() || process.env.COMMAND_CODE_BIN || 'cmd'
    const dir = cwd?.trim() || '.'
    const result = await runProcess(command, ['--ide-status'], dir, 30_000)

    const lines = result.stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    const ideResult: IdeStatusResult = {
      ok: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      lines,
      error: result.exitCode === 0 ? undefined : `Command exited with ${result.exitCode}`
    }

    return ideResult
  })

  // Session discovery & usage & taste/agents/MCP/skills/memory
  addRoute('POST', '/api/sessions/discover', async () => {
    return { sessions: discoverSessions() }
  })

  addRoute('POST', '/api/usage', async ({ body }) => {
    const { commandExecutable, cwd } = body as { commandExecutable?: string; cwd?: string }
    return usageSummary(commandExecutable, cwd)
  })

  addRoute('POST', '/api/taste/list', async () => {
    return { packages: listTastePackages() }
  })

  addRoute('POST', '/api/agents/list', async () => {
    return { agents: listAgents() }
  })

  addRoute('POST', '/api/agents/save', async ({ body }) => {
    const { path: agentPath, content } = body as { path?: string; content?: string }
    if (!agentPath || content == null) return { ok: false, error: 'Missing path or content' }
    const wsRoot = findWorkspaceRoot()
    if (wsRoot && !isAllowedAgentPath(agentPath, wsRoot)) {
      return { ok: false, error: 'Access denied — agent path must be under .commandcode/agents/' }
    }
    const ok = saveAgent(agentPath, content)
    return { ok, error: ok ? undefined : 'Failed to save agent config' }
  })

  addRoute('POST', '/api/mcp/list', async ({ body }) => {
    const { commandExecutable } = body as { commandExecutable?: string }
    return { servers: await listMcp(commandExecutable) }
  })

  addRoute('POST', '/api/mcp/action', async ({ body }) => {
    const { commandExecutable, action, serverName } = body as {
      commandExecutable?: string
      action?: string
      serverName?: string
    }
    if (!action || !serverName) return { ok: false, error: 'Missing action or serverName' }
    const act = action as 'connect' | 'disconnect'
    if (act !== 'connect' && act !== 'disconnect') return { ok: false, error: 'Action must be connect or disconnect' }
    return mcpAction(commandExecutable, act, serverName)
  })

  addRoute('POST', '/api/skills/list', async () => {
    return { skills: listSkills() }
  })

  addRoute('POST', '/api/memories/list', async ({ body }) => {
    const { cwd } = body as { cwd?: string }
    return { memories: listMemories(cwd) }
  })

  addRoute('POST', '/api/memories/save', async ({ body }) => {
    const { path: memPath, content } = body as { path?: string; content?: string }
    if (!memPath || content == null) return { ok: false, error: 'Missing path or content' }
    const wsRoot = findWorkspaceRoot()
    if (wsRoot && !isAllowedMemoryPath(memPath, wsRoot)) {
      return { ok: false, error: 'Access denied — memory only writable to COMMANDCODE.md, AGENTS.md, CLAUDE.md, or .commandcode/memory/' }
    }
    const ok = saveMemory(memPath, content)
    return { ok, error: ok ? undefined : 'Failed to save memory file' }
  })

  const httpServer = createServer(async (req, res) => {
    // CORS: strict Origin handling for localhost
    const origin = req.headers.origin
    const allowOrigin = (origin && (
      origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost')
    )) ? origin : devMode ? '*' : 'null'
    res.setHeader('Access-Control-Allow-Origin', allowOrigin)
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
        const message = err instanceof Error ? err.message : 'Internal server error'
        sendJson(res, 500, { error: message })
      }
      return
    }

    // Static file serving — set cookie only when already authenticated
    if (req.method === 'GET' && staticDir) {
      const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '')
      const resolved = path.join(staticDir, safePath)
      if (resolved.startsWith(staticDir)) {
        const targetPath = safePath === '/' || safePath === '/status' ? 'index.html' : safePath
        const fullPath = path.join(staticDir, targetPath)
        if (existsSync(fullPath)) {
          if (isAuthenticated) setAuthCookie(res, token)
          serveStatic(res, fullPath)
          return
        }
        const indexPath = path.join(staticDir, 'index.html')
        if (existsSync(indexPath)) {
          if (isAuthenticated) setAuthCookie(res, token)
          serveStatic(res, indexPath)
          return
        }
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

    // Send replay buffer on connect so early output is never lost
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

    const onExit = (payload: { sessionId: string }) => {
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
        // Ignore malformed messages
      }
    })
  })

  function resetIdleTimer(sessionId: string): void {
    const existing = idleTimers.get(sessionId)
    if (existing) clearTimeout(existing)
    idleTimers.set(sessionId, setTimeout(() => {
      sessionManager.forceKill(sessionId)
      idleTimers.delete(sessionId)
      workspaceRoots.delete(sessionId)
    }, SESSION_IDLE_TIMEOUT))
  }

  let actualPort = port
  let actualUrl = `http://${host}:${port}`
  let actualAuthUrl = `http://${host}:${port}?token=${token}`

  function getUrl(): string {
    return actualUrl
  }

  function getAuthUrl(): string {
    return actualAuthUrl
  }
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
        wss.close()
        httpServer.close(() => resolve())
      })
    }
  }
}

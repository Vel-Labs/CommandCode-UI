import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse as parseUrl } from 'node:url'

export type RequestContext = {
  req: IncomingMessage
  res: ServerResponse
  body: unknown
  params: Record<string, string>
}

export type RouteHandler = (ctx: RequestContext) => Promise<unknown>

export const MAX_BODY_BYTES = 1_048_576 // 1MB

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super('Request body too large')
    this.name = 'RequestBodyTooLargeError'
  }
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function extractToken(req: IncomingMessage): string | undefined {
  // Cookie first: same-origin Electron + production serve.
  const cookieHeader = req.headers.cookie
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)ccgui-token=([^;]+)/)
    if (match) return match[1]
  }

  // Custom header: dev mode Vite proxy.
  const authToken = req.headers['x-auth-token']
  if (typeof authToken === 'string' && authToken.length > 0) return authToken

  // Query param: initial page load or non-cookie access.
  const url = parseUrl(req.url ?? '/', true)
  const queryToken = url.query.token
  if (typeof queryToken === 'string') return queryToken

  // Bearer token: programmatic access.
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)

  return undefined
}

export function parseBody(req: IncomingMessage, maxBytes: number = MAX_BODY_BYTES): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let total = 0
    let tooLarge = false
    req.on('data', (chunk: Buffer) => {
      if (tooLarge) return
      total += chunk.length
      if (total > maxBytes) {
        tooLarge = true
        chunks.length = 0
        reject(new RequestBodyTooLargeError())
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (tooLarge) return
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

export function extractParams(pathname: string, pattern: string): Record<string, string> | null {
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

export function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  })
  res.end(body)
}

export function getContentType(filePath: string): string {
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

export function serveStatic(res: ServerResponse, filePath: string): void {
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

export function setAuthCookie(res: ServerResponse, token: string): void {
  res.setHeader('Set-Cookie', `ccgui-token=${token}; Path=/; HttpOnly; SameSite=Strict`)
}

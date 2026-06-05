import { createAppServer } from '../src/server/index'

async function main() {
  const app = createAppServer(0)
  const token = app.token
  console.log(`Token: ${token}`)

  await app.start()
  const addr = app.httpServer.address()
  const port = typeof addr === 'object' && addr ? addr.port : 'unknown'
  const base = `http://127.0.0.1:${port}`

  // Test health (no auth required)
  const healthRes = await fetch(`${base}/health`)
  const health = await healthRes.json()
  console.log('GET /health:', healthRes.status, JSON.stringify(health))

  // Verify /health does NOT set an auth cookie
  const healthCookie = healthRes.headers.get('set-cookie') || ''
  if (healthCookie.includes('ccgui-token')) {
    console.log('FAIL: /health set ccgui-token cookie')
    process.exit(1)
  } else {
    console.log('PASS: /health did not set cookie')
  }

  // Test auth failure
  const noAuthRes = await fetch(`${base}/api/check`, { method: 'POST', body: '{}' })
  console.log('POST /api/check (no token):', noAuthRes.status)

  // Verify 401 does NOT set an auth cookie
  const noAuthCookie = noAuthRes.headers.get('set-cookie') || ''
  if (noAuthCookie.includes('ccgui-token')) {
    console.log('FAIL: 401 set ccgui-token cookie')
    process.exit(1)
  } else {
    console.log('PASS: 401 did not set cookie')
  }

  // Test real endpoints with token
  const tokenUrl = (path: string) => `${base}${path}?token=${token}`

  // Test PTY health
  const ptyHealthRes = await fetch(tokenUrl('/api/pty-health'))
  const ptyHealth = await ptyHealthRes.json() as Record<string, unknown>
  console.log('GET /api/pty-health:', ptyHealthRes.status, `available=${ptyHealth.available} healthy=${ptyHealth.healthy}`)

  const checkRes = await fetch(tokenUrl('/api/check'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commandExecutable: 'cmd' })
  })
  console.log('POST /api/check:', checkRes.status, JSON.stringify(await checkRes.json()).slice(0, 120))

  const statusRes = await fetch(tokenUrl('/api/status'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commandExecutable: 'cmd' })
  })
  console.log('POST /api/status:', statusRes.status)

  // Test mock session via REST
  const sessionRes = await fetch(tokenUrl('/api/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cwd: '.', useMock: true })
  })
  const session = await sessionRes.json() as Record<string, unknown>
  console.log('POST /api/sessions (mock):', sessionRes.status, `id=${session.id}`)

  const writeRes = await fetch(tokenUrl(`/api/sessions/${session.id}/write`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: '/exit\r' })
  })
  console.log('POST /api/sessions/:id/write:', writeRes.status)

  // Start a new session for WS test
  const wsSessionRes = await fetch(tokenUrl('/api/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cwd: '.', useMock: true })
  })
  const wsSession = await wsSessionRes.json() as Record<string, unknown>
  console.log('WS session created:', wsSession.id)

  // Test mock headless with useMock
  const mockHeadlessRes = await fetch(tokenUrl('/api/headless'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cwd: '.', useMock: true, prompt: 'hello' })
  })
  const mockHeadless = await mockHeadlessRes.json() as Record<string, unknown>
  const stdoutStr = String(mockHeadless.stdout || '')
  console.log('POST /api/headless (useMock):', mockHeadlessRes.status, `mock=${stdoutStr.includes('[Mock headless]')}`)

  // Test tokenized initial load
  const badTokenRes = await fetch(`${base}/?token=bad`)
  console.log('GET /?token=bad:', badTokenRes.status, '(expect 401)')

  const goodTokenRes = await fetch(`${base}/?token=${token}`, { redirect: 'manual' })
  console.log('GET /?token=real:', goodTokenRes.status, '(expect 302)')
  const goodCookie = goodTokenRes.headers.get('set-cookie') || ''
  console.log('Redirect sets cookie:', goodCookie.includes('ccgui-token'))

  // Cleanup
  const deleteRes = await fetch(tokenUrl(`/api/sessions/${wsSession.id}`), {
    method: 'DELETE'
  })
  console.log('DELETE /api/sessions/:id:', deleteRes.status)

  await app.stop()
  console.log('\n✔ Server smoke test complete')
}

main()

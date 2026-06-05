import { createAppServer } from '../src/server/index'

async function main() {
  const app = createAppServer(0, '127.0.0.1')
  await app.start()

  const addr = app.httpServer.address()
  const port = typeof addr === 'object' && addr ? addr.port : 'unknown'
  const base = `http://127.0.0.1:${port}`
  const token = app.token

  // Simulate browser: token via X-Auth-Token header (dev mode) and cookie (prod mode)
  const headers = (extra?: Record<string, string>) => ({
    'Content-Type': 'application/json',
    'Cookie': `ccgui-token=${token}`,
    ...extra
  })

  // 7.1 Headless mock task — use useMock: true
  const mockHeadless = await fetch(`${base}/api/headless`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      cwd: '/tmp',
      prompt: 'hello',
      useMock: true
    })
  })
  const mockResult = await mockHeadless.json() as Record<string, unknown>
  const isMock = String(mockResult.stdout || '').includes('[Mock headless]')
  console.log('7.1 Headless mock (useMock):', mockHeadless.status, isMock ? 'PASS mock' : 'FAIL no mock')

  // 7.2 Headless real task
  const realHeadless = await fetch(`${base}/api/headless`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ cwd: '/tmp', prompt: 'what is 2+2', commandExecutable: 'cmd' })
  })
  console.log('7.2 Headless real (cmd --print):', realHeadless.status, realHeadless.ok ? 'started' : 'failed')

  // 7.3 Interactive mock session
  const sessionRes = await fetch(`${base}/api/sessions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ cwd: '.', useMock: true })
  })
  const session = await sessionRes.json() as Record<string, unknown>
  console.log('7.3 Mock session created:', session.id)

  // Write to session
  await fetch(`${base}/api/sessions/${session.id}/write`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ data: '/exit\r' })
  })
  console.log('7.3 Mock session exited via /exit write')

  // 7.4 Token validation: no token = 401
  const noAuth = await fetch(`${base}/api/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })
  console.log('7.4 No auth:', noAuth.status === 401 ? 'PASS 401' : 'FAIL')

  // Verify /health does NOT set cookie
  const healthRes = await fetch(`${base}/health`)
  const healthCookie = healthRes.headers.get('set-cookie') || ''
  const healthNoCookie = !healthCookie.includes('ccgui-token')
  console.log('7.4 /health no cookie:', healthNoCookie ? 'PASS' : 'FAIL')

  // Wrong token = 401
  const badAuth = await fetch(`${base}/api/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'ccgui-token=wrong'
    },
    body: '{}'
  })
  console.log('7.4 Wrong token:', badAuth.status === 401 ? 'PASS 401' : 'FAIL')

  // X-Auth-Token header (dev mode)
  const headerAuth = await fetch(`${base}/api/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token
    },
    body: '{}'
  })
  console.log('7.4 X-Auth-Token header:', headerAuth.status === 200 ? 'PASS 200' : 'FAIL')

  await app.stop()
  console.log('\n✔ Browser integration smoke test complete')
  process.exit(0)
}

main()

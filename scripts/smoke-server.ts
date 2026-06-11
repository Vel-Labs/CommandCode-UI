import { createAppServer } from '../src/server/index'
import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import path from 'node:path'

async function main() {
  const app = createAppServer(0)
  const prefsProject = mkdtempSync(path.join(tmpdir(), 'ccgui-prefs-'))
  const appPrefsPath = path.join(homedir(), '.commandcode', 'gui-preferences.json')
  const originalAppPrefs = existsSync(appPrefsPath) ? readFileSync(appPrefsPath, 'utf8') : undefined
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
    body: JSON.stringify({ commandExecutable: 'cmd', cwd: process.cwd() })
  })
  console.log('POST /api/status:', statusRes.status)

  const updateRes = await fetch(tokenUrl('/api/update'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commandExecutable: 'cmd', cwd: process.cwd(), checkOnly: true })
  })
  const update = await updateRes.json() as Record<string, unknown>
  console.log('POST /api/update (checkOnly):', updateRes.status, `checkOnly=${update.checkOnly} ok=${update.ok}`)

  const appPrefsSaveRes = await fetch(tokenUrl('/api/app/preferences/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preferences: {
        version: 1,
        cwd: prefsProject,
        recentProjects: [prefsProject],
        commandExecutable: 'cmd',
        model: 'deepseek/deepseek-v4-pro',
        appearanceTheme: 'cc-spectrum'
      }
    })
  })
  const appPrefsSave = await appPrefsSaveRes.json() as Record<string, unknown>
  console.log('POST /api/app/preferences/save:', appPrefsSaveRes.status, `ok=${appPrefsSave.ok}`)

  const appPrefsLoadRes = await fetch(tokenUrl('/api/app/preferences'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  const appPrefsLoad = await appPrefsLoadRes.json() as { ok?: boolean; preferences?: { cwd?: string } }
  console.log('POST /api/app/preferences:', appPrefsLoadRes.status, `ok=${appPrefsLoad.ok} cwd=${appPrefsLoad.preferences?.cwd ? 'set' : ''}`)

  const prefsSaveRes = await fetch(tokenUrl('/api/project/preferences/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cwd: prefsProject,
      preferences: {
        version: 1,
        model: 'deepseek/deepseek-v4-pro',
        runtimeMode: 'real-session',
        permissionMode: 'standard',
        trust: false,
        skipOnboarding: false,
        headlessMaxTurns: 10,
        headlessYolo: false,
        appearanceTheme: 'cc-spectrum'
      }
    })
  })
  const prefsSave = await prefsSaveRes.json() as Record<string, unknown>
  console.log('POST /api/project/preferences/save:', prefsSaveRes.status, `ok=${prefsSave.ok}`)

  const prefsLoadRes = await fetch(tokenUrl('/api/project/preferences'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cwd: prefsProject })
  })
  const prefsLoad = await prefsLoadRes.json() as { ok?: boolean; preferences?: { model?: string } }
  console.log('POST /api/project/preferences:', prefsLoadRes.status, `ok=${prefsLoad.ok} model=${prefsLoad.preferences?.model || ''}`)

  const discoveredSessionsRes = await fetch(tokenUrl('/api/sessions/discover'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cwd: '.' })
  })
  const discoveredSessions = await discoveredSessionsRes.json() as { sessions?: unknown[] }
  console.log('POST /api/sessions/discover (cwd):', discoveredSessionsRes.status, `sessions=${discoveredSessions.sessions?.length ?? 0}`)

  const firstDiscoveredSession = discoveredSessions.sessions?.find((session): session is { transcriptPath: string } => {
    return Boolean(session && typeof session === 'object' && typeof (session as { transcriptPath?: unknown }).transcriptPath === 'string')
  })
  if (firstDiscoveredSession) {
    const transcriptRes = await fetch(tokenUrl('/api/sessions/transcript'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcriptPath: firstDiscoveredSession.transcriptPath })
    })
    const transcript = await transcriptRes.json() as { content?: string; error?: string }
    console.log('POST /api/sessions/transcript:', transcriptRes.status, `read=${Boolean(transcript.content)} error=${transcript.error || ''}`)
  }

  const commandCodeReferenceRes = await fetch(tokenUrl('/api/project/commandcode-reference'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cwd: process.cwd() })
  })
  const commandCodeReference = await commandCodeReferenceRes.json() as { reference?: { sections?: unknown[] } }
  console.log('POST /api/project/commandcode-reference:', commandCodeReferenceRes.status, `sections=${commandCodeReference.reference?.sections?.length ?? 0}`)

  const gitStatusRes = await fetch(tokenUrl('/api/git/status'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cwd: process.cwd() })
  })
  const gitStatus = await gitStatusRes.json() as { ok?: boolean; branch?: string; filesChanged?: number; error?: string }
  console.log('POST /api/git/status:', gitStatusRes.status, `ok=${gitStatus.ok} branch=${gitStatus.branch || ''} files=${gitStatus.filesChanged ?? 0} error=${gitStatus.error || ''}`)

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
  if (originalAppPrefs !== undefined) {
    writeFileSync(appPrefsPath, originalAppPrefs, 'utf8')
  } else if (existsSync(appPrefsPath)) {
    unlinkSync(appPrefsPath)
  }
  rmSync(prefsProject, { recursive: true, force: true })
  console.log('\n✔ Server smoke test complete')
}

main()

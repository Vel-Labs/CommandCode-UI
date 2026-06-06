import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createAppServer } from '../src/server/index'

type TestServer = ReturnType<typeof createAppServer>

const servers: TestServer[] = []
const tempDirs: string[] = []

async function startServer(): Promise<TestServer> {
  const app = createAppServer(0)
  await app.start()
  servers.push(app)
  return app
}

function tempProject(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'ccgui-security-'))
  tempDirs.push(dir)
  return dir
}

async function apiPost<T>(app: TestServer, route: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${app.url}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': app.token
    },
    body: JSON.stringify(body)
  })
  expect(res.status).toBe(200)
  return res.json() as Promise<T>
}

async function apiDelete(app: TestServer, route: string): Promise<void> {
  const res = await fetch(`${app.url}${route}`, {
    method: 'DELETE',
    headers: { 'X-Auth-Token': app.token }
  })
  expect(res.status).toBe(200)
}

afterEach(async () => {
  while (servers.length) {
    const app = servers.pop()!
    await app.stop()
  }
  while (tempDirs.length) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true })
  }
})

describe('server filesystem boundaries', () => {
  it('fails closed for file and write routes when no workspace root is available', async () => {
    const app = await startServer()
    const project = tempProject()
    const outsideFile = path.join(project, 'outside.txt')
    writeFileSync(outsideFile, 'secret', 'utf8')

    const listed = await apiPost<{ entries: unknown[]; error?: string }>(app, '/api/files/list', { dir: project })
    expect(listed.entries).toEqual([])
    expect(listed.error).toContain('Access denied')

    const read = await apiPost<{ content?: string; error?: string }>(app, '/api/files/read', { filePath: outsideFile })
    expect(read.content).toBeUndefined()
    expect(read.error).toContain('Access denied')

    const agentSave = await apiPost<{ ok: boolean; error?: string }>(app, '/api/agents/save', {
      path: path.join(project, '.commandcode', 'agents', 'agent.md'),
      content: 'agent'
    })
    expect(agentSave.ok).toBe(false)
    expect(agentSave.error).toContain('Access denied')

    const memorySave = await apiPost<{ ok: boolean; error?: string }>(app, '/api/memories/save', {
      path: path.join(project, 'AGENTS.md'),
      content: 'memory'
    })
    expect(memorySave.ok).toBe(false)
    expect(memorySave.error).toContain('Access denied')
  })

  it('uses explicit cwd to constrain file reads and allowed writes to that project', async () => {
    const app = await startServer()
    const project = tempProject()
    const outside = tempProject()
    const projectFile = path.join(project, 'inside.txt')
    const outsideFile = path.join(outside, 'outside.txt')
    const agentPath = path.join(project, '.commandcode', 'agents', 'agent.md')
    const memoryPath = path.join(project, 'AGENTS.md')

    mkdirSync(path.dirname(agentPath), { recursive: true })
    writeFileSync(projectFile, 'inside', 'utf8')
    writeFileSync(outsideFile, 'outside', 'utf8')

    const listed = await apiPost<{ entries: Array<{ name: string }>; error?: string }>(app, '/api/files/list', {
      cwd: project,
      dir: project
    })
    expect(listed.error).toBeUndefined()
    expect(listed.entries.some((entry) => entry.name === 'inside.txt')).toBe(true)

    const read = await apiPost<{ content?: string; error?: string }>(app, '/api/files/read', {
      cwd: project,
      filePath: projectFile
    })
    expect(read.content).toBe('inside')
    expect(read.error).toBeUndefined()

    const deniedRead = await apiPost<{ content?: string; error?: string }>(app, '/api/files/read', {
      cwd: project,
      filePath: outsideFile
    })
    expect(deniedRead.content).toBeUndefined()
    expect(deniedRead.error).toContain('Access denied')

    const agentSave = await apiPost<{ ok: boolean; error?: string }>(app, '/api/agents/save', {
      cwd: project,
      path: agentPath,
      content: 'agent'
    })
    expect(agentSave.ok).toBe(true)

    const memorySave = await apiPost<{ ok: boolean; error?: string }>(app, '/api/memories/save', {
      cwd: project,
      path: memoryPath,
      content: 'memory'
    })
    expect(memorySave.ok).toBe(true)
  })

  it('lists project agents from the same scoped root that agent saves use', async () => {
    const app = await startServer()
    const project = tempProject()
    const agentPath = path.join(project, '.commandcode', 'agents', 'settings-smoke.md')

    mkdirSync(path.dirname(agentPath), { recursive: true })
    writeFileSync(agentPath, 'description: Scoped settings agent\n', 'utf8')

    const listed = await apiPost<{ agents: Array<{ path: string; name: string; scope?: string; rawContent: string }> }>(app, '/api/agents/list', {
      cwd: project
    })
    const projectAgent = listed.agents.find((agent) => agent.path === agentPath)
    expect(projectAgent?.name).toBe('settings-smoke')
    expect(projectAgent?.scope).toBe('project')

    const save = await apiPost<{ ok: boolean; error?: string }>(app, '/api/agents/save', {
      cwd: project,
      path: agentPath,
      content: 'description: Updated settings agent\n'
    })
    expect(save.ok).toBe(true)
    expect(readFileSync(agentPath, 'utf8')).toContain('Updated settings agent')
  })

  it('removes registered workspace roots when sessions are deleted', async () => {
    const app = await startServer()
    const project = tempProject()
    const projectFile = path.join(project, 'inside.txt')
    writeFileSync(projectFile, 'inside', 'utf8')

    const session = await apiPost<{ id: string }>(app, '/api/sessions', {
      cwd: project,
      useMock: true
    })

    const activeRead = await apiPost<{ content?: string; error?: string }>(app, '/api/files/read', {
      filePath: projectFile
    })
    expect(activeRead.content).toBe('inside')

    await apiDelete(app, `/api/sessions/${session.id}`)

    const staleRead = await apiPost<{ content?: string; error?: string }>(app, '/api/files/read', {
      filePath: projectFile
    })
    expect(staleRead.content).toBeUndefined()
    expect(staleRead.error).toContain('Access denied')
  })

  it('discovers hook configs only from documented project settings scope', async () => {
    const app = await startServer()
    const project = tempProject()
    const settingsPath = path.join(project, '.commandcode', 'settings.json')

    mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileSync(settingsPath, JSON.stringify({
      hooks: {
        Stop: [{ type: 'command', command: 'echo project-stop' }]
      }
    }), 'utf8')

    const discovered = await apiPost<{
      sources: Array<{ sourceScope: string; sourcePath: string; exists: boolean; ok: boolean; hooks: Array<{ command: string }> }>
      hooks: Array<{ command: string; sourceScope: string }>
      errors: string[]
    }>(app, '/api/hooks/configs', { cwd: project })
    const projectSource = discovered.sources.find((source) => source.sourceScope === 'project')

    expect(projectSource).toMatchObject({
      sourcePath: path.join(realpathSync(project), '.commandcode', 'settings.json'),
      exists: true,
      ok: true
    })
    expect(projectSource?.hooks.map((hook) => hook.command)).toEqual(['echo project-stop'])
    expect(discovered.hooks[0]).toMatchObject({ command: 'echo project-stop', sourceScope: 'project' })
  })

  it('lists and reads hook logs only from the scoped project hooks directory', async () => {
    const app = await startServer()
    const project = tempProject()
    const hooksDir = path.join(project, '.commandcode', 'hooks')
    const logPath = path.join(hooksDir, 'audit.log')
    const ignoredPath = path.join(hooksDir, 'secret.md')

    mkdirSync(hooksDir, { recursive: true })
    writeFileSync(logPath, 'hook output\n', 'utf8')
    writeFileSync(ignoredPath, 'not a log\n', 'utf8')

    const listed = await apiPost<{
      logs: Array<{ path: string; name: string; sourceScope: string }>
      sources: Array<{ sourceScope: string; dir: string; exists: boolean }>
    }>(app, '/api/hooks/logs', { cwd: project })
    const projectSource = listed.sources.find((source) => source.sourceScope === 'project')

    expect(projectSource).toMatchObject({
      dir: path.join(realpathSync(project), '.commandcode', 'hooks'),
      exists: true
    })
    expect(listed.logs.map((log) => log.name)).toContain('audit.log')
    expect(listed.logs.map((log) => log.name)).not.toContain('secret.md')

    const read = await apiPost<{ ok: boolean; content?: string; path?: string }>(app, '/api/hooks/logs/read', {
      cwd: project,
      sourceScope: 'project',
      path: logPath
    })

    expect(read.ok).toBe(true)
    expect(read.path).toBe(path.join(realpathSync(project), '.commandcode', 'hooks', 'audit.log'))
    expect(read.content).toBe('hook output\n')
  })

  it('rejects hook log reads outside scoped hooks directory or unsupported extensions', async () => {
    const app = await startServer()
    const project = tempProject()
    const hooksDir = path.join(project, '.commandcode', 'hooks')
    const outsidePath = path.join(project, 'outside.log')
    const unsupportedPath = path.join(hooksDir, 'secret.md')

    mkdirSync(hooksDir, { recursive: true })
    writeFileSync(outsidePath, 'outside\n', 'utf8')
    writeFileSync(unsupportedPath, 'secret\n', 'utf8')

    const outside = await apiPost<{ ok: boolean; error?: string }>(app, '/api/hooks/logs/read', {
      cwd: project,
      sourceScope: 'project',
      path: outsidePath
    })
    const unsupported = await apiPost<{ ok: boolean; error?: string }>(app, '/api/hooks/logs/read', {
      cwd: project,
      sourceScope: 'project',
      path: unsupportedPath
    })

    expect(outside.ok).toBe(false)
    expect(outside.error).toContain('outside documented hooks directory')
    expect(unsupported.ok).toBe(false)
    expect(unsupported.error).toContain('Unsupported hook log file type')
  })

  it('reports hook config parse errors without writing or executing hooks', async () => {
    const app = await startServer()
    const project = tempProject()
    const settingsPath = path.join(project, '.commandcode', 'settings.json')

    mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileSync(settingsPath, '{ nope', 'utf8')

    const discovered = await apiPost<{
      sources: Array<{ sourceScope: string; exists: boolean; ok: boolean; errors: string[] }>
      errors: string[]
    }>(app, '/api/hooks/configs', { cwd: project })
    const projectSource = discovered.sources.find((source) => source.sourceScope === 'project')

    expect(projectSource?.exists).toBe(true)
    expect(projectSource?.ok).toBe(false)
    expect(projectSource?.errors[0]).toContain('Invalid JSON')
    expect(discovered.errors.some((error) => error.includes('Invalid JSON'))).toBe(true)
  })

  it('does not infer a project hook config path without an explicit workspace root', async () => {
    const app = await startServer()

    const discovered = await apiPost<{
      sources: Array<{ sourceScope: string; exists: boolean; errors: string[] }>
      hooks: unknown[]
    }>(app, '/api/hooks/configs', {})
    const projectSource = discovered.sources.find((source) => source.sourceScope === 'project')

    expect(projectSource?.exists).toBe(false)
    expect(projectSource?.errors[0]).toContain('Access denied')
    expect(discovered.hooks.every((hook) => typeof hook === 'object')).toBe(true)
  })

  it('previews hook enabled changes without writing settings files', async () => {
    const app = await startServer()
    const project = tempProject()
    const settingsPath = path.join(project, '.commandcode', 'settings.json')
    const original = JSON.stringify({
      model: 'deepseek',
      hooks: {
        Stop: [{ type: 'command', command: 'echo project-stop' }]
      }
    }, null, 2) + '\n'

    mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileSync(settingsPath, original, 'utf8')

    const preview = await apiPost<{
      ok: boolean
      content?: string
      sourceScope?: string
      sourcePath?: string
      error?: string
    }>(app, '/api/hooks/preview-toggle', {
      cwd: project,
      sourceScope: 'project',
      event: 'Stop',
      command: 'echo project-stop',
      enabled: false
    })

    expect(preview.ok).toBe(true)
    expect(preview.sourceScope).toBe('project')
    expect(preview.sourcePath).toBe(path.join(realpathSync(project), '.commandcode', 'settings.json'))
    expect(JSON.parse(preview.content || '{}')).toMatchObject({
      model: 'deepseek',
      hooks: { Stop: [{ command: 'echo project-stop', enabled: false }] }
    })
    expect(readFileSync(settingsPath, 'utf8')).toBe(original)
  })

  it('fails hook toggle preview closed without a valid project root', async () => {
    const app = await startServer()

    const preview = await apiPost<{ ok: boolean; error?: string }>(app, '/api/hooks/preview-toggle', {
      sourceScope: 'project',
      event: 'Stop',
      command: 'echo project-stop',
      enabled: false
    })

    expect(preview.ok).toBe(false)
    expect(preview.error).toContain('Access denied')
  })

  it('previews broader hook edits without writing settings files', async () => {
    const app = await startServer()
    const project = tempProject()
    const settingsPath = path.join(project, '.commandcode', 'settings.json')
    const original = JSON.stringify({
      model: 'deepseek',
      hooks: {
        PreToolUse: [
          { type: 'command', matcher: 'Bash', command: 'node scripts/check-shell.js', timeout: 5 }
        ]
      }
    }, null, 2) + '\n'

    mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileSync(settingsPath, original, 'utf8')

    const preview = await apiPost<{
      ok: boolean
      content?: string
      sourceScope?: string
      sourcePath?: string
      action?: string
      error?: string
    }>(app, '/api/hooks/preview-edit', {
      cwd: project,
      sourceScope: 'project',
      event: 'PreToolUse',
      command: 'node scripts/check-shell.js',
      action: 'update',
      update: {
        command: 'node scripts/block-shell.js',
        matcher: 'Bash|Shell',
        timeoutSeconds: 10
      }
    })

    expect(preview.ok).toBe(true)
    expect(preview.action).toBe('update')
    expect(preview.sourceScope).toBe('project')
    expect(preview.sourcePath).toBe(path.join(realpathSync(project), '.commandcode', 'settings.json'))
    expect(JSON.parse(preview.content || '{}')).toMatchObject({
      model: 'deepseek',
      hooks: { PreToolUse: [{ command: 'node scripts/block-shell.js', matcher: 'Bash|Shell', timeoutSeconds: 10 }] }
    })
    expect(readFileSync(settingsPath, 'utf8')).toBe(original)
  })

  it('previews broader hook deletion without writing settings files', async () => {
    const app = await startServer()
    const project = tempProject()
    const settingsPath = path.join(project, '.commandcode', 'settings.json')
    const original = JSON.stringify({
      hooks: {
        Stop: [
          { type: 'command', command: 'echo project-stop' },
          { type: 'command', command: 'command-code-bonk --sound done' }
        ]
      }
    }, null, 2) + '\n'

    mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileSync(settingsPath, original, 'utf8')

    const preview = await apiPost<{ ok: boolean; content?: string; action?: string }>(app, '/api/hooks/preview-edit', {
      cwd: project,
      sourceScope: 'project',
      event: 'Stop',
      command: 'echo project-stop',
      action: 'remove'
    })

    expect(preview.ok).toBe(true)
    expect(preview.action).toBe('remove')
    expect(JSON.parse(preview.content || '{}').hooks.Stop.map((hook: { command: string }) => hook.command)).toEqual([
      'command-code-bonk --sound done'
    ])
    expect(readFileSync(settingsPath, 'utf8')).toBe(original)
  })

  it('fails broader hook edit preview closed without a valid project root', async () => {
    const app = await startServer()

    const preview = await apiPost<{ ok: boolean; error?: string }>(app, '/api/hooks/preview-edit', {
      sourceScope: 'project',
      event: 'Stop',
      command: 'echo project-stop',
      action: 'remove'
    })

    expect(preview.ok).toBe(false)
    expect(preview.error).toContain('Access denied')
  })

  it('applies hook enabled changes only to the scoped settings file and writes a backup', async () => {
    const app = await startServer()
    const project = tempProject()
    const settingsPath = path.join(project, '.commandcode', 'settings.json')
    const original = JSON.stringify({
      model: 'deepseek',
      hooks: {
        Stop: [{ type: 'command', command: 'echo project-stop' }]
      }
    }, null, 2) + '\n'

    mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileSync(settingsPath, original, 'utf8')

    const applied = await apiPost<{
      ok: boolean
      content?: string
      backupPath?: string
      error?: string
    }>(app, '/api/hooks/apply-toggle', {
      cwd: project,
      sourceScope: 'project',
      event: 'Stop',
      command: 'echo project-stop',
      enabled: false
    })

    expect(applied.ok).toBe(true)
    expect(applied.backupPath).toBe(path.join(realpathSync(project), '.commandcode', 'settings.json.ccgui.bak'))
    expect(readFileSync(settingsPath, 'utf8')).toBe(applied.content)
    expect(readFileSync(applied.backupPath || '', 'utf8')).toBe(original)
    expect(JSON.parse(readFileSync(settingsPath, 'utf8'))).toMatchObject({
      model: 'deepseek',
      hooks: { Stop: [{ command: 'echo project-stop', enabled: false }] }
    })
  })

  it('does not write hook config when apply validation fails', async () => {
    const app = await startServer()
    const project = tempProject()
    const settingsPath = path.join(project, '.commandcode', 'settings.json')
    const original = JSON.stringify({
      hooks: {
        Stop: [{ type: 'command', command: 'echo project-stop' }]
      }
    }, null, 2) + '\n'

    mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileSync(settingsPath, original, 'utf8')

    const applied = await apiPost<{ ok: boolean; error?: string }>(app, '/api/hooks/apply-toggle', {
      cwd: project,
      sourceScope: 'project',
      event: 'Stop',
      command: 'missing command',
      enabled: false
    })

    expect(applied.ok).toBe(false)
    expect(applied.error).toContain('Hook command not found')
    expect(readFileSync(settingsPath, 'utf8')).toBe(original)
    expect(existsSync(`${settingsPath}.ccgui.bak`)).toBe(false)
  })

  it('applies broader hook edits only to the scoped settings file and writes a backup', async () => {
    const app = await startServer()
    const project = tempProject()
    const settingsPath = path.join(project, '.commandcode', 'settings.json')
    const original = JSON.stringify({
      model: 'deepseek',
      hooks: {
        PreToolUse: [
          { type: 'command', matcher: 'Bash', command: 'node scripts/check-shell.js', timeout: 5 }
        ]
      }
    }, null, 2) + '\n'

    mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileSync(settingsPath, original, 'utf8')

    const applied = await apiPost<{
      ok: boolean
      content?: string
      backupPath?: string
      error?: string
    }>(app, '/api/hooks/apply-edit', {
      cwd: project,
      sourceScope: 'project',
      event: 'PreToolUse',
      command: 'node scripts/check-shell.js',
      action: 'update',
      update: {
        command: 'node scripts/block-shell.js',
        matcher: 'Bash|Shell',
        timeoutSeconds: 10
      }
    })

    expect(applied.ok).toBe(true)
    expect(applied.backupPath).toBe(path.join(realpathSync(project), '.commandcode', 'settings.json.ccgui.bak'))
    expect(readFileSync(settingsPath, 'utf8')).toBe(applied.content)
    expect(readFileSync(applied.backupPath || '', 'utf8')).toBe(original)
    expect(JSON.parse(readFileSync(settingsPath, 'utf8'))).toMatchObject({
      model: 'deepseek',
      hooks: { PreToolUse: [{ command: 'node scripts/block-shell.js', matcher: 'Bash|Shell', timeoutSeconds: 10 }] }
    })
  })

  it('applies broader hook deletion only to the scoped settings file and writes a backup', async () => {
    const app = await startServer()
    const project = tempProject()
    const settingsPath = path.join(project, '.commandcode', 'settings.json')
    const original = JSON.stringify({
      hooks: {
        Stop: [
          { type: 'command', command: 'echo project-stop' },
          { type: 'command', command: 'command-code-bonk --sound done' }
        ]
      }
    }, null, 2) + '\n'

    mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileSync(settingsPath, original, 'utf8')

    const applied = await apiPost<{ ok: boolean; content?: string; backupPath?: string }>(app, '/api/hooks/apply-edit', {
      cwd: project,
      sourceScope: 'project',
      event: 'Stop',
      command: 'echo project-stop',
      action: 'remove'
    })

    expect(applied.ok).toBe(true)
    expect(readFileSync(applied.backupPath || '', 'utf8')).toBe(original)
    expect(JSON.parse(readFileSync(settingsPath, 'utf8')).hooks.Stop.map((hook: { command: string }) => hook.command)).toEqual([
      'command-code-bonk --sound done'
    ])
  })

  it('does not write broader hook edits when apply validation fails', async () => {
    const app = await startServer()
    const project = tempProject()
    const settingsPath = path.join(project, '.commandcode', 'settings.json')
    const original = JSON.stringify({
      hooks: {
        Stop: [{ type: 'command', command: 'echo project-stop' }]
      }
    }, null, 2) + '\n'

    mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileSync(settingsPath, original, 'utf8')

    const applied = await apiPost<{ ok: boolean; error?: string }>(app, '/api/hooks/apply-edit', {
      cwd: project,
      sourceScope: 'project',
      event: 'Stop',
      command: 'missing command',
      action: 'remove'
    })

    expect(applied.ok).toBe(false)
    expect(applied.error).toContain('Hook command not found')
    expect(readFileSync(settingsPath, 'utf8')).toBe(original)
    expect(existsSync(`${settingsPath}.ccgui.bak`)).toBe(false)
  })
})

describe('project GUI preference boundaries', () => {
  it('fails closed when loading or saving project preferences without a valid project path', async () => {
    const app = await startServer()
    const missingProject = path.join(tmpdir(), 'ccgui-missing-project-for-preferences')

    const missingLoad = await apiPost<{ ok: boolean; error?: string }>(app, '/api/project/preferences', {})
    expect(missingLoad.ok).toBe(false)
    expect(missingLoad.error).toContain('Missing project path')

    const missingSave = await apiPost<{ ok: boolean; error?: string }>(app, '/api/project/preferences/save', {
      preferences: { model: 'should-not-write' }
    })
    expect(missingSave.ok).toBe(false)
    expect(missingSave.error).toContain('Missing project path')

    const nonexistentSave = await apiPost<{ ok: boolean; error?: string }>(app, '/api/project/preferences/save', {
      cwd: missingProject,
      preferences: { model: 'should-not-write' }
    })
    expect(nonexistentSave.ok).toBe(false)
    expect(nonexistentSave.error).toContain('Project path not found')
    expect(existsSync(missingProject)).toBe(false)
  })

  it('sanitizes project GUI preferences before writing inside the selected project', async () => {
    const app = await startServer()
    const project = tempProject()

    const saved = await apiPost<{
      ok: boolean
      path: string
      preferences: {
        version: number
        projectPath: string
        model?: string
        runtimeMode?: string
        permissionMode?: string
        trust?: boolean
        skipOnboarding?: boolean
        headlessMaxTurns?: number
        headlessYolo?: boolean
        appearanceTheme?: string
        updatedAt?: string
        extra?: string
      }
    }>(app, '/api/project/preferences/save', {
      cwd: project,
      preferences: {
        version: 99,
        projectPath: '/not/the/project',
        model: 'claude',
        runtimeMode: 'real-session',
        permissionMode: 'auto-accept',
        trust: true,
        skipOnboarding: true,
        headlessMaxTurns: 250,
        headlessYolo: true,
        appearanceTheme: 'blueprint',
        extra: 'drop-me'
      }
    })

    expect(saved.ok).toBe(true)
    expect(saved.path).toBe(path.join(project, '.commandcode', 'gui-preferences.json'))
    expect(saved.preferences).toMatchObject({
      version: 1,
      projectPath: project,
      model: 'claude',
      runtimeMode: 'real-session',
      permissionMode: 'auto-accept',
      trust: true,
      skipOnboarding: true,
      headlessMaxTurns: 100,
      headlessYolo: true,
      appearanceTheme: 'blueprint'
    })
    expect(saved.preferences.extra).toBeUndefined()
    expect(saved.preferences.updatedAt).toBeTruthy()

    const persisted = JSON.parse(readFileSync(saved.path, 'utf8')) as typeof saved.preferences
    expect(persisted).toEqual(saved.preferences)
  })
})

describe('app GUI preference boundaries', () => {
  it('sanitizes app GUI startup preferences before writing', async () => {
    const app = await startServer()

    const saved = await apiPost<{
      ok: boolean
      preferences: {
        version: number
        cwd?: string
        startupProjectBehavior?: string
        extra?: string
        updatedAt?: string
      }
    }>(app, '/api/app/preferences/save', {
      preferences: {
        version: 99,
        cwd: '/tmp/project',
        startupProjectBehavior: 'empty',
        extra: 'drop-me'
      }
    })

    expect(saved.ok).toBe(true)
    expect(saved.preferences).toMatchObject({
      version: 1,
      cwd: '/tmp/project',
      startupProjectBehavior: 'empty'
    })
    expect(saved.preferences.extra).toBeUndefined()
    expect(saved.preferences.updatedAt).toBeTruthy()
  })
})

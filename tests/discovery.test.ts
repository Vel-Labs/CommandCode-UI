import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { listMcp, mcpAction } from '../src/core/discovery'

const tempDirs: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'ccgui-discovery-'))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  while (tempDirs.length) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true })
  }
})

describe('MCP discovery', () => {
  it('distinguishes disconnected from connected and runs explicit actions', async () => {
    const dir = tempDir()
    const statePath = path.join(dir, 'mcp-state')
    const commandPath = path.join(dir, 'fake-cmd')

    writeFileSync(statePath, 'disconnected', 'utf8')
    writeFileSync(commandPath, [
      '#!/usr/bin/env node',
      "const { readFileSync, writeFileSync } = require('node:fs')",
      `const statePath = ${JSON.stringify(statePath)}`,
      'const [scope, action, server] = process.argv.slice(2)',
      "if (scope !== 'mcp') process.exit(2)",
      "if (action === 'list') {",
      "  const state = readFileSync(statePath, 'utf8').trim()",
      "  console.log(`fixture  ${state}  1 tool`)",
      '  process.exit(0)',
      '}',
      "if (action === 'connect' || action === 'disconnect') {",
      "  writeFileSync(statePath, action === 'connect' ? 'connected' : 'disconnected', 'utf8')",
      '  console.log(`${server}: ${action}`)',
      '  process.exit(0)',
      '}',
      'process.exit(2)'
    ].join('\n'), 'utf8')
    chmodSync(commandPath, 0o755)

    const before = await listMcp(commandPath)
    expect(before).toEqual([{ name: 'fixture', status: 'disconnected', toolCount: 1, raw: 'fixture  disconnected  1 tool' }])

    const connect = await mcpAction(commandPath, 'connect', 'fixture')
    expect(connect.ok).toBe(true)
    expect(connect.stdout).toContain('fixture: connect')

    const afterConnect = await listMcp(commandPath)
    expect(afterConnect[0]?.status).toBe('connected')

    const disconnect = await mcpAction(commandPath, 'disconnect', 'fixture')
    expect(disconnect.ok).toBe(true)

    const afterDisconnect = await listMcp(commandPath)
    expect(afterDisconnect[0]?.status).toBe('disconnected')
  })
})

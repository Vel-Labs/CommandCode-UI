import path from 'node:path'
import {
  discoverSessions,
  usageSummary,
  listTastePackages,
  listAgents,
  saveAgent,
  listMcpDetailed,
  mcpAction,
  listSkills,
  listMemories,
  saveMemory,
  projectCommandCodeReference
} from '../core/discovery'
import { isPathUnderRoot, resolveBoundaryPath } from '../shared/pathContainment'
import type { RouteHandler } from './http'

type AddRoute = (method: string, pattern: string, handler: RouteHandler) => void

type DiscoveryRoutesOptions = {
  resolveWorkspaceRoot: (cwdInput?: string) => { root?: string; error?: string }
}

const ALLOWED_MEMORY_NAMES = new Set(['COMMANDCODE.md', 'AGENTS.md', 'CLAUDE.md'])

export function registerDiscoveryRoutes(addRoute: AddRoute, { resolveWorkspaceRoot }: DiscoveryRoutesOptions): void {
  addRoute('POST', '/api/sessions/discover', async ({ body }) => {
    const { cwd } = body as { cwd?: string }
    return { sessions: discoverSessions(cwd) }
  })

  addRoute('POST', '/api/project/commandcode-reference', async ({ body }) => {
    const { cwd } = body as { cwd?: string }
    return { reference: projectCommandCodeReference(cwd) }
  })

  addRoute('POST', '/api/usage', async ({ body }) => {
    const { commandExecutable, cwd } = body as { commandExecutable?: string; cwd?: string }
    return usageSummary(commandExecutable, cwd)
  })

  addRoute('POST', '/api/taste/list', async () => {
    return { packages: listTastePackages() }
  })

  addRoute('POST', '/api/agents/list', async ({ body }) => {
    const { cwd } = body as { cwd?: string }
    return { agents: listAgents(cwd) }
  })

  addRoute('POST', '/api/agents/save', async ({ body }) => {
    const { path: agentPath, content, cwd } = body as { path?: string; content?: string; cwd?: string }
    if (!agentPath || content == null) return { ok: false, error: 'Missing path or content' }
    const workspace = resolveWorkspaceRoot(cwd)
    if (!workspace.root) return { ok: false, error: workspace.error || 'Access denied — project root is required' }
    const resolved = path.resolve(agentPath)
    if (!isAllowedAgentPath(resolved, workspace.root)) {
      return { ok: false, error: 'Access denied — agent path must be under .commandcode/agents/' }
    }
    const ok = saveAgent(resolved, content)
    return { ok, error: ok ? undefined : 'Failed to save agent config' }
  })

  addRoute('POST', '/api/mcp/list', async ({ body }) => {
    const { commandExecutable } = body as { commandExecutable?: string }
    return listMcpDetailed(commandExecutable)
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
    const { path: memPath, content, cwd } = body as { path?: string; content?: string; cwd?: string }
    if (!memPath || content == null) return { ok: false, error: 'Missing path or content' }
    const workspace = resolveWorkspaceRoot(cwd)
    if (!workspace.root) return { ok: false, error: workspace.error || 'Access denied — project root is required' }
    const resolved = path.resolve(memPath)
    if (!isAllowedMemoryPath(resolved, workspace.root)) {
      return { ok: false, error: 'Access denied — memory only writable to COMMANDCODE.md, AGENTS.md, CLAUDE.md, or .commandcode/memory/' }
    }
    const ok = saveMemory(resolved, content)
    return { ok, error: ok ? undefined : 'Failed to save memory file' }
  })
}

function isAllowedMemoryPath(filePath: string, root: string): boolean {
  if (!isPathUnderRoot(filePath, root)) return false
  const relative = path.relative(resolveBoundaryPath(root), resolveBoundaryPath(filePath))
  const base = path.basename(filePath)
  if (ALLOWED_MEMORY_NAMES.has(base)) return true
  if (relative.startsWith('.commandcode' + path.sep + 'memory' + path.sep)) return true
  return false
}

function isAllowedAgentPath(filePath: string, root: string): boolean {
  if (!isPathUnderRoot(filePath, root)) return false
  const relative = path.relative(resolveBoundaryPath(root), resolveBoundaryPath(filePath))
  return relative.startsWith('.commandcode' + path.sep + 'agents' + path.sep)
}

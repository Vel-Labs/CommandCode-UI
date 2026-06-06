import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { runProcess } from './cli'
import { buildMcpActionArgs, type McpAction } from './mcpCommands'
import { parseMcpListOutput } from './mcpList'
import type {
  CliExecResult,
  DiscoveredSession,
  UsageSummary,
  TastePackage,
  TasteCategory,
  AgentConfig,
  McpListResult,
  McpServer,
  SkillEntry,
  MemoryFile,
  ProjectCommandCodeFile,
  ProjectCommandCodeReference,
  ProjectCommandCodeSection
} from './types'

const BASE_DIR = path.join(os.homedir(), '.commandcode')
const AGENTS_DIR = path.join(os.homedir(), '.agents')

function projectSlug(cwd: string): string {
  return path.resolve(cwd)
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export type SessionMetadata = {
  title?: string
  model?: string
}

export function readSessionMetadata(metaPath: string): SessionMetadata {
  if (!existsSync(metaPath)) return {}
  try {
    const parsed = JSON.parse(readFileSync(metaPath, 'utf8')) as { title?: unknown; model?: unknown }
    return {
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : undefined,
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model.trim() : undefined
    }
  } catch {
    return {}
  }
}

function listFilesShallow(dir: string, maxDepth = 2): ProjectCommandCodeFile[] {
  if (!existsSync(dir)) return []
  try {
    const files: ProjectCommandCodeFile[] = []
    const walk = (currentDir: string, depth: number): void => {
      for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue
        const filePath = path.join(currentDir, entry.name)
        if (entry.isDirectory()) {
          if (depth < maxDepth) walk(filePath, depth + 1)
          continue
        }
        if (!entry.isFile()) continue
        const stat = statSync(filePath)
        files.push({
          name: path.relative(dir, filePath),
          path: filePath,
          sizeBytes: stat.size,
          updatedAt: stat.mtime.toISOString()
        })
      }
    }

    walk(dir, 0)
    return files.sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

function section(
  key: ProjectCommandCodeSection['key'],
  label: string,
  description: string,
  sectionPath: string,
  files?: ProjectCommandCodeFile[]
): ProjectCommandCodeSection {
  return {
    key,
    label,
    description,
    path: sectionPath,
    exists: existsSync(sectionPath),
    files: files ?? listFilesShallow(sectionPath)
  }
}

export function discoverSessions(cwd?: string, baseDir = BASE_DIR): DiscoveredSession[] {
  const sessions: DiscoveredSession[] = []

  const dirs = [path.join(baseDir, 'sessions'), path.join(baseDir, 'transcripts')]
  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    try {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (entry.startsWith('.')) continue
        try {
          const stat = statSync(full)
          if (stat.isDirectory() || entry.endsWith('.ansi') || entry.endsWith('.log') || entry.endsWith('.jsonl')) {
            sessions.push({
              id: entry,
              timestamp: stat.mtime.toISOString(),
              transcriptPath: full,
              sizeBytes: stat.size,
              source: 'global'
            })
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  if (cwd?.trim()) {
    const projectDir = path.join(baseDir, 'projects', projectSlug(cwd))
    if (existsSync(projectDir)) {
      try {
        for (const entry of readdirSync(projectDir)) {
          if (!entry.endsWith('.jsonl') || entry.endsWith('.checkpoints.jsonl')) continue
          const full = path.join(projectDir, entry)
          try {
            const stat = statSync(full)
            if (!stat.isFile()) continue
            const id = entry.replace(/\.jsonl$/, '')
            const metadata = readSessionMetadata(path.join(projectDir, `${id}.meta.json`))
            sessions.push({
              id,
              title: metadata.title,
              model: metadata.model,
              timestamp: stat.mtime.toISOString(),
              transcriptPath: full,
              sizeBytes: stat.size,
              cwd,
              source: 'project'
            })
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    }
  }

  sessions.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return sessions.slice(0, 50)
}

export function projectCommandCodeReference(cwd?: string): ProjectCommandCodeReference {
  const projectPath = path.resolve(cwd?.trim() || '.')
  const projectCommandCodePath = path.join(projectPath, '.commandcode')
  const userProjectContextPath = path.join(BASE_DIR, 'projects', projectSlug(projectPath))
  const projectPreferencePath = path.join(projectCommandCodePath, 'gui-preferences.json')

  const preferenceFiles = existsSync(projectPreferencePath)
    ? listFilesShallow(projectCommandCodePath).filter((file) => file.name === 'gui-preferences.json')
    : []

  return {
    projectPath,
    projectCommandCodePath,
    userProjectContextPath,
    sections: [
      section(
        'commands',
        'Project commands',
        'Repo-local slash command prompt files owned by Command Code.',
        path.join(projectCommandCodePath, 'commands')
      ),
      section(
        'skills',
        'Project skills',
        'Repo-local skill definitions that can guide Command Code behavior.',
        path.join(projectCommandCodePath, 'skills')
      ),
      section(
        'taste',
        'Taste',
        'Project-local taste learning notes. Command Code owns the learning semantics.',
        path.join(projectCommandCodePath, 'taste')
      ),
      section(
        'memory',
        'Memory',
        'Optional project memory files surfaced by the GUI memory editor.',
        path.join(projectCommandCodePath, 'memory')
      ),
      section(
        'preferences',
        'GUI preferences',
        'Adapter-owned project preferences. These do not change Command Code runtime internals.',
        projectPreferencePath,
        preferenceFiles
      ),
      section(
        'sessions',
        'Chat contexts',
        'Command Code runtime-owned project transcripts, metadata, checkpoints, and settings.',
        userProjectContextPath,
        listFilesShallow(userProjectContextPath)
      )
    ]
  }
}

export async function usageSummary(commandExecutable?: string, cwd?: string): Promise<UsageSummary> {
  const result = await runCli(commandExecutable, cwd, ['/usage', '--json'], 60_000)

  const summary: UsageSummary = {
    totalTokens: 0,
    totalCost: 0,
    totalRuns: 0,
    raw: result.stdout,
    parsed: false
  }

  try {
    const parsed = result.stdout.trim() ? JSON.parse(result.stdout) : null
    if (parsed && typeof parsed === 'object') {
      summary.totalTokens = Number(parsed.totalTokens ?? parsed.total_tokens ?? 0)
      summary.totalCost = Number(parsed.totalCost ?? parsed.total_cost ?? parsed.cost ?? 0)
      summary.totalRuns = Number(parsed.totalRuns ?? parsed.total_runs ?? parsed.runs ?? 0)
      summary.parsed = true
    }
  } catch {
    const tokenMatch = result.stdout.match(/tokens?[:\s]+(\d[\d,]*)/i)
    const costMatch = result.stdout.match(/cost[:\s]+\$?(\d+\.?\d*)/i)
    const runsMatch = result.stdout.match(/runs[:\s]+(\d[\d,]*)/i)
    if (tokenMatch) summary.totalTokens = parseInt(tokenMatch[1]!.replace(/,/g, ''), 10)
    if (costMatch) summary.totalCost = parseFloat(costMatch[1]!)
    if (runsMatch) summary.totalRuns = parseInt(runsMatch[1]!.replace(/,/g, ''), 10)
  }

  return summary
}

export function listTastePackages(): TastePackage[] {
  const packages: TastePackage[] = []

  for (const scope of ['taste', 'taste-profiles']) {
    const tasteDir = path.join(BASE_DIR, scope)
    if (!existsSync(tasteDir)) continue
    try {
      for (const pkg of readdirSync(tasteDir)) {
        const pkgPath = path.join(tasteDir, pkg)
        const stat = statSync(pkgPath)
        if (!stat.isDirectory()) continue

        const pkgEntry: TastePackage = { path: pkgPath, name: pkg, categories: [] }
        const catDir = pkgPath

        const categories: TasteCategory[] = []

        for (const item of readdirSync(catDir)) {
          const itemPath = path.join(catDir, item)
          const itemStat = statSync(itemPath)
          if (itemEndsWithMd(item) && !itemStat.isDirectory()) {
            pkgEntry.categories = parseCatFile(itemPath)
            break
          }
          if (itemStat.isDirectory()) {
            const mdPath = path.join(itemPath, 'taste.md')
            if (existsSync(mdPath)) {
              categories.push(parseSingleCategory(item, mdPath))
            }
          }
        }

        if (categories.length > 0) pkgEntry.categories = categories
        packages.push(pkgEntry)
      }
    } catch { /* skip */ }
  }

  packages.sort((a, b) => a.name.localeCompare(b.name))
  return packages
}

function itemEndsWithMd(item: string): boolean {
  return item.toLowerCase().endsWith('.md')
}

function parseCatFile(filePath: string): TasteCategory[] {
  const content = readFileSync(filePath, 'utf8')
  const cats: TasteCategory[] = []
  const lines = content.split('\n')
  let current: TasteCategory | null = null

  for (const line of lines) {
    const hMatch = line.match(/^# (.+)/)
    if (hMatch) {
      if (current) cats.push(current)
      current = { name: hMatch[1]!, confidence: 0, learnings: [] }
      continue
    }
    if (current) {
      const bulletMatch = line.match(/^-\s+(.+)/)
      if (bulletMatch) {
        const learning = bulletMatch[1]!
        const confMatch = learning.match(/Confidence:\s*([\d.]+)/)
        if (confMatch) {
          current.confidence = Math.max(current.confidence, parseFloat(confMatch[1]!))
        }
        current.learnings.push(learning)
      }
    }
  }

  if (current) cats.push(current)
  return cats
}

function parseSingleCategory(name: string, filePath: string): TasteCategory {
  const content = readFileSync(filePath, 'utf8')
  const cat: TasteCategory = { name, confidence: 0, learnings: [] }
  for (const line of content.split('\n')) {
    const m = line.match(/^-\s+(.+)/)
    if (m) {
      const learning = m[1]!
      const confMatch = learning.match(/Confidence:\s*([\d.]+)/)
      if (confMatch) cat.confidence = Math.max(cat.confidence, parseFloat(confMatch[1]!))
      cat.learnings.push(learning)
    }
  }
  return cat
}

function readAgentConfig(fullPath: string, entry: string, scope: AgentConfig['scope']): AgentConfig | undefined {
  try {
    const content = readFileSync(fullPath, 'utf8')
    const config: AgentConfig = {
      path: fullPath,
      name: entry.replace(/\.(md|ya?ml)$/, ''),
      rawContent: content,
      scope
    }
    if (entry.endsWith('.md')) {
      config.systemPrompt = extractFrontmatterField(content, 'system_prompt')
      config.description = extractFrontmatterField(content, 'description')
    } else {
      const yamlDesc = content.match(/description:\s*(.+)/i)
      if (yamlDesc) config.description = yamlDesc[1]!.trim()
    }
    return config
  } catch {
    return undefined
  }
}

export function listAgents(cwd?: string): AgentConfig[] {
  const agents: AgentConfig[] = []
  const projectAgentsDir = cwd?.trim() ? path.join(path.resolve(cwd), '.commandcode', 'agents') : undefined

  if (projectAgentsDir && existsSync(projectAgentsDir)) {
    try {
      for (const entry of readdirSync(projectAgentsDir)) {
        if (entry.startsWith('.')) continue
        if (!entry.endsWith('.md') && !entry.endsWith('.yaml') && !entry.endsWith('.yml')) continue
        const config = readAgentConfig(path.join(projectAgentsDir, entry), entry, 'project')
        if (config) agents.push(config)
      }
    } catch { /* skip */ }
  }

  for (const agentsDir of [path.join(BASE_DIR, 'agents'), path.join(AGENTS_DIR, 'agents')]) {
    if (!existsSync(agentsDir)) continue
    try {
      for (const entry of readdirSync(agentsDir)) {
        const fullPath = path.join(agentsDir, entry)
        if (entry.startsWith('.')) continue
        if (!entry.endsWith('.md') && !entry.endsWith('.yaml') && !entry.endsWith('.yml')) continue
        const config = readAgentConfig(fullPath, entry, 'user')
        if (config) agents.push(config)
      }
    } catch { /* skip */ }
  }

  agents.sort((a, b) => a.name.localeCompare(b.name))
  return agents
}

export function saveAgent(agentPath: string, content: string): boolean {
  try {
    mkdirSync(path.dirname(agentPath), { recursive: true })
    writeFileSync(agentPath, content, 'utf8')
    return true
  } catch {
    return false
  }
}

export async function listMcp(commandExecutable?: string): Promise<McpServer[]> {
  return (await listMcpDetailed(commandExecutable)).servers
}

export async function listMcpDetailed(commandExecutable?: string): Promise<McpListResult> {
  const result = await runCli(commandExecutable, undefined, ['mcp', 'list'], 30_000)
  if (!result.ok) {
    return {
      ok: false,
      servers: [],
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.stderr || result.stdout || result.error || 'MCP list failed'
    }
  }

  return {
    ok: true,
    servers: parseMcpListOutput(result.stdout),
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error
  }
}

export async function mcpAction(commandExecutable: string | undefined, action: McpAction, serverName: string): Promise<CliExecResult> {
  return runCli(commandExecutable, undefined, buildMcpActionArgs(action, serverName), 60_000)
}

export function listSkills(): SkillEntry[] {
  const skills: SkillEntry[] = []

  for (const skillsDir of [path.join(BASE_DIR, 'skills'), path.join(AGENTS_DIR, 'skills')]) {
    if (!existsSync(skillsDir)) continue
    try {
      for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue
        const fullDir = path.join(skillsDir, entry.name)
        if (!entry.isDirectory()) {
          if (entry.name.endsWith('.md')) {
            skills.push(readSkillFromFile(fullDir, entry.name))
          }
          continue
        }
        const mdPath = path.join(fullDir, 'SKILL.md')
        if (existsSync(mdPath)) {
          skills.push(readSkillFromFile(mdPath, entry.name))
        }
      }
    } catch { /* skip */ }
  }

  skills.sort((a, b) => a.name.localeCompare(b.name))
  return skills
}

function readSkillFromFile(filePath: string, dirName: string): SkillEntry {
  const content = readFileSync(filePath, 'utf8')
  const desc = content.match(/^#\s+(.+)/m)?.[1] ?? extractFrontmatterField(content, 'description')
  return {
    path: filePath,
    name: dirName,
    content,
    description: desc
  }
}

export function listMemories(cwd?: string): MemoryFile[] {
  const memories: MemoryFile[] = []
  const projectRoot = cwd?.trim() || '.'

  const paths = [
    path.join(projectRoot, 'COMMANDCODE.md'),
    path.join(projectRoot, 'AGENTS.md'),
    path.join(projectRoot, 'CLAUDE.md')
  ]

  if (existsSync(path.join(projectRoot, '.commandcode', 'memory'))) {
    for (const f of readdirSync(path.join(projectRoot, '.commandcode', 'memory'))) {
      paths.push(path.join(projectRoot, '.commandcode', 'memory', f))
    }
  }

  for (const p of paths) {
    if (!existsSync(p)) continue
    try {
      const content = readFileSync(p, 'utf8')
      memories.push({
        path: p,
        content,
        name: path.basename(p)
      })
    } catch { /* skip */ }
  }

  return memories
}

export function saveMemory(filePath: string, content: string): boolean {
  try {
    writeFileSync(filePath, content, 'utf8')
    return true
  } catch {
    return false
  }
}

async function runCli(
  commandExecutable?: string,
  cwd?: string,
  extraArgs: string[] = [],
  timeoutMs = 30_000
): Promise<CliExecResult> {
  const command = commandExecutable?.trim() || process.env.COMMAND_CODE_BIN || 'cmd'
  const dir = cwd?.trim() || os.homedir()
  const result = await runProcess(command, extraArgs, dir, timeoutMs)
  return {
    ok: result.exitCode === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    error: result.exitCode === 0 ? undefined : `Command exited with ${result.exitCode}`
  }
}

function extractFrontmatterField(markdown: string, field: string): string | undefined {
  const match = markdown.match(new RegExp(`${field}:\\s*(.+)\\b`, 'i'))
  return match?.[1]?.trim()
}

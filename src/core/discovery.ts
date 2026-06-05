import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { runProcess } from './cli'
import type {
  CliExecResult,
  DiscoveredSession,
  UsageSummary,
  TastePackage,
  TasteCategory,
  AgentConfig,
  McpServer,
  SkillEntry,
  MemoryFile
} from './types'

const BASE_DIR = path.join(os.homedir(), '.commandcode')
const AGENTS_DIR = path.join(os.homedir(), '.agents')

export function discoverSessions(): DiscoveredSession[] {
  const sessions: DiscoveredSession[] = []

  const dirs = [path.join(BASE_DIR, 'sessions'), path.join(BASE_DIR, 'transcripts')]
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
              sizeBytes: stat.size
            })
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  sessions.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return sessions.slice(0, 50)
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

export function listAgents(): AgentConfig[] {
  const agents: AgentConfig[] = []

  for (const agentsDir of [path.join(BASE_DIR, 'agents'), path.join(AGENTS_DIR, 'agents')]) {
    if (!existsSync(agentsDir)) continue
    try {
      for (const entry of readdirSync(agentsDir)) {
        const fullPath = path.join(agentsDir, entry)
        if (entry.startsWith('.')) continue
        if (!entry.endsWith('.md') && !entry.endsWith('.yaml') && !entry.endsWith('.yml')) continue
        try {
          const content = readFileSync(fullPath, 'utf8')
          const config: AgentConfig = {
            path: fullPath,
            name: entry.replace(/\.(md|ya?ml)$/, ''),
            rawContent: content
          }
          if (entry.endsWith('.md')) {
            config.systemPrompt = extractFrontmatterField(content, 'system_prompt')
            config.description = extractFrontmatterField(content, 'description')
          } else {
            const yamlDesc = content.match(/description:\s*(.+)/i)
            if (yamlDesc) config.description = yamlDesc[1]!.trim()
          }
          agents.push(config)
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  agents.sort((a, b) => a.name.localeCompare(b.name))
  return agents
}

export function saveAgent(agentPath: string, content: string): boolean {
  try {
    writeFileSync(agentPath, content, 'utf8')
    return true
  } catch {
    return false
  }
}

export async function listMcp(commandExecutable?: string): Promise<McpServer[]> {
  const result = await runCli(commandExecutable, undefined, ['mcp', 'list'], 30_000)
  if (!result.ok) return []

  const servers: McpServer[] = []
  for (const line of result.stdout.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('No MCP')) continue
    const status = trimmed.includes('connected') ? 'connected'
      : trimmed.includes('disconnected') ? 'disconnected'
      : trimmed.includes('error') ? 'error'
      : 'unknown'

    const toolMatch = trimmed.match(/(\d+)\s+tools?/i)
    servers.push({
      name: trimmed.split(/\s{2,}|\t|:/)[0] ?? trimmed,
      status,
      toolCount: toolMatch ? parseInt(toolMatch[1]!, 10) : undefined,
      raw: trimmed
    })
  }

  return servers
}

export async function mcpAction(commandExecutable: string | undefined, action: 'connect' | 'disconnect', serverName: string): Promise<CliExecResult> {
  const subcommand = action === 'connect' ? 'connect' : 'disconnect'
  return runCli(commandExecutable, undefined, ['mcp', subcommand, serverName], 60_000)
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

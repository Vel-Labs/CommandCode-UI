import type { TransportAPI } from '../../core/transport'
import type {
  AgentConfig,
  AppGuiPreferences,
  AppGuiPreferencesResult,
  CliExecResult,
  CommandCodeCheck,
  CommandCodeStatus,
  CommandCodeUpdateResult,
  DiscoveredSession,
  FileEntry,
  GitEnvironmentStatus,
  HeadlessRunOptions,
  HeadlessRunResult,
  IdeStatusResult,
  McpListResult,
  McpServer,
  MemoryFile,
  ModelListResult,
  NativeRevealResult,
  ProjectGuiPreferences,
  ProjectGuiPreferencesResult,
  ProjectCommandCodeReference,
  SessionStartOptions,
  SessionStartResult,
  SkillEntry,
  TastePackage,
  UsageSummary,
  WriteFileResult,
} from '../../core/types'
import type { PtyDoctorResult } from '../../core/ptyDoctor'
import type { DoctorResult } from '../../core/doctor'
import type { HookConfigDiscoveryResult, HookConfigEditApplyResult, HookConfigEditPreviewResult, HookConfigToggleApplyResult, HookConfigTogglePreviewResult } from '../../core/hooksConfig'
import type { HookDryRunResult } from '../../core/hooksDryRun'
import type { HookLogDiscoveryResult, HookLogReadResult } from '../../core/hooksLogs'
import { createBrowserApiClient } from './transport/browserApiClient'
import { createBrowserSessionSocketManager } from './transport/browserSessionSocket'

export function createBrowserTransport(): TransportAPI {
  const api = createBrowserApiClient()
  const sessionSocket = createBrowserSessionSocketManager(api)
  const { fetchJson } = api

  return {
    environment: 'browser',
    supportsNativeDirectoryPicker: false,
    supportsNativeReveal: false,

    chooseDirectory: async () => {
      return { canceled: true }
    },

    check: async (commandExecutable?) =>
      fetchJson<CommandCodeCheck>('/api/check', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable })
      }),

    status: async (commandExecutable?, cwd?) =>
      fetchJson<CommandCodeStatus>('/api/status', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, cwd })
      }),

    update: async (commandExecutable?, cwd?, checkOnly = true) =>
      fetchJson<CommandCodeUpdateResult>('/api/update', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, cwd, checkOnly })
      }),

    loadAppPreferences: async () =>
      fetchJson<AppGuiPreferencesResult>('/api/app/preferences', {
        method: 'POST'
      }),

    saveAppPreferences: async (preferences: AppGuiPreferences) =>
      fetchJson<AppGuiPreferencesResult>('/api/app/preferences/save', {
        method: 'POST',
        body: JSON.stringify({ preferences })
      }),

    loadProjectPreferences: async (cwd) =>
      fetchJson<ProjectGuiPreferencesResult>('/api/project/preferences', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    saveProjectPreferences: async (cwd, preferences: ProjectGuiPreferences) =>
      fetchJson<ProjectGuiPreferencesResult>('/api/project/preferences/save', {
        method: 'POST',
        body: JSON.stringify({ cwd, preferences })
      }),

    doctor: async () =>
      fetchJson<DoctorResult>('/api/doctor'),

    ptyHealth: async () =>
      fetchJson<PtyDoctorResult>('/api/pty-health'),

    listModels: async (commandExecutable?, cwd?) =>
      fetchJson<ModelListResult>('/api/models', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, cwd })
      }),

    startSession: async (options) =>
      fetchJson<SessionStartResult>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    write: async (sessionId, data) =>
      fetchJson<void>(`/api/sessions/${sessionId}/write`, {
        method: 'POST',
        body: JSON.stringify({ data })
      }),

    resize: async (sessionId, cols, rows) =>
      fetchJson<void>(`/api/sessions/${sessionId}/resize`, {
        method: 'POST',
        body: JSON.stringify({ cols, rows })
      }),

    stop: async (sessionId) =>
      fetchJson<void>(`/api/sessions/${sessionId}/stop`, { method: 'POST' }),

    interrupt: async (sessionId) =>
      fetchJson<void>(`/api/sessions/${sessionId}/interrupt`, { method: 'POST' }),

    forceKill: async (sessionId) =>
      fetchJson<void>(`/api/sessions/${sessionId}`, { method: 'DELETE' }),

    kill: async (sessionId) =>
      fetchJson<void>(`/api/sessions/${sessionId}`, { method: 'DELETE' }),

    runHeadless: async (options) =>
      fetchJson<HeadlessRunResult>('/api/headless', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    openExternal: (url: string): Promise<void> => {
      window.open(url, '_blank')
      return Promise.resolve()
    },

    revealTranscript: (transcriptPath: string): Promise<NativeRevealResult> => {
      return Promise.resolve({
        ok: false,
        action: 'reveal-transcript',
        path: transcriptPath,
        message: 'Browser mode cannot open the OS file manager. Copy the transcript path or open it from the server machine.'
      })
    },

    revealPath: (targetPath: string): Promise<NativeRevealResult> => {
      return Promise.resolve({
        ok: false,
        action: 'reveal-path',
        path: targetPath,
        message: 'Browser mode cannot open the OS file manager. Copy the project path or open it from the server machine.'
      })
    },

    readTranscript: async (transcriptPath) =>
      fetchJson<{ content: string; path: string; ext: string; error?: string; truncated?: boolean }>('/api/sessions/transcript', {
        method: 'POST',
        body: JSON.stringify({ transcriptPath })
      }),

    matchStructuredTranscript: async (options) =>
      fetchJson('/api/sessions/structured-transcript-match', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    listFiles: async (dir, cwd) =>
      fetchJson<{ entries: FileEntry[]; dir: string; error?: string }>('/api/files/list', {
        method: 'POST',
        body: JSON.stringify({ dir, cwd })
      }),

    readFile: async (filePath, cwd) =>
      fetchJson<{ content: string; path: string; ext: string; error?: string }>('/api/files/read', {
        method: 'POST',
        body: JSON.stringify({ filePath, cwd })
      }),

    ideStatus: async (commandExecutable?, cwd?) =>
      fetchJson<IdeStatusResult>('/api/ide-status', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, cwd })
      }),

    gitStatus: async (cwd?) =>
      fetchJson<GitEnvironmentStatus>('/api/git/status', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    discoverSessions: async (cwd?) =>
      fetchJson<{ sessions: DiscoveredSession[] }>('/api/sessions/discover', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    projectCommandCodeReference: async (cwd?) =>
      fetchJson<{ reference: ProjectCommandCodeReference }>('/api/project/commandcode-reference', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    usage: async (commandExecutable?, cwd?) =>
      fetchJson<UsageSummary>('/api/usage', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, cwd })
      }),

    listTaste: async () =>
      fetchJson<{ packages: TastePackage[] }>('/api/taste/list', {
        method: 'POST'
      }),

    listAgents: async (cwd?) =>
      fetchJson<{ agents: AgentConfig[] }>('/api/agents/list', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    saveAgent: async (agentPath, content, cwd) =>
      fetchJson<WriteFileResult>('/api/agents/save', {
        method: 'POST',
        body: JSON.stringify({ path: agentPath, content, cwd })
      }),

    listMcp: async (commandExecutable?) =>
      fetchJson<McpListResult>('/api/mcp/list', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable })
      }),

    mcpAction: async (commandExecutable, action, serverName) =>
      fetchJson<CliExecResult>('/api/mcp/action', {
        method: 'POST',
        body: JSON.stringify({ commandExecutable, action, serverName })
      }),

    listSkills: async () =>
      fetchJson<{ skills: SkillEntry[] }>('/api/skills/list', {
        method: 'POST'
      }),

    listMemories: async (cwd?) =>
      fetchJson<{ memories: MemoryFile[] }>('/api/memories/list', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    saveMemory: async (filePath, content, cwd) =>
      fetchJson<WriteFileResult>('/api/memories/save', {
        method: 'POST',
        body: JSON.stringify({ path: filePath, content, cwd })
      }),

    discoverHookConfigs: async (cwd?) =>
      fetchJson<HookConfigDiscoveryResult>('/api/hooks/configs', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    previewHookToggle: async (options) =>
      fetchJson<HookConfigTogglePreviewResult>('/api/hooks/preview-toggle', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    previewHookEdit: async (options) =>
      fetchJson<HookConfigEditPreviewResult>('/api/hooks/preview-edit', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    applyHookEdit: async (options) =>
      fetchJson<HookConfigEditApplyResult>('/api/hooks/apply-edit', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    listHookLogs: async (cwd?) =>
      fetchJson<HookLogDiscoveryResult>('/api/hooks/logs', {
        method: 'POST',
        body: JSON.stringify({ cwd })
      }),

    readHookLog: async (options) =>
      fetchJson<HookLogReadResult>('/api/hooks/logs/read', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    dryRunHook: async (options) =>
      fetchJson<HookDryRunResult>('/api/hooks/dry-run', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    applyHookToggle: async (options) =>
      fetchJson<HookConfigToggleApplyResult>('/api/hooks/apply-toggle', {
        method: 'POST',
        body: JSON.stringify(options)
      }),

    onSessionData: sessionSocket.onSessionData,

    onSessionExit: sessionSocket.onSessionExit
  }
}

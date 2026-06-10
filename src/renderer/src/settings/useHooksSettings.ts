import { useCallback, useEffect, useState } from 'react'
import type { TransportAPI } from '../../../core/transport'
import type {
  HookCommandUpdate,
  HookConfigDiscoveryResult,
  HookConfigEditApplyResult,
  HookConfigEditPreviewResult,
  HookConfigToggleApplyResult,
  HookConfigTogglePreviewResult,
  ParsedHookCommand
} from '../../../core/hooksConfig'
import type {
  HookLogDiscoveryResult,
  HookLogEntry,
  HookLogReadResult
} from '../../../core/hooksLogs'
import type { HookDryRunResult } from '../../../core/hooksDryRun'
import { buildHookPayloadPreview } from '../../../core/hooksPayload'
import type { HookPayloadPreview } from '../../../core/hooksPayload'

export function useHooksSettings({ transport, cwd }: { transport: TransportAPI; cwd: string }) {
  const [discovery, setDiscovery] = useState<HookConfigDiscoveryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<HookConfigTogglePreviewResult | null>(null)
  const [previewingKey, setPreviewingKey] = useState('')
  const [applyResult, setApplyResult] = useState<HookConfigToggleApplyResult | null>(null)
  const [applying, setApplying] = useState(false)
  const [payloadPreview, setPayloadPreview] = useState<HookPayloadPreview | null>(null)
  const [editingHook, setEditingHook] = useState<ParsedHookCommand | null>(null)
  const [editDraft, setEditDraft] = useState({ command: '', matcher: '', timeoutSeconds: '' })
  const [editPreview, setEditPreview] = useState<HookConfigEditPreviewResult | null>(null)
  const [editApplyResult, setEditApplyResult] = useState<HookConfigEditApplyResult | null>(null)
  const [editPreviewing, setEditPreviewing] = useState(false)
  const [editApplying, setEditApplying] = useState(false)
  const [hookLogs, setHookLogs] = useState<HookLogDiscoveryResult | null>(null)
  const [hookLogsLoading, setHookLogsLoading] = useState(false)
  const [hookLogsError, setHookLogsError] = useState('')
  const [hookLogRead, setHookLogRead] = useState<HookLogReadResult | null>(null)
  const [readingLogPath, setReadingLogPath] = useState('')
  const [hookDryRun, setHookDryRun] = useState<HookDryRunResult | null>(null)
  const [dryRunningKey, setDryRunningKey] = useState('')
  const examples = [
    { label: 'Block risky shell', event: 'PreToolUse', matcher: 'Bash', command: 'node .commandcode/hooks/block-risky-shell.js' },
    { label: 'Sensitive read warning', event: 'PreToolUse', matcher: 'Read', command: 'node .commandcode/hooks/warn-sensitive-read.js' },
    { label: 'Write audit', event: 'PostToolUse', matcher: 'Write|Edit', command: 'node .commandcode/hooks/audit-write.js' },
    { label: 'Stop notification', event: 'Stop', matcher: 'Session stop', command: 'command-code-bonk --sound done' }
  ]

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    transport.discoverHookConfigs(cwd)
      .then((result) => {
        if (!cancelled) setDiscovery(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cwd, transport])

  const refreshHooks = useCallback(() => {
    setLoading(true)
    setError('')
    return transport.discoverHookConfigs(cwd)
      .then(setDiscovery)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [cwd, transport])

  const refreshHookLogs = useCallback(() => {
    setHookLogsLoading(true)
    setHookLogsError('')
    return transport.listHookLogs(cwd)
      .then(setHookLogs)
      .catch((err) => setHookLogsError(err instanceof Error ? err.message : String(err)))
      .finally(() => setHookLogsLoading(false))
  }, [cwd, transport])

  useEffect(() => {
    void refreshHookLogs()
  }, [refreshHookLogs])

  const readHookLog = useCallback((log: HookLogEntry) => {
    setReadingLogPath(log.path)
    setHookLogRead(null)
    transport.readHookLog({
      cwd,
      sourceScope: log.sourceScope,
      path: log.path
    })
      .then(setHookLogRead)
      .catch((err) => setHookLogRead({ ok: false, error: err instanceof Error ? err.message : String(err) }))
      .finally(() => setReadingLogPath(''))
  }, [cwd, transport])

  const previewToggle = useCallback((hook: ParsedHookCommand) => {
    const key = `${hook.sourceScope}:${hook.sourcePath}:${hook.order}:${hook.command}`
    setPreviewingKey(key)
    setApplyResult(null)
    transport.previewHookToggle({
      cwd,
      sourceScope: hook.sourceScope,
      event: hook.event,
      command: hook.command,
      enabled: !hook.enabled
    })
      .then(setPreview)
      .catch((err) => setPreview({ ok: false, error: err instanceof Error ? err.message : String(err) }))
      .finally(() => setPreviewingKey(''))
  }, [cwd, transport])

  const previewPayload = useCallback((hook: ParsedHookCommand) => {
    setPayloadPreview(buildHookPayloadPreview({
      event: hook.event,
      cwd,
      command: hook.command,
      matcher: hook.matcher
    }))
  }, [cwd])

  const dryRunHook = useCallback((hook: ParsedHookCommand) => {
    const key = `${hook.sourceScope}:${hook.sourcePath}:${hook.order}:${hook.command}`
    setDryRunningKey(key)
    setHookDryRun(null)
    transport.dryRunHook({
      cwd,
      sourceScope: hook.sourceScope,
      event: hook.event,
      command: hook.command,
      matcher: hook.matcher,
      enabled: hook.enabled
    })
      .then(setHookDryRun)
      .catch((err) => setHookDryRun({
        ok: false,
        willRun: false,
        reason: 'Dry-run failed before hook execution.',
        error: err instanceof Error ? err.message : String(err),
        execution: 'not-run'
      }))
      .finally(() => setDryRunningKey(''))
  }, [cwd, transport])

  const openEditPreview = useCallback((hook: ParsedHookCommand) => {
    setEditingHook(hook)
    setEditDraft({
      command: hook.command,
      matcher: hook.matcher || '',
      timeoutSeconds: hook.timeoutSeconds === undefined ? '' : String(hook.timeoutSeconds)
    })
    setEditPreview(null)
    setEditApplyResult(null)
  }, [])

  const previewHookEdit = useCallback((action: 'update' | 'remove') => {
    if (!editingHook) return
    const update: HookCommandUpdate = {}
    const nextCommand = editDraft.command.trim()
    const nextMatcher = editDraft.matcher.trim()
    const currentMatcher = editingHook.matcher || ''
    const currentTimeout = editingHook.timeoutSeconds === undefined ? '' : String(editingHook.timeoutSeconds)
    const nextTimeout = editDraft.timeoutSeconds.trim()

    if (nextCommand !== editingHook.command) update.command = nextCommand
    if (nextMatcher !== currentMatcher) update.matcher = nextMatcher
    if (nextTimeout !== currentTimeout) {
      update.timeoutSeconds = nextTimeout ? Number(nextTimeout) : null
    }

    setEditPreviewing(true)
    setEditApplyResult(null)
    transport.previewHookEdit({
      cwd,
      sourceScope: editingHook.sourceScope,
      event: editingHook.event,
      command: editingHook.command,
      action,
      update: action === 'update' ? update : undefined
    })
      .then(setEditPreview)
      .catch((err) => setEditPreview({ ok: false, error: err instanceof Error ? err.message : String(err) }))
      .finally(() => setEditPreviewing(false))
  }, [cwd, editDraft, editingHook, transport])

  const applyHookEditPreview = useCallback(() => {
    if (!editPreview?.ok || !editPreview.sourceScope || !editPreview.event || !editPreview.command || !editPreview.action) return
    const confirmed = window.confirm(`Apply hook ${editPreview.action} to ${editPreview.sourcePath}? A .ccgui.bak backup will be written first.`)
    if (!confirmed) return
    setEditApplying(true)
    transport.applyHookEdit({
      cwd,
      sourceScope: editPreview.sourceScope,
      event: editPreview.event,
      command: editPreview.command,
      action: editPreview.action,
      update: editPreview.update
    })
      .then((result) => {
        setEditApplyResult(result)
        if (result.ok) {
          setEditPreview(null)
          setEditingHook(null)
          void refreshHooks()
        }
      })
      .catch((err) => setEditApplyResult({ ok: false, error: err instanceof Error ? err.message : String(err) }))
      .finally(() => setEditApplying(false))
  }, [cwd, editPreview, refreshHooks, transport])

  const applyPreview = useCallback(() => {
    if (!preview?.ok || !preview.sourceScope || !preview.event || !preview.command || typeof preview.enabled !== 'boolean') return
    const confirmed = window.confirm(`Apply hook config change to ${preview.sourcePath}? A .ccgui.bak backup will be written first.`)
    if (!confirmed) return
    setApplying(true)
    transport.applyHookToggle({
      cwd,
      sourceScope: preview.sourceScope,
      event: preview.event,
      command: preview.command,
      enabled: preview.enabled
    })
      .then((result) => {
        setApplyResult(result)
        if (result.ok) void refreshHooks()
      })
      .catch((err) => setApplyResult({ ok: false, error: err instanceof Error ? err.message : String(err) }))
      .finally(() => setApplying(false))
  }, [cwd, preview, refreshHooks, transport])


  return {
    discovery,
    loading,
    error,
    preview,
    previewingKey,
    applyResult,
    applying,
    payloadPreview,
    editingHook,
    setEditingHook,
    editDraft,
    setEditDraft,
    editPreview,
    setEditPreview,
    editApplyResult,
    setEditApplyResult,
    editPreviewing,
    editApplying,
    hookLogs,
    hookLogsLoading,
    hookLogsError,
    hookLogRead,
    readingLogPath,
    hookDryRun,
    dryRunningKey,
    examples,
    refreshHookLogs,
    readHookLog,
    previewToggle,
    previewPayload,
    dryRunHook,
    openEditPreview,
    previewHookEdit,
    applyHookEditPreview,
    applyPreview,
  }
}

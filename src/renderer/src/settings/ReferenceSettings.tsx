import { useCallback, useEffect, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { UpdateState } from '../appTypes'
import { commandPaletteItems, releaseNotes } from '../commandPalette'
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
import { buildHookPayloadPreview } from '../../../core/hooksPayload'
import type { HookPayloadPreview } from '../../../core/hooksPayload'
import {
  NOTIFICATION_PREFERENCES_CHANGED_EVENT,
  defaultAudioPrefs,
  loadAudioPrefs,
  loadToastPrefs,
  notificationCategoryLabel,
  saveAudioPrefs,
  saveToastPrefs
} from './notificationPreferences'
import type { AudioPrefs, ToastPrefs } from './notificationPreferences'
import { loadTerminalPrefs, saveTerminalPrefs } from './terminalPreferences'
import type { TerminalPrefs } from './terminalPreferences'

export function KeyboardSettingsReadOnly(): JSX.Element {
  return (
    <SettingsReferenceCard title="Keyboard shortcuts">
      <div className="settings-shortcut-grid">
        <ShortcutRow label="New session" keys={['Cmd/Ctrl', 'T']} detail="Starts a new project session from the current project." />
        <ShortcutRow label="Send composer prompt" keys={['Enter']} detail="Submits the composer when focus is in the prompt box." />
        <ShortcutRow label="New composer line" keys={['Shift', 'Enter']} detail="Adds a newline without submitting." />
        <ShortcutRow label="Dismiss popover" keys={['Escape']} detail="Closes open project, runtime, model, permission, and command popovers." />
        <ShortcutRow label="Open transcript detail" keys={['Ctrl', 'O']} detail="Terminal control sequence opens the active transcript in the inspector." />
        <ShortcutRow label="Terminal menus" keys={['Menu input']} detail="Explicit toggle before keyboard input is routed to Command Code terminal menus." />
      </div>
      <div className="settings-command-grid">
        {commandPaletteItems.map((item) => (
          <div key={item.id} className="settings-command-row">
            <strong>{item.label}</strong>
            <code>{item.command}</code>
            <span>{item.group}</span>
          </div>
        ))}
      </div>
      <p className="settings-muted">Shortcut remapping is planned. This reference is read-only and does not write GUI preferences or Command Code settings.</p>
    </SettingsReferenceCard>
  )
}

export function NotificationsSettings(): JSX.Element {
  const [toastPrefs, setToastPrefs] = useState<ToastPrefs>(loadToastPrefs)
  const [audioPrefs, setAudioPrefs] = useState<AudioPrefs>(loadAudioPrefs)

  useEffect(() => {
    const reload = () => {
      setToastPrefs(loadToastPrefs())
      setAudioPrefs(loadAudioPrefs())
    }
    window.addEventListener(NOTIFICATION_PREFERENCES_CHANGED_EVENT, reload)
    return () => window.removeEventListener(NOTIFICATION_PREFERENCES_CHANGED_EVENT, reload)
  }, [])

  const updateToast = useCallback((update: Partial<ToastPrefs>) => {
    setToastPrefs((prev) => saveToastPrefs({ ...prev, ...update }))
  }, [])

  const updateAudio = useCallback((update: Partial<AudioPrefs>) => {
    setAudioPrefs((prev) => saveAudioPrefs({ ...prev, ...update }))
  }, [])

  return (
    <SettingsReferenceCard title="Notifications">
      <div className="settings-destination-note">
        <span>Renderer-local GUI preference</span>
        <code>localStorage: ccgui.toast-preferences, ccgui.audio-preferences</code>
        <small>toast/audio only</small>
      </div>
      <label className="settings-control-row">
        <span>Toast duration</span>
        <select value={toastPrefs.durationMs} onChange={(event) => updateToast({ durationMs: Number(event.target.value) })}>
          <option value={2500}>2.5 seconds</option>
          <option value={4000}>4 seconds</option>
          <option value={6500}>6.5 seconds</option>
          <option value={10000}>10 seconds</option>
        </select>
      </label>
      <div className="settings-toggle-grid">
        {Object.entries(toastPrefs.categories).map(([key, enabled]) => (
          <label key={key} className="settings-toggle-row">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => updateToast({ categories: { ...toastPrefs.categories, [key]: event.target.checked } })}
            />
            <span>{notificationCategoryLabel(key)}</span>
          </label>
        ))}
      </div>
      <label className="settings-control-row">
        <span>Audio master volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={audioPrefs.masterVolume}
          onChange={(event) => updateAudio({ masterVolume: Number(event.target.value) })}
        />
        <small>{Math.round(audioPrefs.masterVolume * 100)}%</small>
      </label>
      <div className="settings-toggle-grid">
        {Object.entries(defaultAudioPrefs.categories).map(([key]) => {
          const fallback = defaultAudioPrefs.categories[key] || { enabled: false, volume: 1 }
          const category = audioPrefs.categories[key] || fallback
          return (
            <label key={key} className="settings-toggle-row">
              <input
                type="checkbox"
                checked={category.enabled}
                onChange={(event) => updateAudio({ categories: { ...audioPrefs.categories, [key]: { ...category, enabled: event.target.checked } } })}
              />
              <span>{notificationCategoryLabel(key)} audio</span>
            </label>
          )
        })}
      </div>
      <ReferenceRow label="Session readiness" value="Unread state is visible in tabs; response-ready delivery remains gated" />
      <p className="settings-muted">These settings only control existing renderer toast/audio cues. OS notifications, hook-triggered alerts, quiet mode, and response-ready/input-required notification delivery remain planned.</p>
    </SettingsReferenceCard>
  )
}

export function TerminalSettings(): JSX.Element {
  const [terminalPrefs, setTerminalPrefs] = useState<TerminalPrefs>(loadTerminalPrefs)
  const updateTerminal = useCallback((update: Partial<TerminalPrefs>) => {
    setTerminalPrefs((prev) => saveTerminalPrefs({ ...prev, ...update }))
  }, [])

  return (
    <SettingsReferenceCard title="Terminal">
      <div className="settings-destination-note">
        <span>Renderer-local GUI preference</span>
        <code>localStorage: ccgui.terminal-preferences</code>
        <small>xterm presentation</small>
      </div>
      <ReferenceRow label="Interactive surface" value="xterm.js through server-owned PTY/WebSocket transport" />
      <ReferenceRow label="Menu input" value="Explicit toggle before routing keyboard input to terminal menus" />
      <ReferenceRow label="Bottom terminal" value="Project shell session, manually opened and closed" />
      <label className="settings-control-row">
        <span>Font size</span>
        <input
          type="range"
          min={11}
          max={18}
          step={1}
          value={terminalPrefs.fontSize}
          onChange={(event) => updateTerminal({ fontSize: Number(event.target.value) })}
        />
        <small>{terminalPrefs.fontSize}px</small>
      </label>
      <label className="settings-control-row">
        <span>Line height</span>
        <input
          type="range"
          min={1}
          max={1.6}
          step={0.05}
          value={terminalPrefs.lineHeight}
          onChange={(event) => updateTerminal({ lineHeight: Number(event.target.value) })}
        />
        <small>{terminalPrefs.lineHeight.toFixed(2)}</small>
      </label>
      <label className="settings-control-row">
        <span>Scrollback</span>
        <select value={terminalPrefs.scrollback} onChange={(event) => updateTerminal({ scrollback: Number(event.target.value) })}>
          <option value={5_000}>5,000 lines</option>
          <option value={20_000}>20,000 lines</option>
          <option value={50_000}>50,000 lines</option>
          <option value={100_000}>100,000 lines</option>
        </select>
      </label>
      <div className="settings-toggle-grid">
        <label className="settings-toggle-row">
          <input
            type="checkbox"
            checked={terminalPrefs.cursorBlink}
            onChange={(event) => updateTerminal({ cursorBlink: event.target.checked })}
          />
          <span>Blink cursor</span>
        </label>
      </div>
      <ReferenceRow label="Apply timing" value="Loaded when terminal panes mount; active PTY/session geometry is not changed by this package" />
      <p className="settings-muted">These settings only control xterm presentation. Bell behavior, terminal profiles, history controls, and PTY lifecycle changes remain planned.</p>
    </SettingsReferenceCard>
  )
}

export function ModelsSettingsReadOnly({ onConfigureModels }: { onConfigureModels: () => Promise<void> }): JSX.Element {
  return (
    <SettingsReferenceCard title="Models">
      <ReferenceRow label="Active session model" value="Stored at session start when available" />
      <ReferenceRow label="Global model picker" value="Runtime section" />
      <ReferenceRow label="Task routing helper" value="/configure-models" />
      <button className="ghost-button native-ghost settings-inline-action" onClick={() => void onConfigureModels()}>Open /configure-models</button>
      <p className="settings-muted">This page is a helper entry point only. It does not infer model routing semantics or edit Command Code config.</p>
    </SettingsReferenceCard>
  )
}

export function DesignSettingsReadOnly(): JSX.Element {
  return (
    <SettingsReferenceCard title="Design helper">
      <ReferenceRow label="Default GUI design mode" value="/design surface" />
      <ReferenceRow label="Available source" value="Local Command Code docs reference" />
      <ReferenceRow label="Execution" value="Send a previewed slash command through the active session" />
      <p className="settings-muted">Mode pickers, target selection, and command previews are planned. No hidden prompt mutation is added here.</p>
    </SettingsReferenceCard>
  )
}

export function HooksSettingsReadOnly({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
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

  return (
    <SettingsReferenceCard title="Hooks">
      <div className="settings-destination-note">
        <span>Command Code-owned config</span>
        <code>settings.json: hooks</code>
        <small>read/write gated</small>
      </div>
      <ReferenceRow label="Project scope" value=".commandcode/settings.json" />
      <ReferenceRow label="User scope" value="~/.commandcode/settings.json" />
      <ReferenceRow label="Precedence" value="Project settings before user settings" />
      <ReferenceRow label="Documented events" value="PreToolUse, PostToolUse, Stop" />
      <ReferenceRow label="Parser gate" value="Invalid JSON and unsupported shapes fail before future writes" />
      <ReferenceRow label="Execution owner" value="Command Code runs hooks; the GUI only prepares display, validation, and diagnostics" />
      <div className="settings-command-grid">
        {(discovery?.sources ?? []).map((source) => (
          <div key={`${source.sourceScope}:${source.sourcePath}`} className="settings-command-row">
            <strong>{source.sourceScope === 'project' ? 'Project config' : 'User config'}</strong>
            <code>{source.sourcePath}</code>
            <span>
              {source.exists
                ? `${source.hooks.length} hook${source.hooks.length === 1 ? '' : 's'}${source.ok ? '' : ' / invalid'}`
                : source.errors[0] || 'Not found'}
            </span>
          </div>
        ))}
      </div>
      {loading && <p className="settings-muted">Loading hook settings from documented scopes.</p>}
      {error && <p className="settings-muted">{error}</p>}
      {discovery && discovery.hooks.length > 0 && (
        <div className="settings-command-grid">
          {discovery.hooks.map((hook) => (
            <div key={`${hook.sourcePath}:${hook.order}:${hook.command}`} className="settings-command-row">
              <strong>{hook.event}{hook.canBlock ? ' / blocking-capable' : ''}</strong>
              <code>{hook.command}</code>
              <span>
                {hook.sourceScope} / {hook.matcher || 'all tools'} / {hook.enabled ? 'enabled' : 'disabled'}
                <button
                  className="ghost-button native-ghost settings-inline-action"
                  onClick={() => previewToggle(hook)}
                >
                  {previewingKey === `${hook.sourceScope}:${hook.sourcePath}:${hook.order}:${hook.command}`
                    ? 'Previewing'
                    : `Preview ${hook.enabled ? 'disable' : 'enable'}`}
                </button>
                <button
                  className="ghost-button native-ghost settings-inline-action"
                  onClick={() => previewPayload(hook)}
                >
                  Sample payload
                </button>
                <button
                  className="ghost-button native-ghost settings-inline-action"
                  onClick={() => openEditPreview(hook)}
                >
                  Edit preview
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
      {editingHook && (
        <div className="settings-command-grid">
          <div className="settings-command-row">
            <strong>Broader edit preview</strong>
            <code>{editingHook.sourcePath}</code>
            <span>{editingHook.event} / {editingHook.matcher || 'all tools'} / no file will be written</span>
          </div>
          <label className="settings-control-row">
            <span>Command</span>
            <input
              className="native-input"
              value={editDraft.command}
              onChange={(event) => setEditDraft((draft) => ({ ...draft, command: event.target.value }))}
            />
          </label>
          <label className="settings-control-row">
            <span>Matcher</span>
            <input
              className="native-input"
              value={editDraft.matcher}
              onChange={(event) => setEditDraft((draft) => ({ ...draft, matcher: event.target.value }))}
            />
          </label>
          <label className="settings-control-row">
            <span>Timeout seconds</span>
            <input
              className="native-input"
              type="number"
              min={0}
              step={1}
              value={editDraft.timeoutSeconds}
              onChange={(event) => setEditDraft((draft) => ({ ...draft, timeoutSeconds: event.target.value }))}
            />
          </label>
          <div className="settings-actions-row">
            <button className="ghost-button native-ghost" onClick={() => previewHookEdit('update')} disabled={editPreviewing}>
              {editPreviewing ? 'Previewing' : 'Preview edit'}
            </button>
            <button className="ghost-button native-ghost" onClick={() => previewHookEdit('remove')} disabled={editPreviewing}>
              Preview delete
            </button>
            <button className="ghost-button native-ghost" onClick={() => { setEditingHook(null); setEditPreview(null); setEditApplyResult(null) }}>
              Close
            </button>
          </div>
        </div>
      )}
      {editPreview && (
        <div className="settings-command-grid">
          <div className="settings-command-row">
            <strong>{editPreview.ok ? 'Edit preview only' : 'Edit preview failed'}</strong>
            <code>{editPreview.sourcePath || editPreview.error || 'No source path'}</code>
            <span>{editPreview.ok ? `${editPreview.action} / no file was written` : 'no file was written'}</span>
          </div>
          {editPreview.content && <pre className="advanced-raw">{editPreview.content}</pre>}
          {editPreview.ok && (
            <button className="primary-button" onClick={applyHookEditPreview} disabled={editApplying}>
              {editApplying ? 'Applying' : 'Apply edit preview'}
            </button>
          )}
          {editPreview.error && <p className="settings-muted">{editPreview.error}</p>}
        </div>
      )}
      {editApplyResult && (
        <p className="settings-muted">
          {editApplyResult.ok
            ? `Applied hook edit. Backup: ${editApplyResult.backupPath || 'not reported'}`
            : editApplyResult.error || 'Failed to apply hook edit.'}
        </p>
      )}
      {payloadPreview && (
        <div className="settings-command-grid">
          <div className="settings-command-row">
            <strong>Dry-run payload</strong>
            <code>{payloadPreview.description}</code>
            <span>no hook executed</span>
          </div>
          <pre className="advanced-raw">{payloadPreview.payloadJson}</pre>
        </div>
      )}
      {preview && (
        <div className="settings-command-grid">
          <div className="settings-command-row">
            <strong>{preview.ok ? 'Preview only' : 'Preview failed'}</strong>
            <code>{preview.sourcePath || preview.error || 'No source path'}</code>
            <span>{preview.ok ? `${preview.event} / ${preview.enabled ? 'enable' : 'disable'}` : 'no file was written'}</span>
          </div>
          {preview.content && <pre className="advanced-raw">{preview.content}</pre>}
          {preview.ok && (
            <button className="primary-button" onClick={applyPreview} disabled={applying}>
              {applying ? 'Applying' : 'Apply preview'}
            </button>
          )}
          {preview.error && <p className="settings-muted">{preview.error}</p>}
        </div>
      )}
      {applyResult && (
        <p className="settings-muted">
          {applyResult.ok
            ? `Applied hook config change. Backup: ${applyResult.backupPath || 'not reported'}`
            : applyResult.error || 'Failed to apply hook config change.'}
        </p>
      )}
      {discovery && discovery.hooks.length === 0 && !loading && (
        <p className="settings-muted">No hook commands found in the documented project or user settings scopes.</p>
      )}
      {discovery && [...discovery.warnings, ...discovery.errors].length > 0 && (
        <div className="settings-command-grid">
          {[...discovery.warnings, ...discovery.errors].map((message) => (
            <div key={message} className="settings-command-row">
              <strong>Diagnostic</strong>
              <code>{message}</code>
              <span>read-only</span>
            </div>
          ))}
        </div>
      )}
      <div className="settings-command-grid">
        <div className="settings-command-row">
          <strong>Hook logs</strong>
          <code>.commandcode/hooks, ~/.commandcode/hooks</code>
          <span>
            read-only
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => void refreshHookLogs()} disabled={hookLogsLoading}>
              {hookLogsLoading ? 'Refreshing' : 'Refresh logs'}
            </button>
          </span>
        </div>
        {(hookLogs?.sources ?? []).map((source) => (
          <div key={`${source.sourceScope}:${source.dir}`} className="settings-command-row">
            <strong>{source.sourceScope === 'project' ? 'Project logs' : 'User logs'}</strong>
            <code>{source.dir}</code>
            <span>
              {source.exists
                ? `${source.logs.length} log file${source.logs.length === 1 ? '' : 's'}`
                : source.errors[0] || 'Not found'}
            </span>
          </div>
        ))}
        {(hookLogs?.logs ?? []).map((log) => (
          <div key={`${log.sourceScope}:${log.path}`} className="settings-command-row">
            <strong>{log.sourceScope} log</strong>
            <code>{log.path}</code>
            <span>
              {formatBytes(log.sizeBytes)} / {formatDateTime(log.updatedAt)}
              <button className="ghost-button native-ghost settings-inline-action" onClick={() => readHookLog(log)} disabled={readingLogPath === log.path}>
                {readingLogPath === log.path ? 'Opening' : 'Open log'}
              </button>
            </span>
          </div>
        ))}
      </div>
      {hookLogsLoading && <p className="settings-muted">Loading hook logs from scoped hook directories.</p>}
      {hookLogsError && <p className="settings-muted">{hookLogsError}</p>}
      {hookLogs && hookLogs.logs.length === 0 && !hookLogsLoading && (
        <p className="settings-muted">No hook log files found in the scoped project or user hook directories.</p>
      )}
      {hookLogs && hookLogs.errors.length > 0 && (
        <div className="settings-command-grid">
          {hookLogs.errors.map((message) => (
            <div key={message} className="settings-command-row">
              <strong>Log diagnostic</strong>
              <code>{message}</code>
              <span>read-only</span>
            </div>
          ))}
        </div>
      )}
      {hookLogRead && (
        <div className="settings-command-grid">
          <div className="settings-command-row">
            <strong>{hookLogRead.ok ? 'Hook log preview' : 'Hook log failed'}</strong>
            <code>{hookLogRead.path || hookLogRead.error || 'No log selected'}</code>
            <span>
              {hookLogRead.ok
                ? `${hookLogRead.sourceScope || 'scoped'} / ${hookLogRead.ext || 'log'} / ${formatBytes(hookLogRead.sizeBytes || 0)}`
                : 'read-only'}
            </span>
          </div>
          {hookLogRead.content && <pre className="advanced-raw">{hookLogRead.content}</pre>}
          {hookLogRead.error && <p className="settings-muted">{hookLogRead.error}</p>}
        </div>
      )}
      <div className="settings-command-grid">
        {examples.map((example) => (
          <div key={example.label} className="settings-command-row">
            <strong>{example.label}</strong>
            <code>{example.command}</code>
            <span>{example.event} / {example.matcher}</span>
          </div>
        ))}
      </div>
      <p className="settings-muted">Scoped hook discovery, enable/disable writes, preview-confirmed broader edit writes, and scoped read-only hook log viewing are available. Hook execution, OS notifications, quiet mode, and response-ready delivery remain gated by `docs/reports/HOOKS_NOTIFICATIONS_GATE.md`.</p>
    </SettingsReferenceCard>
  )
}

export function AboutSettingsReadOnly({
  updateState,
  updateVersion,
  updateDetails,
  commandExecutable
}: {
  updateState: UpdateState
  updateVersion?: string
  updateDetails: string
  commandExecutable: string
}): JSX.Element {
  return (
    <SettingsReferenceCard title="About">
      <ReferenceRow label="GUI package" value="command-code-gui 0.1.0" />
      <ReferenceRow label="Command binary" value={commandExecutable || 'cmd'} />
      <ReferenceRow label="Update status" value={updateLabel(updateState, updateVersion)} />
      {updateDetails && <pre className="settings-about-details">{updateDetails}</pre>}
      <div className="settings-release-list">
        {Object.entries(releaseNotes).map(([version, note]) => (
          <article key={version} className="settings-release-item">
            <span>{version}</span>
            <strong>{note.title}</strong>
            <p>{note.body}</p>
          </article>
        ))}
      </div>
      <p className="settings-muted">Release history is local metadata already bundled with the GUI. This page does not run update checks or mutate installed Command Code state.</p>
    </SettingsReferenceCard>
  )
}

function SettingsReferenceCard({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="settings-card settings-card--wide">
      <div className="settings-readonly-header">
        <strong>{title}</strong>
      </div>
      {children}
    </div>
  )
}

function ReferenceRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="settings-readonly-row">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  )
}

function ShortcutRow({ label, keys, detail }: { label: string; keys: string[]; detail: string }): JSX.Element {
  return (
    <div className="settings-shortcut-row">
      <strong>{label}</strong>
      <span>{keys.map((key) => <kbd key={key}>{key}</kbd>)}</span>
      <small>{detail}</small>
    </div>
  )
}

function updateLabel(state: UpdateState, version?: string): string {
  if (state === 'checking') return 'Checking updates'
  if (state === 'updating') return 'Updating'
  if (state === 'available') return 'Update available'
  if (state === 'failed') return 'Update check failed'
  if (state === 'current') return version || 'Up to date'
  return 'Not checked'
}

function formatBytes(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return '0 B'
  if (sizeBytes < 1024) return `${sizeBytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = sizeBytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

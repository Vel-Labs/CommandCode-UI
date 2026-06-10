import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import {
  formatBytes,
  formatDateTime,
  ReferenceRow,
  SettingsReferenceCard,
  SettingsStackedRow
} from './ReferenceSettingsShared'
import { useHooksSettings } from './useHooksSettings'

export function HooksSettingsReadOnly({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
  const {
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
    applyPreview
  } = useHooksSettings({ transport, cwd })

  return (
    <SettingsReferenceCard title="Hooks">
      <div className="settings-destination-note">
        <span>Command Code-owned config</span>
        <code>settings.json: hooks</code>
        <small>read/write gated</small>
      </div>
      <div className="settings-overview-grid">
        <ReferenceRow label="Project scope" value=".commandcode/settings.json" />
        <ReferenceRow label="User scope" value="~/.commandcode/settings.json" />
        <ReferenceRow label="Precedence" value="Project settings before user settings" />
        <ReferenceRow label="Documented events" value="PreToolUse, PostToolUse, Stop" />
        <ReferenceRow label="Parser gate" value="Invalid JSON and unsupported shapes fail before future writes" />
        <ReferenceRow label="Execution owner" value="Command Code runs hooks; the GUI prepares display, validation, and diagnostics" />
      </div>
      <div className="settings-stacked-list settings-stacked-list--compact">
        {(discovery?.sources ?? []).map((source) => (
          <SettingsStackedRow
            key={`${source.sourceScope}:${source.sourcePath}`}
            title={source.sourceScope === 'project' ? 'Project config' : 'User config'}
            value={source.sourcePath}
            meta={source.exists
              ? `${source.hooks.length} hook${source.hooks.length === 1 ? '' : 's'}${source.ok ? '' : ' / invalid'}`
              : source.errors[0] || 'Not found'}
          />
        ))}
      </div>
      {loading && <p className="settings-muted">Loading hook settings from documented scopes.</p>}
      {error && <p className="settings-muted">{error}</p>}
      {discovery && discovery.hooks.length > 0 && (
        <div className="settings-stacked-list">
          {discovery.hooks.map((hook) => (
            <SettingsStackedRow
              key={`${hook.sourcePath}:${hook.order}:${hook.command}`}
              title={hook.event}
              meta={`${hook.sourceScope} / ${hook.matcher || 'all tools'} / ${hook.enabled ? 'enabled' : 'disabled'}${hook.canBlock ? ' / blocking-capable' : ''}`}
              value={hook.command}
              actions={(
                <>
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
                    onClick={() => dryRunHook(hook)}
                    disabled={dryRunningKey === `${hook.sourceScope}:${hook.sourcePath}:${hook.order}:${hook.command}`}
                  >
                    {dryRunningKey === `${hook.sourceScope}:${hook.sourcePath}:${hook.order}:${hook.command}` ? 'Testing' : 'Dry-run test'}
                  </button>
                  <button
                    className="ghost-button native-ghost settings-inline-action"
                    onClick={() => openEditPreview(hook)}
                  >
                    Edit preview
                  </button>
                </>
              )}
            />
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
      {hookDryRun && (
        <div className="settings-command-grid">
          <div className="settings-command-row">
            <strong>{hookDryRun.ok ? 'Dry-run test' : 'Dry-run failed'}</strong>
            <code>{hookDryRun.command || hookDryRun.error || 'No hook command'}</code>
            <span>
              {hookDryRun.ok
                ? `${hookDryRun.event || 'hook'} / ${hookDryRun.willRun ? 'would run' : 'would skip'} / ${hookDryRun.execution || 'not-run'}`
                : 'not-run'}
            </span>
          </div>
          <p className="settings-muted">{hookDryRun.reason}</p>
          {hookDryRun.payloadJson && <pre className="advanced-raw">{hookDryRun.payloadJson}</pre>}
          {hookDryRun.error && <p className="settings-muted">{hookDryRun.error}</p>}
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
        <div className="settings-stacked-list settings-stacked-list--compact">
          {[...discovery.warnings, ...discovery.errors].map((message) => (
            <SettingsStackedRow key={message} title="Diagnostic" value={message} meta="read-only" />
          ))}
        </div>
      )}
      <div className="settings-stacked-list settings-stacked-list--compact">
        <SettingsStackedRow
          title="Hook logs"
          value=".commandcode/hooks, ~/.commandcode/hooks"
          meta="read-only"
          actions={(
            <button className="ghost-button native-ghost settings-inline-action" onClick={() => void refreshHookLogs()} disabled={hookLogsLoading}>
              {hookLogsLoading ? 'Refreshing' : 'Refresh logs'}
            </button>
          )}
        />
        {(hookLogs?.sources ?? []).map((source) => (
          <SettingsStackedRow
            key={`${source.sourceScope}:${source.dir}`}
            title={source.sourceScope === 'project' ? 'Project logs' : 'User logs'}
            value={source.dir}
            meta={source.exists
              ? `${source.logs.length} log file${source.logs.length === 1 ? '' : 's'}`
              : source.errors[0] || 'Not found'}
          />
        ))}
        {(hookLogs?.logs ?? []).map((log) => (
          <SettingsStackedRow
            key={`${log.sourceScope}:${log.path}`}
            title={`${log.sourceScope} log`}
            value={log.path}
            meta={`${formatBytes(log.sizeBytes)} / ${formatDateTime(log.updatedAt)}`}
            actions={(
              <button className="ghost-button native-ghost settings-inline-action" onClick={() => readHookLog(log)} disabled={readingLogPath === log.path}>
                {readingLogPath === log.path ? 'Opening' : 'Open log'}
              </button>
            )}
          />
        ))}
      </div>
      {hookLogsLoading && <p className="settings-muted">Loading hook logs from scoped hook directories.</p>}
      {hookLogsError && <p className="settings-muted">{hookLogsError}</p>}
      {hookLogs && hookLogs.logs.length === 0 && !hookLogsLoading && (
        <p className="settings-muted">No hook log files found in the scoped project or user hook directories.</p>
      )}
      {hookLogs && hookLogs.errors.length > 0 && (
        <div className="settings-stacked-list settings-stacked-list--compact">
          {hookLogs.errors.map((message) => (
            <SettingsStackedRow key={message} title="Log diagnostic" value={message} meta="read-only" />
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
      <div className="settings-stacked-list settings-stacked-list--compact">
        {examples.map((example) => (
          <SettingsStackedRow
            key={example.label}
            title={example.label}
            value={example.command}
            meta={`${example.event} / ${example.matcher}`}
          />
        ))}
      </div>
      <p className="settings-muted">Scoped hook discovery, enable/disable writes, preview-confirmed broader edit writes, dry-run tests, and scoped read-only hook log viewing are available. Real hook execution, OS notifications, quiet mode, and response-ready delivery remain gated by `docs/reports/HOOKS_NOTIFICATIONS_GATE.md`.</p>
    </SettingsReferenceCard>
  )
}

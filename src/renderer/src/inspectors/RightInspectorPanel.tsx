import { useCallback, useEffect, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { JSX } from 'react'
import { BookOpen, FileText, FolderOpen, GitBranch, Monitor, RefreshCw, X } from 'lucide-react'
import type { DiscoveredSession, GitEnvironmentStatus } from '../../../core/types'
import type { TransportAPI } from '../../../core/transport'
import { FileBrowser } from '../components/FileBrowser'
import { FileViewer } from '../components/FileViewer'
import { IdePanel } from '../components/IdePanel'
import type { RightInspector } from '../appTypes'
import { TranscriptPreview } from '../components/TranscriptPreview'

export function RightInspectorPanel({
  mode,
  transport,
  cwd,
  commandExecutable,
  filePath,
  fileSourceLabel,
  transcript,
  onClose,
  onSelectFile,
  onSelectArtifact,
  onOpenFiles,
  onOpenTranscript,
  onOpenDocs,
  onOpenEnvironment,
  onOpenIde,
  onRevealTranscript,
  onRevealProject,
  onResizeStart,
  liveTranscript = false
}: {
  mode: RightInspector
  transport: TransportAPI
  cwd: string
  commandExecutable: string
  filePath?: string
  fileSourceLabel?: string
  transcript?: DiscoveredSession
  onClose: () => void
  onSelectFile: (path: string) => void
  onSelectArtifact?: (path: string, session: DiscoveredSession) => void
  onOpenFiles: () => void
  onOpenTranscript: () => void
  onOpenDocs: () => void
  onOpenEnvironment: () => void
  onOpenIde: () => void
  onRevealTranscript: () => void
  onRevealProject: () => void
  onResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void
  liveTranscript?: boolean
}): JSX.Element | null {
  if (mode === 'none') return null

  const title = mode === 'files'
    ? 'Files'
    : mode === 'file'
      ? 'File'
      : mode === 'transcript'
        ? 'Transcript'
        : mode === 'docs'
          ? 'Docs'
          : mode === 'environment'
            ? 'Environment'
            : mode === 'ide'
              ? 'IDE'
              : 'Inspector'

  return (
    <aside className="right-inspector" aria-label={title}>
      <div
        className="right-inspector-resize-handle"
        onPointerDown={onResizeStart}
        title="Resize or collapse inspector"
        aria-label="Resize or collapse inspector"
      />
      <header className="right-inspector-header">
        <div className="right-inspector-title-group">
          <div>{title}</div>
          <div className="right-inspector-switcher" aria-label="Inspector views">
            <InspectorModeButton active={mode === 'files' || mode === 'file'} label="Files" onClick={onOpenFiles} icon={<FolderOpen size={13} />} />
            <InspectorModeButton active={mode === 'transcript'} label="Transcript" onClick={onOpenTranscript} icon={<FileText size={13} />} />
            <InspectorModeButton active={mode === 'docs'} label="Docs" onClick={onOpenDocs} icon={<BookOpen size={13} />} />
            <InspectorModeButton active={mode === 'environment'} label="Env" onClick={onOpenEnvironment} icon={<GitBranch size={13} />} />
            <InspectorModeButton active={mode === 'ide'} label="IDE" onClick={onOpenIde} icon={<Monitor size={13} />} />
          </div>
        </div>
        <div className="right-inspector-actions">
          <button className="icon-button" onClick={onClose} title="Close inspector"><X size={16} /></button>
        </div>
      </header>
      <div className="right-inspector-body">
        {mode === 'files' && <FileBrowser transport={transport} cwd={cwd} onSelectFile={onSelectFile} />}
        {mode === 'file' && (
          filePath
            ? <FileViewer transport={transport} filePath={filePath} cwd={cwd} sourceLabel={fileSourceLabel} onClose={onOpenFiles} variant="inline" />
            : <InspectorEmpty title="No file selected" detail="Choose a project file to preview it here." />
        )}
        {mode === 'transcript' && (
          transcript
            ? (
              <>
                <div className="inspector-button-row">
                  <button className="ghost-button native-ghost" onClick={onRevealTranscript}>Reveal transcript</button>
                </div>
                <TranscriptPreview transport={transport} session={transcript} cwd={cwd} onOpenArtifact={(path) => onSelectArtifact ? onSelectArtifact(path, transcript) : onSelectFile(path)} liveSession={liveTranscript} />
              </>
            )
            : <InspectorEmpty title="No transcript selected" detail="Open a recent context or active session transcript." />
        )}
        {mode === 'docs' && (
          <iframe className="right-docs-frame" src="https://commandcode.ai/docs" title="Command Code Docs" />
        )}
        {mode === 'environment' && <EnvironmentTracker transport={transport} cwd={cwd} />}
        {mode === 'ide' && (
          <div className="inspector-stack">
            <button className="ghost-button native-ghost" onClick={onRevealProject} disabled={!cwd.trim()}><FolderOpen size={16} /> Reveal project</button>
            <IdePanel transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
          </div>
        )}
      </div>
    </aside>
  )
}

function InspectorModeButton({
  active,
  label,
  icon,
  onClick
}: {
  active: boolean
  label: string
  icon: JSX.Element
  onClick: () => void
}): JSX.Element {
  return (
    <button
      className={`right-inspector-switcher-button ${active ? 'right-inspector-switcher-button--active' : ''}`}
      onClick={onClick}
      title={`Open ${label}`}
      aria-pressed={active}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function EnvironmentTracker({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
  const [status, setStatus] = useState<GitEnvironmentStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      setStatus(await transport.gitStatus(cwd))
    } catch (err) {
      setStatus({
        ok: false,
        cwd,
        filesChanged: 0,
        insertions: 0,
        deletions: 0,
        added: 0,
        modified: 0,
        deleted: 0,
        untracked: 0,
        files: [],
        raw: '',
        error: err instanceof Error ? err.message : 'Git status failed'
      })
    } finally {
      setLoading(false)
    }
  }, [transport, cwd])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!status) return <div className="muted">Loading environment...</div>

  return (
    <div className="environment-panel">
      <div className="environment-panel-header">
        <div>
          <div className="inspector-section-label">Environment</div>
          <div className="environment-branch"><GitBranch size={16} /> {status.branch || 'No branch'}</div>
        </div>
        <button className="icon-button" onClick={() => void refresh()} title="Refresh environment" disabled={loading}>
          <RefreshCw size={16} />
        </button>
      </div>

      {status.error && <div className="error-text">{status.error}</div>}

      <div className="environment-card">
        <div className="environment-row">
          <span>Changes</span>
          <strong><span className="text-green">+{status.insertions}</span> <span className="text-red">-{status.deletions}</span></strong>
        </div>
        <div className="environment-row">
          <span>Local</span>
          <strong>{status.filesChanged} files</strong>
        </div>
        <div className="environment-row">
          <span>Remote</span>
          <strong>{status.ahead || 0} ahead · {status.behind || 0} behind</strong>
        </div>
      </div>

      <div className="environment-card">
        <div className="environment-row"><span>Added</span><strong>{status.added}</strong></div>
        <div className="environment-row"><span>Modified</span><strong>{status.modified}</strong></div>
        <div className="environment-row"><span>Deleted</span><strong>{status.deleted}</strong></div>
        <div className="environment-row"><span>Untracked</span><strong>{status.untracked}</strong></div>
      </div>

      <div className="environment-file-list">
        <div className="inspector-section-label">Changed files</div>
        {status.files.length === 0 ? (
          <div className="muted">No changed files.</div>
        ) : (
          status.files.map((file) => (
            <div key={`${file.status}-${file.path}`} className="environment-file-row">
              <code>{file.status}</code>
              <span>{file.path}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function InspectorEmpty({ title, detail }: { title: string; detail: string }): JSX.Element {
  return (
    <div className="inspector-empty">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  )
}

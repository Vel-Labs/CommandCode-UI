import type { JSX, PointerEvent } from 'react'
import type { DiscoveredSession } from '../../../core/types'
import type { TransportAPI } from '../../../core/transport'
import type { RightInspector, WorkEvent } from '../appTypes'
import { RightInspectorPanel } from '../inspectors/RightInspectorPanel'

export function AppRightInspector({
  mode,
  transport,
  cwd,
  commandExecutable,
  filePath,
  fileSourceLabel,
  transcript,
  liveTranscript,
  setRightInspector,
  setViewingFile,
  setViewingFileSource,
  addWorkEvent,
  displayPath,
  revealTranscriptPath,
  revealProjectPath,
  startInspectorResize
}: {
  mode: RightInspector
  transport: TransportAPI
  cwd: string
  commandExecutable: string
  filePath?: string
  fileSourceLabel?: string
  transcript?: DiscoveredSession
  liveTranscript?: boolean
  setRightInspector: (value: RightInspector) => void
  setViewingFile: (value: string | undefined) => void
  setViewingFileSource: (value: string | undefined) => void
  addWorkEvent: (label: string, detail: string, tone?: WorkEvent['tone']) => void
  displayPath: (value: string) => string
  revealTranscriptPath: (transcriptPath: string) => Promise<void>
  revealProjectPath: () => Promise<void>
  startInspectorResize: (event: PointerEvent<HTMLDivElement>) => void
}): JSX.Element {
  return (
    <RightInspectorPanel
      mode={mode}
      transport={transport}
      cwd={cwd}
      commandExecutable={commandExecutable}
      filePath={filePath}
      fileSourceLabel={fileSourceLabel}
      transcript={transcript}
      onClose={() => setRightInspector('none')}
      onSelectFile={(path) => {
        setViewingFile(path)
        setViewingFileSource('Project file')
        setRightInspector('file')
        addWorkEvent('Opened file', displayPath(path))
      }}
      onSelectArtifact={(path, session) => {
        setViewingFile(path)
        setViewingFileSource(`Artifact from ${session.title || session.id}`)
        setRightInspector('file')
        addWorkEvent('Opened artifact', displayPath(path))
      }}
      onOpenFiles={() => setRightInspector('files')}
      onOpenTranscript={() => setRightInspector('transcript')}
      onOpenDocs={() => setRightInspector('docs')}
      onOpenEnvironment={() => setRightInspector('environment')}
      onOpenIde={() => setRightInspector('ide')}
      onRevealTranscript={() => transcript?.transcriptPath && void revealTranscriptPath(transcript.transcriptPath)}
      onRevealProject={() => void revealProjectPath()}
      onResizeStart={startInspectorResize}
      liveTranscript={liveTranscript}
    />
  )
}

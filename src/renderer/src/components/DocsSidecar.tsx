import type { JSX } from 'react'

type DocsSidecarProps = {
  visible: boolean
  onClose: () => void
}

const DOCS_BASE = 'https://commandcode.ai/docs'

export function DocsSidecar({ visible, onClose }: DocsSidecarProps): JSX.Element | null {
  if (!visible) return null

  return (
    <div className="docs-sidecar-overlay">
      <div className="docs-sidecar">
        <div className="docs-sidecar-header">
          <span className="docs-sidecar-title">Command Code Docs</span>
          <div className="docs-sidecar-actions">
            <button className="ghost-button" onClick={() => {
              const iframe = document.querySelector('.docs-sidecar iframe') as HTMLIFrameElement | null
              iframe?.contentWindow?.history?.back()
            }} title="Back">
              ←
            </button>
            <button className="ghost-button" onClick={() => {
              const iframe = document.querySelector('.docs-sidecar iframe') as HTMLIFrameElement | null
              iframe?.contentWindow?.history?.forward()
            }} title="Forward">
              →
            </button>
            <button className="ghost-button" onClick={() => {
              const iframe = document.querySelector('.docs-sidecar iframe') as HTMLIFrameElement | null
              if (iframe) iframe.src = DOCS_BASE
            }} title="Home">
              🏠
            </button>
            <button className="ghost-button docs-sidecar-close" onClick={onClose}>×</button>
          </div>
        </div>
        <iframe
          src={DOCS_BASE}
          className="docs-sidecar-frame"
          title="Command Code Documentation"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  )
}

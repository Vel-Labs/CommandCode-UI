import { useState, useEffect } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'

type FileViewerProps = {
  transport: TransportAPI
  filePath?: string
  cwd?: string
  onClose: () => void
  variant?: 'overlay' | 'inline'
}

export function FileViewer({ transport, filePath, cwd, onClose, variant = 'overlay' }: FileViewerProps): JSX.Element | null {
  const [content, setContent] = useState('')
  const [ext, setExt] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!filePath) return

    transport.readFile(filePath, cwd).then((result) => {
      if (result.error) {
        setError(result.error)
        setContent('')
      } else {
        setContent(result.content)
        setExt(result.ext)
        setError('')
      }
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Read failed')
    })
  }, [filePath, cwd, transport])

  if (!filePath) return null

  const lines = content.split('\n').length
  const sizeLabel = content.length < 1024
    ? `${content.length}B`
    : `${(content.length / 1024).toFixed(1)}KB`

  const isMd = ext === '.md'
  const isAnsi = filePath.endsWith('.ansi')

  const contentNode = (
    <div className={`file-viewer ${variant === 'inline' ? 'file-viewer--inline' : ''}`}>
      <div className="file-viewer-header">
        <span className="file-viewer-name">{filePath.split('/').pop()}</span>
        <span className="file-viewer-meta">{lines} lines, {sizeLabel}</span>
        <button className="ghost-button file-viewer-close" onClick={onClose}>×</button>
      </div>
      <div className="file-viewer-body">
        {error && <div className="error-text">{error}</div>}
        {!error && isAnsi && (
          <pre className="file-content ansi-content">{content}</pre>
        )}
        {!error && !isMd && !isAnsi && (
          <pre className="file-content">{content}</pre>
        )}
        {!error && isMd && (
          <div className="file-content md-content">
            {renderMarkdownSync(content)}
          </div>
        )}
      </div>
    </div>
  )

  if (variant === 'inline') return contentNode

  return (
    <div className="file-viewer-overlay">
      {contentNode}
    </div>
  )
}

function renderMarkdownSync(md: string): JSX.Element {
  const elements: JSX.Element[] = []
  const lines = md.split('\n')
  let inCode = false
  let codeBuf: string[] = []
  let codeLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    if (line.startsWith('```')) {
      if (inCode) {
        elements.push(<pre key={i} className="markdown-code"><code>{codeBuf.join('\n')}</code></pre>)
        codeBuf = []
        inCode = false
      } else {
        inCode = true
        codeLang = line.slice(3).trim()
      }
      continue
    }

    if (inCode) {
      codeBuf.push(line)
      continue
    }

    if (line === '') {
      elements.push(<div key={i} className="md-blank">&nbsp;</div>)
    } else if (line.startsWith('# ')) {
      elements.push(<h3 key={i} className="md-h1">{line.slice(2)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h4 key={i} className="md-h2">{line.slice(3)}</h4>)
    } else if (line.startsWith('### ')) {
      elements.push(<h5 key={i} className="md-h3">{line.slice(4)}</h5>)
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="md-hr" />)
    } else if (line.startsWith('- ')) {
      elements.push(<div key={i} className="md-li">• {parseInline(line.slice(2))}</div>)
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(<div key={i} className="md-li">{parseInline(line)}</div>)
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} className="md-quote">{parseInline(line.slice(2))}</blockquote>)
    } else if (line.startsWith('|')) {
      elements.push(renderTableLine(line, i))
    } else {
      elements.push(<p key={i} className="md-p">{parseInline(line)}</p>)
    }
  }

  return <div>{elements}</div>
}

function parseInline(text: string): JSX.Element | string {
  const parts: (string | JSX.Element)[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/`([^`]+)`/)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)

    const matches = [codeMatch, boldMatch, linkMatch].filter(Boolean) as RegExpMatchArray[]
    if (matches.length === 0) {
      parts.push(remaining)
      break
    }

    matches.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    const m = matches[0]!
    const idx = m.index ?? 0

    if (idx > 0) {
      parts.push(remaining.slice(0, idx))
    }

    if (m === codeMatch) {
      parts.push(<code key={key++} className="markdown-inline-code">{m[1]}</code>)
    } else if (m === boldMatch) {
      parts.push(<strong key={key++}>{m[1]}</strong>)
    } else if (m === linkMatch) {
      parts.push(<a key={key++} href={m[2]} target="_blank" rel="noopener">{m[1]}</a>)
    }

    remaining = remaining.slice(idx + m[0].length)
  }

  if (parts.length === 1 && typeof parts[0] === 'string') return parts[0]
  return <span>{parts}</span>
}

function renderTableLine(line: string, key: number): JSX.Element {
  const cells = line.split('|').filter(Boolean).map((c) => c.trim())
  if (cells.every((c) => /^-+$/.test(c))) {
    return <div key={key} className="md-table-sep" />
  }
  return (
    <div key={key} className="md-table-row">
      {cells.map((c, ci) => <span key={ci} className="md-table-cell">{parseInline(c)}</span>)}
    </div>
  )
}

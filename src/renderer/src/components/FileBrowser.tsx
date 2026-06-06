import { useState, useEffect } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import type { FileEntry } from '../../../core/types'

type FileBrowserProps = {
  transport: TransportAPI
  cwd: string
  onSelectFile: (path: string) => void
}

type TreeNode = FileEntry & { children?: TreeNode[]; depth: number }

export function FileBrowser({ transport, cwd, onSelectFile }: FileBrowserProps): JSX.Element {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loadingPath, setLoadingPath] = useState('')
  const [loadedCwd, setLoadedCwd] = useState('')

  const loadDir = async (dir: string) => {
    setLoadingPath(dir)
    try {
      const result = await transport.listFiles(dir, cwd)
      if (result.error) {
        setError(result.error)
        return
      }
      const nodes: TreeNode[] = result.entries.map((e) => ({ ...e, depth: 0, children: undefined }))
      if (dir === cwd) {
        setTree(nodes)
      } else {
        setTree((prev) => updateChildren(prev, dir, nodes))
      }
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list files')
    } finally {
      setLoadingPath('')
    }
  }

  useEffect(() => {
    if (cwd && cwd !== loadedCwd) {
      setTree([])
      setExpanded(new Set())
      setLoadedCwd(cwd)
      loadDir(cwd)
    }
  }, [cwd, loadedCwd])

  const updateChildren = (nodes: TreeNode[], targetDir: string, children: TreeNode[]): TreeNode[] =>
    nodes.map((n) => {
      if (n.path === targetDir) return { ...n, children }
      if (n.children) return { ...n, children: updateChildren(n.children, targetDir, children) }
      return n
    })

  const toggleDir = async (dirPath: string) => {
    if (expanded.has(dirPath)) {
      setExpanded((prev) => { const next = new Set(prev); next.delete(dirPath); return next })
    } else {
      setExpanded((prev) => new Set(prev).add(dirPath))
      const node = findNode(tree, dirPath)
      if (node && !node.children) {
        await loadDir(dirPath)
      }
    }
  }

  const findNode = (nodes: TreeNode[], targetPath: string): TreeNode | undefined => {
    for (const n of nodes) {
      if (n.path === targetPath) return n
      if (n.children) {
        const found = findNode(n.children, targetPath)
        if (found) return found
      }
    }
    return undefined
  }

  const renderNode = (node: TreeNode): JSX.Element => {
    const isDir = node.isDirectory
    const isExpanded = expanded.has(node.path)
    const indent = { paddingLeft: `${node.depth * 12 + 4}px` }
    const basename = node.name

    return (
      <div key={node.path}>
        <div
          className={`file-node ${isDir && isExpanded ? 'file-node--expanded' : ''}`}
          style={indent}
          onClick={() => isDir ? toggleDir(node.path) : onSelectFile(node.path)}
        >
          <span className="file-icon">{isDir ? (isExpanded ? '📂' : '📁') : fileIcon(basename)}</span>
          <span className="file-name">{basename}</span>
          {node.size != null && <span className="file-size">{fmtSize(node.size)}</span>}
        </div>
        {isDir && isExpanded && node.children && (
          node.children.map((child) => renderNode({ ...child, depth: node.depth + 1 }))
        )}
      </div>
    )
  }

  return (
    <div className="file-browser">
      <div className="section-heading file-browser-heading">
        Project files
        <button className="ghost-button" onClick={() => { setTree([]); loadDir(cwd) }} style={{ fontSize: '0.65rem' }}>
          Reload
        </button>
      </div>
      {loadingPath && <div className="muted" style={{ padding: '4px 8px', fontSize: '11px' }}>Loading...</div>}
      {error && <div className="error-text" style={{ padding: '4px 8px', fontSize: '11px' }}>{error}</div>}
      <div className="file-tree">
        {tree.map((node) => renderNode({ ...node, depth: 0 }))}
      </div>
    </div>
  )
}

function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    md: '📝',
    json: '📋',
    ansi: '💻',
    ts: '🔷',
    tsx: '⚛️',
    js: '🟨',
    jsx: '⚛️',
    css: '🎨',
    html: '🌐',
    py: '🐍',
    rs: '🦀',
    go: '🔵',
    yaml: '⚙️',
    yml: '⚙️',
    toml: '⚙️',
    gitignore: '🙈',
    lock: '🔒',
    sh: '⚡',
    sql: '🗄️'
  }
  return map[ext ?? ''] ?? '📄'
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

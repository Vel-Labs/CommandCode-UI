import { useState, useEffect } from 'react'
import type { JSX } from 'react'

const RECENT_KEY = 'ccgui.recent-dirs'
const MAX_RECENT = 8

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[]
  } catch {
    return []
  }
}

function saveRecent(dirs: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(dirs))
}

function addRecent(dir: string) {
  const dirs = loadRecent().filter((d) => d !== dir)
  dirs.unshift(dir)
  saveRecent(dirs.slice(0, MAX_RECENT))
}

function removeRecent(dir: string) {
  saveRecent(loadRecent().filter((d) => d !== dir))
}

type RecentProjectsProps = {
  cwd: string
  onSelect: (dir: string) => void
}

export function RecentProjects({ cwd, onSelect }: RecentProjectsProps): JSX.Element {
  const [recent, setRecent] = useState<string[]>(loadRecent)

  useEffect(() => {
    if (cwd && recent[0] !== cwd) {
      addRecent(cwd)
      setRecent(loadRecent())
    }
  }, [cwd])

  if (recent.length === 0) return <div />

  return (
    <div className="panel-section">
      <div className="section-heading">Recent projects</div>
      <div className="recent-list">
        {recent.map((dir) => (
          <button
            key={dir}
            className={`recent-entry ${dir === cwd ? 'recent-entry--active' : ''}`}
            onClick={() => onSelect(dir)}
            title={dir}
          >
            <span className="recent-icon">📁</span>
            <span className="recent-path">{dir.split('/').pop() || dir}</span>
            <span
              className="recent-remove"
              onClick={(e) => {
                e.stopPropagation()
                removeRecent(dir)
                setRecent(loadRecent())
              }}
            >
              ×
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { JSX } from 'react'

const HISTORY_KEY = 'ccgui.command-history'
const MAX_HISTORY = 50
const FAVORITES_KEY = 'ccgui.favorite-commands'

function loadList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as string[]
  } catch {
    return []
  }
}

function saveList(key: string, items: string[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

type CommandHistoryProps = {
  activeSessionId?: string
  onReplay: (command: string) => void
}

export function CommandHistory({ activeSessionId, onReplay }: CommandHistoryProps): JSX.Element {
  const [history, setHistory] = useState<string[]>(loadList(HISTORY_KEY))
  const [favorites, setFavorites] = useState<string[]>(loadList(FAVORITES_KEY))

  const toggleFavorite = (cmd: string) => {
    setFavorites((prev) => {
      const next = prev.includes(cmd) ? prev.filter((c) => c !== cmd) : [...prev, cmd]
      saveList(FAVORITES_KEY, next)
      return next
    })
  }

  const all = [...new Set([...favorites, ...history])].slice(0, 20)

  if (all.length === 0) return <div />

  return (
    <div className="panel-section">
      <div className="section-heading">Command history</div>
      <div className="history-list">
        {all.map((cmd, i) => (
          <button
            key={`${i}-${cmd}`}
            className="history-entry"
            onClick={() => onReplay(cmd)}
            disabled={!activeSessionId}
            title={cmd}
          >
            <span
              className="history-star"
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(cmd)
              }}
            >
              {favorites.includes(cmd) ? '★' : '☆'}
            </span>
            <span className="history-command">{cmd}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function pushCommandHistory(command: string) {
  const trimmed = command.trim()
  if (!trimmed || trimmed.length > 500) return
  const history = loadList(HISTORY_KEY).filter((c) => c !== trimmed)
  history.unshift(trimmed)
  saveList(HISTORY_KEY, history.slice(0, MAX_HISTORY))
}

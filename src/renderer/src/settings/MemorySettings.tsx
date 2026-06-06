import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import { SettingsReadOnlyCard } from './SettingsReadOnlyCard'

export function MemorySettingsReadOnly({ transport, cwd }: { transport: TransportAPI; cwd: string }): JSX.Element {
  const [memories, setMemories] = useState<Array<{ path: string; name: string; content: string }>>([])
  const [editing, setEditing] = useState<string | undefined>()
  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setMemories((await transport.listMemories(cwd || undefined)).memories)
    } catch {
      setMemories([])
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (memory: { path: string; content: string }): void => {
    setEditing(memory.path)
    setContent(memory.content)
    setSaveStatus(undefined)
  }

  const saveMemory = async (filePath: string): Promise<void> => {
    setSaveStatus('Saving...')
    try {
      await transport.saveMemory(filePath, content, cwd)
      setEditing(undefined)
      setContent('')
      setSaveStatus('Saved memory file.')
      await load()
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Failed to save memory file.')
    }
  }

  useEffect(() => { void load() }, [cwd])

  return (
    <SettingsReadOnlyCard title={`Memory files (${memories.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Project-scoped memory discovery and editing through the existing memory save route. Command Code remains the source of memory semantics.</p>
      {saveStatus && <p className="settings-muted">{saveStatus}</p>}
      {memories.map((memory) => (
        <div key={memory.path} className="settings-readonly-row">
          <button
            className="settings-readonly-toggle"
            onClick={() => startEditing(memory)}
          >
            <strong>{memory.name}</strong>
            <span>{memory.path}</span>
          </button>
          {editing === memory.path && (
            <div className="settings-editor-block">
              <span className="settings-destination-note">Destination: {memory.path}</span>
              <textarea
                className="settings-editor-textarea"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={10}
              />
              <div className="agent-editor-actions">
                <button className="primary-button" onClick={() => { void saveMemory(memory.path) }}>Save memory</button>
                <button className="ghost-button" onClick={() => {
                  setEditing(undefined)
                  setContent('')
                  setSaveStatus(undefined)
                }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

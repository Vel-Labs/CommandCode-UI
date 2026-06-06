import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import { SettingsReadOnlyCard } from './SettingsReadOnlyCard'

export function SkillsSettingsReadOnly({ transport }: { transport: TransportAPI }): JSX.Element {
  const [skills, setSkills] = useState<Array<{ path: string; name: string; description?: string; content?: string }>>([])
  const [expanded, setExpanded] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setSkills((await transport.listSkills()).skills)
    } catch {
      setSkills([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <SettingsReadOnlyCard title={`Skills (${skills.length})`} loading={loading} onRefresh={load}>
      <p className="settings-muted">Read-only skill discovery. Insert/use actions remain planned until command previews are added.</p>
      {skills.map((skill) => (
        <div key={skill.path} className="settings-readonly-row">
          <button
            className="settings-readonly-toggle"
            onClick={() => setExpanded(expanded === skill.path ? undefined : skill.path)}
          >
            <strong>{skill.name}</strong>
            <span>{skill.description || skill.path}</span>
          </button>
          {expanded === skill.path && (
            <pre className="settings-preview-block">{skill.content || 'No skill content available.'}</pre>
          )}
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

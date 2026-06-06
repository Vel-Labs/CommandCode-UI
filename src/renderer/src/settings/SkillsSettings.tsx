import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { TransportAPI } from '../../../core/transport'
import { SettingsReadOnlyCard } from './SettingsReadOnlyCard'

type SkillRow = {
  path: string
  name: string
  description?: string
  content?: string
}

export function SkillsSettingsReadOnly({ transport }: { transport: TransportAPI }): JSX.Element {
  const [skills, setSkills] = useState<SkillRow[]>([])
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
          <code className="settings-readonly-path">{skill.path}</code>
          <span className="settings-destination-note">Scope: {skillScopeLabel(skill.path)} - read-only</span>
          {expanded === skill.path && (
            <>
              <div className="settings-command-preview">
                <span>Execution</span>
                <code>Insert/use not available in this package</code>
              </div>
              <pre className="settings-preview-block">{skill.content || 'No skill content available.'}</pre>
            </>
          )}
        </div>
      ))}
    </SettingsReadOnlyCard>
  )
}

function skillScopeLabel(path: string): string {
  if (path.includes('/.commandcode/skills/') || path.includes('\\.commandcode\\skills\\')) return 'user Command Code'
  if (path.includes('/.agents/skills/') || path.includes('\\.agents\\skills\\')) return 'agent plugin'
  return 'discovered'
}

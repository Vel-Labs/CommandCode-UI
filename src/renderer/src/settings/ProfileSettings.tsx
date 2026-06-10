import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { Bot, Braces, CreditCard, Database, History, Keyboard, MemoryStick, Monitor, Plug, Settings, Sparkles, Terminal, Wrench } from 'lucide-react'
import type { PermissionMode } from '../../../shared/types'
import type { DoctorResult } from '../../../core/doctor'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { RuntimeMode, SettingsSection } from '../appTypes'
import type { HeadlessJob } from '../components/HeadlessHistory'
import { SettingsPageHeader } from './SettingsPageHeader'
import { settingsItem } from './settingsRegistry'

const profileActions: Array<{
  section: SettingsSection
  label: string
  description: string
  icon: JSX.Element
}> = [
  { section: 'general', label: 'Choose Command Code binary', description: 'Confirm the CLI path and startup behavior.', icon: <Settings size={16} /> },
  { section: 'runtime', label: 'Review runtime health', description: 'Check PTY, auth, model, permissions, and IDE state.', icon: <Wrench size={16} /> },
  { section: 'integrations', label: 'Set up integrations', description: 'Open MCP, hooks, agents, memory, design, skills, and taste tasks.', icon: <Plug size={16} /> }
]

const settingsTaskGroups: Array<{
  label: string
  description: string
  actions: Array<{ section: SettingsSection; label: string; icon: JSX.Element }>
}> = [
  {
    label: 'Project tools',
    description: 'Work with project-scoped sessions, memory, agents, and data.',
    actions: [
      { section: 'sessions', label: 'Sessions', icon: <History size={15} /> },
      { section: 'memory', label: 'Memory', icon: <MemoryStick size={15} /> },
      { section: 'agents', label: 'Agents', icon: <Bot size={15} /> },
      { section: 'data', label: 'Data', icon: <Database size={15} /> }
    ]
  },
  {
    label: 'Integration setup',
    description: 'Configure or inspect Command Code extension surfaces.',
    actions: [
      { section: 'mcp', label: 'MCP', icon: <Plug size={15} /> },
      { section: 'hooks', label: 'Hooks', icon: <Braces size={15} /> },
      { section: 'design', label: 'Design', icon: <Monitor size={15} /> },
      { section: 'skills', label: 'Skills', icon: <MemoryStick size={15} /> }
    ]
  },
  {
    label: 'Reference and diagnostics',
    description: 'Check usage, shortcuts, terminal presentation, notifications, and release state.',
    actions: [
      { section: 'usage', label: 'Usage', icon: <CreditCard size={15} /> },
      { section: 'keyboard', label: 'Keyboard', icon: <Keyboard size={15} /> },
      { section: 'terminal', label: 'Terminal', icon: <Terminal size={15} /> },
      { section: 'about', label: 'About', icon: <Sparkles size={15} /> }
    ]
  }
]

export function ProfileSettings({
  cwd,
  projectLabel,
  commandExecutable,
  model,
  ptyHealth,
  permissionMode,
  trust,
  headlessJobs,
  sessionCount,
  runtimeMode,
  transport,
  openSection
}: {
  cwd: string
  projectLabel: string
  commandExecutable: string
  model: string
  ptyHealth: PtyDoctorResult | null
  permissionMode: PermissionMode
  trust: boolean
  headlessJobs: HeadlessJob[]
  sessionCount: number
  runtimeMode: RuntimeMode
  transport: TransportAPI
  openSection: (section: SettingsSection) => void
}): JSX.Element {
  const runtimeHealth = ptyHealth ? (ptyHealth.healthy ? 'Healthy' : 'Unavailable') : 'Checking'
  const completedHeadless = headlessJobs.filter((job) => job.result).length
  const failedHeadless = headlessJobs.filter((job) => job.result && job.result.exitCode !== 0).length
  const [doctor, setDoctor] = useState<DoctorResult | null>(null)
  const [doctorError, setDoctorError] = useState('')

  useEffect(() => {
    let cancelled = false
    transport.doctor()
      .then((result) => {
        if (!cancelled) {
          setDoctor(result)
          setDoctorError('')
        }
      })
      .catch((err) => {
        if (!cancelled) setDoctorError(err instanceof Error ? err.message : 'Doctor check failed')
      })
    return () => {
      cancelled = true
    }
  }, [transport])

  return (
    <div className="settings-profile-page">
      <SettingsPageHeader
        item={settingsItem('profile')}
        status={`${runtimeHealth} PTY / ${modeLabel(runtimeMode)}`}
        scope={cwd ? projectLabel : 'No project selected'}
      />
      <div className="profile-stat-strip">
        <div><strong>{sessionCount}</strong><span>Open sessions</span></div>
        <div><strong>{headlessJobs.length}</strong><span>Headless runs</span></div>
        <div><strong>{completedHeadless}</strong><span>Completed runs</span></div>
        <div><strong>{runtimeHealth}</strong><span>PTY health</span></div>
        <div><strong>{permissionLabel(permissionMode, trust)}</strong><span>Permissions</span></div>
      </div>
      <div className="settings-card settings-card--wide settings-setup-card">
        <div className="settings-readonly-header">
          <strong>Setup checklist</strong>
          <span className="settings-state-pill">{failedHeadless ? `${failedHeadless} failed run${failedHeadless === 1 ? '' : 's'}` : 'No failed runs'}</span>
        </div>
        <div className="settings-checklist-grid">
          <SetupCheck label="Command binary" value={commandExecutable} state={commandExecutable ? 'Set' : 'Missing'} />
          <SetupCheck label="PTY" value={ptyHealth?.shell || 'Not available'} state={runtimeHealth} />
          <SetupCheck label="Project" value={projectLabel} state={cwd ? 'Selected' : 'Not selected'} />
          <SetupCheck label="Model" value={model || 'Default at start'} state={model ? 'Override' : 'Default'} />
          <SetupCheck label="Permissions" value={permissionLabel(permissionMode, trust)} state={trust || permissionMode === 'auto-accept' ? 'Risk visible' : 'Standard'} />
        </div>
        <div className="settings-checklist-grid settings-checklist-grid--doctor">
          {doctor?.checks.map((check) => (
            <SetupCheck key={check.id} label={check.label} value={check.detail} state={check.status === 'pass' ? 'Ready' : check.status === 'warn' ? 'Guidance' : 'Action required'} />
          ))}
          {!doctor && !doctorError && <SetupCheck label="Doctor" value="Checking" state="Loading" />}
          {doctorError && <SetupCheck label="Doctor" value={doctorError} state="Unavailable" />}
        </div>
      </div>
      <div className="settings-card settings-card--wide profile-action-card">
        <div className="settings-readonly-header">
          <strong>Recommended next actions</strong>
        </div>
        <div className="settings-action-grid profile-action-grid">
          {profileActions.map((item) => (
            <button key={item.section} className="settings-action-tile" onClick={() => openSection(item.section)}>
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="settings-task-group-grid">
        {settingsTaskGroups.map((group) => (
          <section key={group.label} className="settings-task-group">
            <strong>{group.label}</strong>
            <p>{group.description}</p>
            <div className="settings-task-link-row">
              {group.actions.map((action) => (
                <button key={action.section} className="settings-task-link" onClick={() => openSection(action.section)}>
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function SetupCheck({ label, value, state }: { label: string; value: string; state: string }): JSX.Element {
  return (
    <div className="settings-check-item">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{state}</small>
    </div>
  )
}

function modeLabel(mode: RuntimeMode): string {
  return mode === 'mock' ? 'Demo mode' : 'Real session'
}

function permissionLabel(permissionMode: PermissionMode, trust: boolean): string {
  if (trust || permissionMode === 'auto-accept') return 'Full access'
  return 'Standard'
}

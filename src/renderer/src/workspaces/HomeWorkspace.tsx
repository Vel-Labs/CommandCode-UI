import type { JSX } from 'react'
import type { GitEnvironmentStatus } from '../../../core/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { RuntimeMode } from '../appTypes'
import { ComposerBar } from '../components/ComposerBar'
import { GitEnvironmentBadge } from '../components/GitEnvironmentBadge'
import { PtyHealthBadge } from '../components/PtyHealthBadge'

export function HomeWorkspace({
  prompt,
  setPrompt,
  onSubmit,
  showPlanSuggestion,
  onPlanMode,
  projectLabel,
  model,
  permissionLabel,
  riskyPermission,
  onProject,
  onPermission,
  onModel,
  onSlash,
  runtimeMode,
  ptyHealth,
  statusLine,
  gitStatus,
  gitStatusLoading
}: {
  prompt: string
  setPrompt: (value: string) => void
  onSubmit: () => Promise<void>
  showPlanSuggestion: boolean
  onPlanMode: () => Promise<void>
  projectLabel: string
  model: string
  permissionLabel: string
  riskyPermission: boolean
  onProject: () => void
  onPermission: () => void
  onModel: () => void
  onSlash: () => void
  runtimeMode: RuntimeMode
  ptyHealth: PtyDoctorResult | null
  statusLine: string
  gitStatus: GitEnvironmentStatus | null
  gitStatusLoading: boolean
}): JSX.Element {
  return (
    <section className="home-workspace" aria-label="New session">
      <div className="home-composer-wrap">
        <h1>What should Command Code do?</h1>
        <ComposerBar
          active={false}
          prompt={prompt}
          setPrompt={setPrompt}
          onSubmit={onSubmit}
          showPlanSuggestion={showPlanSuggestion}
          onPlanMode={onPlanMode}
          projectLabel={projectLabel}
          modelLabel={model || 'Default'}
          permissionLabel={permissionLabel}
          riskyPermission={riskyPermission}
          onProject={onProject}
          onPermission={onPermission}
          onModel={onModel}
          onSlash={onSlash}
        />
        <div className="home-status-row">
          <span>{runtimeMode === 'mock' ? 'demo runtime' : 'real session'}</span>
          <PtyHealthBadge ptyHealth={ptyHealth} compact />
          <span>{model || 'default model'}</span>
          <span>{statusLine || 'idle'}</span>
          <GitEnvironmentBadge status={gitStatus} loading={gitStatusLoading} compact />
        </div>
      </div>
    </section>
  )
}

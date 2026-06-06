import type { JSX } from 'react'
import { GitBranch, HardDrive, Keyboard, PanelBottom, PanelRightOpen, X } from 'lucide-react'
import type { SessionExitPayload } from '../../../shared/types'
import type { GitEnvironmentStatus } from '../../../core/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { RightInspector, SessionTab } from '../appTypes'
import { ComposerBar } from '../components/ComposerBar'
import { GitEnvironmentBadge } from '../components/GitEnvironmentBadge'
import { PtyHealthBadge } from '../components/PtyHealthBadge'
import { StatusPill } from '../components/StatusPill'
import { TabBar } from '../components/TabBar'
import { TerminalPane } from '../components/TerminalPane'
import { sessionReadinessDisplay } from '../services/sessionReadiness'
import { sessionModelLabel } from '../services/sessionModelIdentity'

export function SessionWorkspace({
  transport,
  tabs,
  activeTabId,
  activeTab,
  projectLabel,
  rightInspector,
  bottomTerminalOpen,
  shellSessionId,
  terminalInputEnabled,
  ptyHealth,
  statusLine,
  composerPrompt,
  showPlanSuggestion,
  permissionLabel,
  riskyPermission,
  permissionTone,
  gitStatus,
  gitStatusLoading,
  onSelectTab,
  onKillTab,
  onExit,
  onExpandRequest,
  onOpenIde,
  onOpenEnvironment,
  onToggleTerminal,
  onToggleInspector,
  onCloseShellTerminal,
  onShellExit,
  onStopSession,
  onToggleTerminalInput,
  onTerminalInputRequest,
  onTerminalInputCommit,
  setComposerPrompt,
  onSubmitComposer,
  onFocusComposer,
  onUsePlanMode,
  onProject,
  onPermission,
  onModel,
  onSlash
}: {
  transport: TransportAPI
  tabs: SessionTab[]
  activeTabId?: string
  activeTab?: SessionTab
  projectLabel: string
  rightInspector: RightInspector
  bottomTerminalOpen: boolean
  shellSessionId?: string
  terminalInputEnabled: boolean
  ptyHealth: PtyDoctorResult | null
  statusLine: string
  composerPrompt: string
  showPlanSuggestion: boolean
  permissionLabel: string
  riskyPermission: boolean
  permissionTone: 'default' | 'warn' | 'purple'
  gitStatus: GitEnvironmentStatus | null
  gitStatusLoading: boolean
  onSelectTab: (id: string) => void
  onKillTab: (id: string) => Promise<void>
  onExit: (payload: SessionExitPayload) => void
  onExpandRequest: () => void
  onOpenIde: () => void
  onOpenEnvironment: () => void
  onToggleTerminal: () => void
  onToggleInspector: () => void
  onCloseShellTerminal: () => Promise<void>
  onShellExit: () => void
  onStopSession: () => Promise<void>
  onToggleTerminalInput: () => void
  onTerminalInputRequest: () => void
  onTerminalInputCommit: () => void
  setComposerPrompt: (value: string) => void
  onSubmitComposer: () => Promise<void>
  onFocusComposer: () => void
  onUsePlanMode: () => Promise<void>
  onProject: () => void
  onPermission: () => void
  onModel: () => void
  onSlash: () => void
}): JSX.Element {
  const activeReadiness = activeTab ? sessionReadinessDisplay(activeTab.readiness) : undefined

  return (
    <section className={`session-workspace ${bottomTerminalOpen ? 'session-workspace--bottom-terminal' : ''}`} aria-label="Active session">
      <header className="session-header session-header--compact">
        <div className="session-title-group">
          <div className="session-title">{activeTab?.label || 'Session'}</div>
          <div className="session-context">
            <span>{activeTab?.projectLabel || projectLabel}</span>
            <StatusPill label={sessionModelLabel({ model: activeTab?.model, transcriptModel: activeTab?.resumedSession?.model })} tone="default" />
            <StatusPill label={activeTab?.mock ? 'mock' : 'real cli'} tone={activeTab?.mock ? 'purple' : 'warn'} />
            <PtyHealthBadge ptyHealth={ptyHealth} />
            {activeReadiness && <StatusPill label={activeReadiness.label} tone={activeReadiness.tone} />}
            {activeTab?.readiness.unread && activeReadiness?.label !== 'unread output' && <StatusPill label="unread" tone="purple" />}
            <StatusPill label={permissionLabel} tone={permissionTone} />
            <GitEnvironmentBadge status={gitStatus} loading={gitStatusLoading} />
          </div>
        </div>
        <WorkbenchToolRail
          rightInspector={rightInspector}
          bottomTerminalOpen={bottomTerminalOpen}
          onOpenIde={onOpenIde}
          onOpenEnvironment={onOpenEnvironment}
          onToggleTerminal={onToggleTerminal}
          onToggleInspector={onToggleInspector}
        />
      </header>

      <TabBar tabs={tabs} activeId={activeTabId} onSelect={onSelectTab} onKill={onKillTab} />

      <section className="terminal-card native-terminal-card">
        {tabs.length ? tabs.map((tab) => (
          <div
            key={tab.id}
            className={`terminal-pane-slot ${tab.id === activeTabId ? 'terminal-pane-slot--active' : ''}`}
            aria-hidden={tab.id !== activeTabId}
          >
            <TerminalPane
              transport={transport}
              sessionId={tab.id}
              active={tab.id === activeTabId}
              inputEnabled={tab.id === activeTabId && terminalInputEnabled}
              onInputRequest={tab.id === activeTabId ? onTerminalInputRequest : undefined}
              onInputCommit={tab.id === activeTabId ? onTerminalInputCommit : undefined}
              onExit={onExit}
              onExpandRequest={tab.id === activeTabId ? onExpandRequest : undefined}
            />
          </div>
        )) : (
          <TerminalPane transport={transport} inputEnabled={false} />
        )}
      </section>

      {bottomTerminalOpen && shellSessionId && (
        <section className="bottom-terminal-panel" aria-label="Bottom terminal">
          <header className="bottom-terminal-header">
            <span>Terminal · {projectLabel}</span>
            <button className="icon-button" onClick={() => void onCloseShellTerminal()} title="Close bottom terminal"><X size={15} /></button>
          </header>
          <TerminalPane
            transport={transport}
            sessionId={shellSessionId}
            compact
            onExit={onShellExit}
          />
        </section>
      )}

      <div className="session-composer">
        <div className="session-utility-row">
          <button className="ghost-button native-ghost" onClick={() => void onStopSession()}>Stop</button>
          <span>{terminalInputEnabled ? 'Menu input enabled. Use terminal menus, then return to the composer.' : (statusLine || 'Click terminal for menus; use composer for prompts.')}</span>
          <button
            className={`ghost-button native-ghost terminal-input-toggle ${terminalInputEnabled ? 'terminal-input-toggle--active' : ''}`}
            onClick={onToggleTerminalInput}
            title="Temporarily route keyboard input to Command Code terminal menus (Menu input)"
          >
            <Keyboard size={14} />
            Menu input
          </button>
        </div>
        <ComposerBar
          active
          prompt={composerPrompt}
          setPrompt={setComposerPrompt}
          onSubmit={onSubmitComposer}
          onFocus={onFocusComposer}
          showPlanSuggestion={showPlanSuggestion}
          onPlanMode={onUsePlanMode}
          projectLabel={projectLabel}
          modelLabel={sessionModelLabel({ model: activeTab?.model, transcriptModel: activeTab?.resumedSession?.model })}
          permissionLabel={permissionLabel}
          riskyPermission={riskyPermission}
          onProject={onProject}
          onPermission={onPermission}
          onModel={onModel}
          onSlash={onSlash}
        />
      </div>
    </section>
  )
}

function WorkbenchToolRail({
  rightInspector,
  bottomTerminalOpen,
  onOpenIde,
  onOpenEnvironment,
  onToggleTerminal,
  onToggleInspector
}: {
  rightInspector: RightInspector
  bottomTerminalOpen: boolean
  onOpenIde: () => void
  onOpenEnvironment: () => void
  onToggleTerminal: () => void
  onToggleInspector: () => void
}): JSX.Element {
  return (
    <div className="workbench-tool-rail" aria-label="Workbench tools">
      <button className={`icon-button ${rightInspector === 'ide' ? 'icon-button--active' : ''}`} onClick={onOpenIde} title="IDE and Finder">
        <HardDrive size={17} />
      </button>
      <button className={`icon-button ${rightInspector === 'environment' ? 'icon-button--active' : ''}`} onClick={onOpenEnvironment} title="Environment">
        <GitBranch size={17} />
      </button>
      <button className={`icon-button ${bottomTerminalOpen ? 'icon-button--active' : ''}`} onClick={onToggleTerminal} title="Bottom terminal">
        <PanelBottom size={17} />
      </button>
      <button className={`icon-button ${rightInspector !== 'none' ? 'icon-button--active' : ''}`} onClick={onToggleInspector} title="Right sidebar">
        <PanelRightOpen size={17} />
      </button>
    </div>
  )
}

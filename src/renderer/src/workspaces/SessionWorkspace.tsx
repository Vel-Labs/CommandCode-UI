import type { JSX } from 'react'
import { GitBranch, HardDrive, Keyboard, PanelBottom, PanelRightOpen, X } from 'lucide-react'
import type { SessionExitPayload } from '../../../shared/types'
import type { TransportAPI } from '../../../core/transport'
import type { RightInspector, SessionTab } from '../appTypes'
import { ComposerBar } from '../components/ComposerBar'
import { StatusPill } from '../components/StatusPill'
import { TabBar } from '../components/TabBar'
import { TerminalPane } from '../components/TerminalPane'
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
  statusLine,
  composerPrompt,
  showPlanSuggestion,
  permissionLabel,
  riskyPermission,
  permissionTone,
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
  statusLine: string
  composerPrompt: string
  showPlanSuggestion: boolean
  permissionLabel: string
  riskyPermission: boolean
  permissionTone: 'default' | 'warn' | 'purple'
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
  return (
    <section className={`session-workspace ${bottomTerminalOpen ? 'session-workspace--bottom-terminal' : ''}`} aria-label="Active session">
      <header className="session-header session-header--compact">
        <div className="session-title-group">
          <div className="session-title">{activeTab?.label || 'Session'}</div>
          <div className="session-context">
            <span>{activeTab?.projectLabel || projectLabel}</span>
            <StatusPill label={sessionModelLabel({ model: activeTab?.model, transcriptModel: activeTab?.resumedSession?.model })} tone="default" />
            <StatusPill label={activeTab?.mock ? 'mock' : 'real cli'} tone={activeTab?.mock ? 'purple' : 'warn'} />
            {activeTab?.readiness.inputRequired && <StatusPill label="input" tone="warn" />}
            {activeTab?.readiness.responseReady && <StatusPill label="ready" tone="default" />}
            {activeTab?.readiness.unread && <StatusPill label="unread" tone="purple" />}
            <StatusPill label={permissionLabel} tone={permissionTone} />
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
        <TerminalPane
          transport={transport}
          sessionId={activeTabId}
          inputEnabled={terminalInputEnabled}
          onInputRequest={onTerminalInputRequest}
          onInputCommit={onTerminalInputCommit}
          onExit={onExit}
          onExpandRequest={onExpandRequest}
        />
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

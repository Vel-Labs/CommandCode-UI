import type { JSX } from 'react'
import type { AppWorkspaceContentProps } from './AppWorkspaceContentTypes'
import { ErrorBoundary, WorkspaceErrorFallback } from './ErrorBoundary'
import { AppRightInspector } from './AppRightInspector'
import { AppWorkspaceOverlays } from './AppWorkspaceOverlays'
import { HomeWorkspace } from '../workspaces/HomeWorkspace'
import { SessionWorkspace } from '../workspaces/SessionWorkspace'
import { SettingsWorkspace } from '../workspaces/SettingsWorkspace'
import { TranscriptWorkspace } from '../workspaces/TranscriptWorkspace'

export function AppWorkspaceContent({
  workspaceView,
  settingsSection,
  cwd,
  projectLabel,
  commandExecutable,
  setCommandExecutable,
  model,
  setModel,
  transport,
  ptyHealth,
  permissionMode,
  setPermissionMode,
  trust,
  setTrust,
  skipOnboarding,
  setSkipOnboarding,
  headlessJobs,
  clearHeadlessJobs,
  tabs,
  runtimeMode,
  appearanceTheme,
  setAppearanceTheme,
  chatBubbleColors,
  setChatBubbleColors,
  startupProjectBehavior,
  setStartupProjectBehavior,
  updateState,
  updateVersion,
  updateDetails,
  runCheck,
  openConfigureModels,
  openSettingsSection,
  resumeProjectSession,
  composerPrompt,
  setComposerPrompt,
  submitComposer,
  showPlanSuggestion,
  usePlanMode,
  permissionLabel,
  riskyPermission,
  statusLine,
  gitStatus,
  gitStatusLoading,
  openPopover,
  setOpenPopover,
  selectedTranscript,
  resumeFailure,
  workEvents,
  revealTranscriptPath,
  rightInspector,
  setRightInspector,
  viewingFile,
  viewingFileSource,
  setViewingFile,
  setViewingFileSource,
  addWorkEvent,
  displayPath,
  activeTab,
  activeTabId,
  activeTabTranscript,
  killTab,
  clearTabPrompt,
  setActiveTabId,
  onExit,
  stopSession,
  applySessionReadinessEvent,
  terminalInputEnabled,
  setTerminalInputEnabled,
  revealProjectPath,
  startInspectorResize,
  popoverRef,
  recentProjects,
  commandGroups,
  commandPaletteItems,
  chooseProject,
  setCwd,
  setRuntimeMode,
  headlessYolo,
  setHeadlessYolo,
  headlessMaxTurns,
  setHeadlessMaxTurns,
  runCommand,
  releaseNoteVersion,
  dismissReleaseNotes,
  runReleaseNoteCommand
}: AppWorkspaceContentProps): JSX.Element {
  return (
    <>
      {workspaceView === 'settings' ? (
        <ErrorBoundary
          resetKey={`settings:${settingsSection}`}
          fallback={(error, reset) => <WorkspaceErrorFallback title="Settings view crashed" error={error} onRetry={reset} />}
        >
          <SettingsWorkspace
            section={settingsSection}
            cwd={cwd}
            projectLabel={projectLabel}
            commandExecutable={commandExecutable}
            setCommandExecutable={setCommandExecutable}
            model={model}
            setModel={setModel}
            transport={transport}
            ptyHealth={ptyHealth}
            permissionMode={permissionMode}
            setPermissionMode={setPermissionMode}
            trust={trust}
            setTrust={setTrust}
            skipOnboarding={skipOnboarding}
            setSkipOnboarding={setSkipOnboarding}
            headlessJobs={headlessJobs}
            clearHeadlessJobs={clearHeadlessJobs}
            sessionCount={tabs.length}
            runtimeMode={runtimeMode}
            appearanceTheme={appearanceTheme}
            setAppearanceTheme={setAppearanceTheme}
            chatBubbleColors={chatBubbleColors}
            setChatBubbleColors={setChatBubbleColors}
            startupProjectBehavior={startupProjectBehavior || 'restore-last'}
            setStartupProjectBehavior={setStartupProjectBehavior}
            updateState={updateState}
            updateVersion={updateVersion}
            updateDetails={updateDetails}
            runCheck={runCheck}
            openConfigureModels={openConfigureModels}
            openDocs={() => setRightInspector('docs')}
            openSection={openSettingsSection}
            onResumeSession={resumeProjectSession}
          />
        </ErrorBoundary>
      ) : workspaceView === 'home' ? (
        <ErrorBoundary
          resetKey="home"
          fallback={(error, reset) => <WorkspaceErrorFallback title="Home view crashed" error={error} onRetry={reset} />}
        >
          <HomeWorkspace
            prompt={composerPrompt}
            setPrompt={setComposerPrompt}
            onSubmit={submitComposer}
            showPlanSuggestion={showPlanSuggestion}
            onPlanMode={usePlanMode}
            projectLabel={projectLabel}
            model={model}
            permissionLabel={permissionLabel}
            riskyPermission={riskyPermission}
            onProject={() => setOpenPopover(openPopover === 'project' ? null : 'project')}
            onPermission={() => setOpenPopover(openPopover === 'permission' ? null : 'permission')}
            onModel={() => setOpenPopover(openPopover === 'model' ? null : 'model')}
            onSlash={() => setOpenPopover(openPopover === 'slash' ? null : 'slash')}
            runtimeMode={runtimeMode}
            ptyHealth={ptyHealth}
            statusLine={statusLine}
            gitStatus={gitStatus}
            gitStatusLoading={gitStatusLoading}
          />
        </ErrorBoundary>
      ) : workspaceView === 'transcript' && selectedTranscript ? (
        <div className={`workbench-shell ${rightInspector !== 'none' ? 'workbench-shell--with-inspector' : ''}`}>
          <ErrorBoundary
            resetKey={`transcript:${selectedTranscript.id}:${rightInspector}`}
            fallback={(error, reset) => <WorkspaceErrorFallback title="Transcript view crashed" error={error} onRetry={reset} />}
          >
            <TranscriptWorkspace
              session={selectedTranscript}
              transport={transport}
              cwd={cwd}
              statusLine={statusLine}
              resumeFailure={resumeFailure}
              workEvents={workEvents}
              onResume={() => void resumeProjectSession(selectedTranscript)}
              onReveal={() => void revealTranscriptPath(selectedTranscript.transcriptPath)}
              onOpenTranscript={() => setRightInspector('transcript')}
              onOpenArtifact={(path) => {
                setViewingFile(path)
                setViewingFileSource(`Artifact from ${selectedTranscript.title || selectedTranscript.id}`)
                setRightInspector('file')
                addWorkEvent('Opened artifact', displayPath(path))
              }}
            />
          </ErrorBoundary>
          <AppRightInspector
            mode={rightInspector}
            transport={transport}
            cwd={cwd}
            commandExecutable={commandExecutable}
            filePath={viewingFile}
            fileSourceLabel={viewingFileSource}
            transcript={selectedTranscript}
            setRightInspector={(value) => setRightInspector(value)}
            setViewingFile={setViewingFile}
            setViewingFileSource={setViewingFileSource}
            addWorkEvent={addWorkEvent}
            displayPath={displayPath}
            revealTranscriptPath={revealTranscriptPath}
            revealProjectPath={revealProjectPath}
            startInspectorResize={startInspectorResize}
          />
        </div>
      ) : (
        <div className={`workbench-shell ${rightInspector !== 'none' ? 'workbench-shell--with-inspector' : ''}`}>
          <ErrorBoundary
            resetKey={`session:${activeTabId || 'none'}:${rightInspector}`}
            fallback={(error, reset) => (
              <WorkspaceErrorFallback
                title="Session view crashed"
                error={error}
                onRetry={reset}
                actions={activeTabId ? (
                  <>
                    <button className="ghost-button native-ghost" onClick={() => void stopSession()}>Stop</button>
                    <button className="ghost-button native-ghost" onClick={() => void killTab(activeTabId)}>Force Stop</button>
                  </>
                ) : undefined}
              />
            )}
          >
            <SessionWorkspace
              transport={transport}
              tabs={tabs}
              activeTabId={activeTabId}
              activeTab={activeTab}
              projectLabel={projectLabel}
              cwd={cwd}
              ptyHealth={ptyHealth}
              statusLine={statusLine}
              composerPrompt={composerPrompt}
              showPlanSuggestion={showPlanSuggestion}
              permissionLabel={permissionLabel}
              riskyPermission={riskyPermission}
              permissionTone={riskyPermission ? 'warn' : permissionMode === 'plan' ? 'purple' : 'default'}
              gitStatus={gitStatus}
              gitStatusLoading={gitStatusLoading}
              onKillTab={killTab}
              onSelectTab={(id) => setActiveTabId(id)}
              onExit={onExit}
              onStopSession={stopSession}
              setComposerPrompt={setComposerPrompt}
              onSubmitComposer={submitComposer}
              onFocusComposer={() => setTerminalInputEnabled(false)}
              onUsePlanMode={usePlanMode}
              onProject={() => setOpenPopover(openPopover === 'project' ? null : 'project')}
              onPermission={() => setOpenPopover(openPopover === 'permission' ? null : 'permission')}
              onModel={() => setOpenPopover(openPopover === 'model' ? null : 'model')}
              onSlash={() => setOpenPopover(openPopover === 'slash' ? null : 'slash')}
              onOpenArtifact={(path) => {
                setViewingFile(path)
                setViewingFileSource(`Referenced by ${activeTab?.label || 'active session'}`)
                setRightInspector('file')
                addWorkEvent('Opened referenced file', displayPath(path))
              }}
              onOpenThinking={() => {
                if (!activeTab) return
                setViewingFile(undefined)
                setRightInspector((current) => current === 'transcript' ? 'none' : 'transcript')
                addWorkEvent('Toggled thinking details', 'Ctrl/Cmd+O or Ctrl/Cmd+0 toggled the active transcript inspector.')
              }}
              onRevealTranscript={() => activeTab?.transcriptPath && void revealTranscriptPath(activeTab.transcriptPath)}
              onInputRequired={() => activeTabId && applySessionReadinessEvent(activeTabId, { type: 'input-required' })}
              onConversationReadiness={(sessionId, state) => {
                if (state === 'thinking') {
                  applySessionReadinessEvent(sessionId, { type: 'user-submit' })
                  return
                }
                if (state === 'input') {
                  applySessionReadinessEvent(sessionId, { type: 'input-required' })
                  return
                }
                applySessionReadinessEvent(sessionId, { type: 'ready' })
                clearTabPrompt(sessionId)
              }}
              terminalInputEnabled={terminalInputEnabled}
              onTerminalInputRequest={() => setTerminalInputEnabled(true)}
              onTerminalInputCommit={() => {
                if (activeTabId) applySessionReadinessEvent(activeTabId, { type: 'user-submit' })
                setTerminalInputEnabled(false)
              }}
            />
          </ErrorBoundary>
          <AppRightInspector
            mode={rightInspector}
            transport={transport}
            cwd={cwd}
            commandExecutable={commandExecutable}
            filePath={viewingFile}
            fileSourceLabel={viewingFileSource}
            transcript={activeTabTranscript}
            setRightInspector={(value) => setRightInspector(value)}
            setViewingFile={setViewingFile}
            setViewingFileSource={setViewingFileSource}
            addWorkEvent={addWorkEvent}
            displayPath={displayPath}
            revealTranscriptPath={revealTranscriptPath}
            revealProjectPath={revealProjectPath}
            startInspectorResize={startInspectorResize}
            liveTranscript={Boolean(activeTab)}
          />
        </div>
      )}

      <AppWorkspaceOverlays
        popoverRef={popoverRef}
        openPopover={openPopover}
        recentProjects={recentProjects}
        runtimeMode={runtimeMode}
        ptyHealth={ptyHealth}
        commandExecutable={commandExecutable}
        cwd={cwd}
        transport={transport}
        skipOnboarding={skipOnboarding}
        headlessYolo={headlessYolo}
        headlessMaxTurns={headlessMaxTurns}
        model={model}
        permissionMode={permissionMode}
        trust={trust}
        headlessJobs={headlessJobs}
        commandGroups={commandGroups}
        commandPaletteItems={commandPaletteItems}
        openSettingsSection={openSettingsSection}
        chooseProject={chooseProject}
        setCwd={setCwd}
        setOpenPopover={setOpenPopover}
        setRuntimeMode={setRuntimeMode}
        setCommandExecutable={setCommandExecutable}
        runCheck={runCheck}
        setRightInspector={setRightInspector}
        setSkipOnboarding={setSkipOnboarding}
        setHeadlessYolo={setHeadlessYolo}
        setHeadlessMaxTurns={setHeadlessMaxTurns}
        setModel={setModel}
        openConfigureModels={openConfigureModels}
        setPermissionMode={setPermissionMode}
        setTrust={setTrust}
        clearHeadlessJobs={clearHeadlessJobs}
        runCommand={runCommand}
        releaseNoteVersion={releaseNoteVersion}
        updateDetails={updateDetails}
        dismissReleaseNotes={dismissReleaseNotes}
        runReleaseNoteCommand={runReleaseNoteCommand}
      />
    </>
  )
}

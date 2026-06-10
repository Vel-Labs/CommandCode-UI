import type { Dispatch, JSX, PointerEvent, SetStateAction } from 'react'
import type { DiscoveredSession } from '../../../core/types'
import { ShellLayout } from '../layout/ShellLayout'
import { commandGroups, commandPaletteItems } from '../commandPalette'
import type { PopoverKey, SettingsSection, SidebarSection } from '../appTypes'
import { updateLabel } from '../services/appStorage'
import { AppWorkspaceContent } from './AppWorkspaceContent'
import type { AppWorkspaceContentProps } from './AppWorkspaceContentTypes'

type AppChromeProps = Omit<AppWorkspaceContentProps, 'commandGroups' | 'commandPaletteItems' | 'openSettingsSection'> & {
  railCollapsed: boolean
  setRailCollapsed: Dispatch<SetStateAction<boolean>>
  sidebarWidth: number
  rightInspectorWidth: number
  settingsOpen: boolean
  setSettingsOpen: (value: boolean) => void
  collapsedSidebarSections: Record<SidebarSection, boolean>
  projectSessions: DiscoveredSession[]
  visibleRecentChats: DiscoveredSession[]
  showAllRecentChats: boolean
  setShowAllRecentChats: Dispatch<SetStateAction<boolean>>
  startSidebarResize: (event: PointerEvent<HTMLDivElement>) => void
  openTranscriptSession: (session: DiscoveredSession) => void
  setSelectedTranscript: (value: DiscoveredSession | undefined) => void
  setSettingsSection: (value: SettingsSection) => void
  toggleSidebarSection: (section: SidebarSection) => void
  checkForUpdates: () => Promise<void>
  runUpdate: () => Promise<void>
}

export function AppChrome({
  appearanceTheme,
  chatBubbleColors,
  railCollapsed,
  setRailCollapsed,
  sidebarWidth,
  rightInspectorWidth,
  settingsOpen,
  setSettingsOpen,
  settingsSection,
  setSettingsSection,
  collapsedSidebarSections,
  projectLabel,
  cwd,
  setCwd,
  recentProjects,
  projectSessions,
  visibleRecentChats,
  tabs,
  activeTabId,
  setActiveTabId,
  showAllRecentChats,
  setShowAllRecentChats,
  openPopover,
  setOpenPopover,
  updateState,
  updateVersion,
  updateDetails,
  startSidebarResize,
  toggleSidebarSection,
  openTranscriptSession,
  setSelectedTranscript,
  rightInspector,
  setRightInspector,
  checkForUpdates,
  runUpdate,
  ...workspaceProps
}: AppChromeProps): JSX.Element {
  const openSettingsSection = (section: SettingsSection): void => {
    setRailCollapsed(false)
    setOpenPopover(null)
    setSettingsOpen(true)
    setSettingsSection(section)
  }

  const openNewSessionHome = (): void => {
    setSettingsOpen(false)
    setOpenPopover(null)
    setActiveTabId(undefined)
    setSelectedTranscript(undefined)
    setRightInspector('none')
  }

  const togglePopover = (popover: NonNullable<PopoverKey>): void => {
    setSettingsOpen(false)
    setOpenPopover(openPopover === popover ? null : popover)
  }

  return (
    <ShellLayout
      appearanceTheme={appearanceTheme}
      chatBubbleColors={chatBubbleColors}
      railCollapsed={railCollapsed}
      sidebarWidth={sidebarWidth}
      rightInspectorWidth={rightInspectorWidth}
      settingsOpen={settingsOpen}
      settingsSection={settingsSection}
      collapsedSidebarSections={collapsedSidebarSections}
      projectLabel={projectLabel}
      cwd={cwd}
      recentProjects={recentProjects}
      projectSessions={projectSessions}
      visibleRecentChats={visibleRecentChats}
      tabs={tabs}
      activeTabId={activeTabId}
      showAllRecentChats={showAllRecentChats}
      openPopover={openPopover}
      updateState={updateState}
      updateVersion={updateVersion}
      updateDetails={updateDetails}
      onSidebarResizeStart={startSidebarResize}
      onToggleRailCollapsed={() => setRailCollapsed((value) => !value)}
      onBackFromSettings={() => setSettingsOpen(false)}
      onSettingsSectionChange={setSettingsSection}
      onNewSession={openNewSessionHome}
      onSearch={() => setOpenPopover(null)}
      onToggleProjectPopover={() => togglePopover('project')}
      onToggleRuntimePopover={() => togglePopover('runtime')}
      onToggleSidebarSection={toggleSidebarSection}
      onOpenProjectPopover={() => {
        setSettingsOpen(false)
        setOpenPopover('project')
      }}
      onSelectRecentProject={(project) => {
        setSettingsOpen(false)
        setCwd(project)
      }}
      onOpenTranscriptSession={openTranscriptSession}
      onToggleRecentChats={() => setShowAllRecentChats((value) => !value)}
      onSelectActiveTab={(id) => {
        setSettingsOpen(false)
        setActiveTabId(id)
      }}
      onOpenSettings={() => openSettingsSection('profile')}
      onUpdateClick={() => {
        setOpenPopover(null)
        updateState === 'available' ? void runUpdate() : void checkForUpdates()
      }}
      updateLabel={updateLabel}
    >
      <AppWorkspaceContent
        {...workspaceProps}
        appearanceTheme={appearanceTheme}
        chatBubbleColors={chatBubbleColors}
        settingsSection={settingsSection}
        openSettingsSection={openSettingsSection}
        cwd={cwd}
        setCwd={setCwd}
        projectLabel={projectLabel}
        tabs={tabs}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
        recentProjects={recentProjects}
        openPopover={openPopover}
        setOpenPopover={setOpenPopover}
        updateState={updateState}
        updateVersion={updateVersion}
        updateDetails={updateDetails}
        rightInspector={rightInspector}
        setRightInspector={setRightInspector}
        commandGroups={commandGroups}
        commandPaletteItems={commandPaletteItems}
      />
    </ShellLayout>
  )
}

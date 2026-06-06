import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { JSX, ReactNode } from 'react'
import {
  Activity,
  ChevronDown,
  CreditCard,
  Download,
  Folder,
  FolderOpen,
  Gauge,
  HardDrive,
  Keyboard,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  RefreshCw,
  Search,
  Settings,
  SquarePen,
  Terminal,
  UserCircle,
  Wrench
} from 'lucide-react'
import { ToastContainer } from '../components/ToastSystem'
import type {
  AppearanceTheme,
  PopoverKey,
  SessionTab,
  SettingsSection,
  SidebarSection,
  UpdateState
} from '../appTypes'
import type { DiscoveredSession } from '../../../core/types'

type SettingsNavGroup = {
  label: string
  items: Array<{ id: SettingsSection; label: string; icon: JSX.Element }>
}

const settingsGroups: SettingsNavGroup[] = [
  {
    label: 'Personal',
    items: [
      { id: 'profile', label: 'Profile', icon: <UserCircle size={17} /> },
      { id: 'general', label: 'General', icon: <Settings size={17} /> },
      { id: 'appearance', label: 'Appearance', icon: <Palette size={17} /> },
      { id: 'runtime', label: 'Runtime', icon: <Wrench size={17} /> },
      { id: 'usage', label: 'Usage', icon: <CreditCard size={17} /> }
    ]
  },
  {
    label: 'Integrations',
    items: [
      { id: 'integrations', label: 'Integrations', icon: <Plug size={17} /> },
      { id: 'advanced', label: 'Advanced', icon: <HardDrive size={17} /> }
    ]
  }
]

export function ShellLayout({
  appearanceTheme,
  railCollapsed,
  sidebarWidth,
  rightInspectorWidth,
  settingsOpen,
  settingsSection,
  collapsedSidebarSections,
  projectLabel,
  cwd,
  recentProjects,
  projectSessions,
  visibleRecentChats,
  tabs,
  activeTabId,
  showAllRecentChats,
  openPopover,
  updateState,
  updateVersion,
  updateDetails,
  children,
  onSidebarResizeStart,
  onToggleRailCollapsed,
  onBackFromSettings,
  onSettingsSectionChange,
  onNewSession,
  onSearch,
  onToggleProjectPopover,
  onToggleRuntimePopover,
  onToggleSidebarSection,
  onOpenProjectPopover,
  onSelectRecentProject,
  onOpenTranscriptSession,
  onToggleRecentChats,
  onSelectActiveTab,
  onOpenSettings,
  onUpdateClick,
  updateLabel
}: {
  appearanceTheme: AppearanceTheme
  railCollapsed: boolean
  sidebarWidth: number
  rightInspectorWidth: number
  settingsOpen: boolean
  settingsSection: SettingsSection
  collapsedSidebarSections: Record<SidebarSection, boolean>
  projectLabel: string
  cwd: string
  recentProjects: string[]
  projectSessions: DiscoveredSession[]
  visibleRecentChats: DiscoveredSession[]
  tabs: SessionTab[]
  activeTabId?: string
  showAllRecentChats: boolean
  openPopover: PopoverKey
  updateState: UpdateState
  updateVersion?: string
  updateDetails: string
  children: ReactNode
  onSidebarResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void
  onToggleRailCollapsed: () => void
  onBackFromSettings: () => void
  onSettingsSectionChange: (section: SettingsSection) => void
  onNewSession: () => void
  onSearch: () => void
  onToggleProjectPopover: () => void
  onToggleRuntimePopover: () => void
  onToggleSidebarSection: (section: SidebarSection) => void
  onOpenProjectPopover: () => void
  onSelectRecentProject: (project: string) => void
  onOpenTranscriptSession: (session: DiscoveredSession) => void
  onToggleRecentChats: () => void
  onSelectActiveTab: (id: string) => void
  onOpenSettings: () => void
  onUpdateClick: () => void
  updateLabel: (state: UpdateState, version?: string) => string
}): JSX.Element {
  const shellStyle = {
    '--sidebar-width': `${sidebarWidth}px`,
    '--right-inspector-width': `${rightInspectorWidth}px`
  } as CSSProperties

  return (
    <main className={`app-shell native-shell theme-${appearanceTheme} ${railCollapsed ? 'native-shell--collapsed' : ''}`} style={shellStyle}>
      <ToastContainer />

      <aside className={`sidebar-shell ${railCollapsed ? 'sidebar-shell--collapsed' : ''}`}>
        <div className="sidebar-resize-handle" onPointerDown={onSidebarResizeStart} title="Resize sidebar" />
        <div className="sidebar-top">
          <button
            className="icon-button sidebar-collapse"
            onClick={onToggleRailCollapsed}
            title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {railCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          {!railCollapsed && <div className="sidebar-app-title">Command Code</div>}
        </div>

        {settingsOpen ? (
          !railCollapsed && (
            <div className="sidebar-settings-mode">
              <button className="settings-back sidebar-settings-back" onClick={onBackFromSettings}>
                Back to app
              </button>
              <div className="settings-search">Search settings...</div>
              {settingsGroups.map((group) => (
                <div key={group.label} className="settings-nav-group">
                  <div className="settings-nav-heading">{group.label}</div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      className={`settings-nav-row ${settingsSection === item.id ? 'settings-nav-row--active' : ''}`}
                      onClick={() => onSettingsSectionChange(item.id)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            <nav className="sidebar-nav" aria-label="Primary">
              <button className="sidebar-row" onClick={onNewSession} title="New session">
                <SquarePen size={18} />
                {!railCollapsed && <span>New session</span>}
              </button>
              <button className="sidebar-row" onClick={onSearch} title="Search">
                <Search size={18} />
                {!railCollapsed && <span>Search</span>}
              </button>
              <button className="sidebar-row" onClick={onToggleProjectPopover} title="Projects">
                <Folder size={18} />
                {!railCollapsed && <span>Projects</span>}
              </button>
              <button className="sidebar-row" onClick={onToggleRuntimePopover} title="Runtime">
                <Gauge size={18} />
                {!railCollapsed && <span>Runtime</span>}
              </button>
            </nav>

            {!railCollapsed && (
              <div className="sidebar-projects">
                <button
                  className="sidebar-heading-button"
                  onClick={() => onToggleSidebarSection('projects')}
                  aria-expanded={!collapsedSidebarSections.projects}
                >
                  <ChevronDown size={14} />
                  <span>Projects</span>
                </button>
                {!collapsedSidebarSections.projects && (
                  <div className="sidebar-section-body">
                    <button className={`project-row ${cwd ? 'project-row--active' : ''}`} onClick={onOpenProjectPopover} title={cwd || 'Choose a project'}>
                      <FolderOpen size={16} />
                      <span>{projectLabel}</span>
                    </button>
                    {recentProjects.filter((project) => project !== cwd).slice(0, 4).map((project) => (
                      <button key={project} className="project-row" onClick={() => onSelectRecentProject(project)} title={project}>
                        <Folder size={16} />
                        <span>{displayPath(project)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {projectSessions.length > 0 && (
                  <div className="sidebar-section">
                    <button
                      className="sidebar-heading-button"
                      onClick={() => onToggleSidebarSection('recentChats')}
                      aria-expanded={!collapsedSidebarSections.recentChats}
                    >
                      <ChevronDown size={14} />
                      <span>Recent chats</span>
                    </button>
                    {!collapsedSidebarSections.recentChats && (
                      <div className="sidebar-section-body">
                        {visibleRecentChats.map((session) => (
                          <button
                            key={session.id}
                            className="project-row"
                            onClick={() => onOpenTranscriptSession(session)}
                            title={`Open ${session.title || session.id}`}
                          >
                            <Terminal size={16} />
                            <span>{session.title || session.id}</span>
                          </button>
                        ))}
                        {projectSessions.length > 4 && (
                          <button className="show-more-row" onClick={onToggleRecentChats}>
                            {showAllRecentChats ? 'Show less' : `Show ${projectSessions.length - 4} more`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {tabs.length > 0 && (
                  <div className="sidebar-section">
                    <button
                      className="sidebar-heading-button"
                      onClick={() => onToggleSidebarSection('activeSessions')}
                      aria-expanded={!collapsedSidebarSections.activeSessions}
                    >
                      <ChevronDown size={14} />
                      <span>Active sessions</span>
                    </button>
                    {!collapsedSidebarSections.activeSessions && (
                      <div className="sidebar-section-body">
                        {tabs.slice(-6).reverse().map((tab) => (
                          <button key={tab.id} className={`project-row ${tab.id === activeTabId ? 'project-row--active' : ''}`} onClick={() => onSelectActiveTab(tab.id)} title={tab.transcriptPath}>
                            <Terminal size={16} />
                            <span>{tab.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="sidebar-bottom">
          <div className="sidebar-footer-row">
            <button
              className={`sidebar-row settings-footer-button ${settingsOpen ? 'sidebar-row--active' : ''}`}
              onClick={onOpenSettings}
              title="Settings"
            >
              <Settings size={18} />
              {!railCollapsed && <span>Settings</span>}
            </button>
            <button
              className={`sidebar-row update-row update-row--${updateState}`}
              onClick={onUpdateClick}
              title={updateDetails || updateLabel(updateState, updateVersion)}
              aria-label={updateLabel(updateState, updateVersion)}
              disabled={updateState === 'checking' || updateState === 'updating'}
            >
              {updateState === 'checking' || updateState === 'updating' ? <RefreshCw size={18} /> : <Download size={18} />}
              {!railCollapsed && <span>{updateLabel(updateState, updateVersion)}</span>}
            </button>
          </div>
        </div>
      </aside>

      <section className="native-main">
        {children}
      </section>
    </main>
  )
}

function displayPath(input: string): string {
  if (!input.trim()) return 'No project selected'
  const parts = input.split('/').filter(Boolean)
  return parts.at(-1) || input
}

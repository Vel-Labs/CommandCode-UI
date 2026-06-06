import { useMemo, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { JSX, ReactNode } from 'react'
import {
  ChevronDown,
  Download,
  Folder,
  FolderOpen,
  Gauge,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings,
  SquarePen,
  Terminal
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
import { sessionReadinessDisplay } from '../services/sessionReadiness'
import { groupedSettings } from '../settings/settingsRegistry'

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
  const [settingsQuery, setSettingsQuery] = useState('')
  const [recentContextQuery, setRecentContextQuery] = useState('')
  const settingsGroups = useMemo(() => groupedSettings(settingsQuery), [settingsQuery])
  const filteredRecentContexts = useMemo(() => {
    const query = recentContextQuery.trim().toLowerCase()
    if (!query) return projectSessions
    return projectSessions.filter((session) => [
      session.title,
      session.id,
      session.transcriptPath,
      session.cwd,
      session.model,
      session.source
    ].some((value) => value?.toLowerCase().includes(query)))
  }, [projectSessions, recentContextQuery])
  const visibleRecentContexts = showAllRecentChats ? filteredRecentContexts : filteredRecentContexts.slice(0, 4)
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
              <input
                className="settings-search"
                value={settingsQuery}
                onChange={(event) => setSettingsQuery(event.target.value)}
                placeholder="Search settings..."
                aria-label="Search settings"
              />
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
              {settingsGroups.length === 0 && <div className="settings-empty-state">No settings match.</div>}
            </div>
          )
        ) : (
          <>
            <nav className="sidebar-nav" aria-label="Primary">
              <button className="sidebar-row" onClick={onNewSession} title="New session (Cmd/Ctrl+T)">
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
                      <span>Recent contexts</span>
                    </button>
                    {!collapsedSidebarSections.recentChats && (
                      <div className="sidebar-section-body">
                        <input
                          className="sidebar-context-search"
                          value={recentContextQuery}
                          onChange={(event) => setRecentContextQuery(event.target.value)}
                          placeholder="Search contexts..."
                          aria-label="Search recent contexts"
                        />
                        {visibleRecentContexts.map((session) => (
                          <button
                            key={session.id}
                            className="project-row"
                            onClick={() => onOpenTranscriptSession(session)}
                            title={`Open ${session.title || session.id}`}
                          >
                            <Terminal size={16} />
                            <span className="sidebar-row-copy">
                              <span className="sidebar-row-main">{session.title || session.id}</span>
                              <span className="sidebar-row-meta">{session.source || 'project'} · {formatSessionTimestamp(session.timestamp)}</span>
                            </span>
                          </button>
                        ))}
                        {!visibleRecentContexts.length && (
                          <div className="sidebar-empty-state">No contexts match.</div>
                        )}
                        {filteredRecentContexts.length > 4 && (
                          <button className="show-more-row" onClick={onToggleRecentChats}>
                            {showAllRecentChats ? 'Show less' : `Show ${filteredRecentContexts.length - 4} more`}
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
                      <span>Live sessions</span>
                    </button>
                    {!collapsedSidebarSections.activeSessions && (
                      <div className="sidebar-section-body">
                        {tabs.slice(-6).reverse().map((tab) => {
                          const readiness = sessionReadinessDisplay(tab.readiness)
                          return (
                            <button key={tab.id} className={`project-row ${tab.id === activeTabId ? 'project-row--active' : ''}`} onClick={() => onSelectActiveTab(tab.id)} title={`${readiness.title} - ${tab.transcriptPath}`}>
                              <Terminal size={16} />
                              <span className="sidebar-row-copy">
                                <span className="sidebar-row-main">{tab.label}</span>
                                <span className="sidebar-row-meta">{readiness.label} · {tab.runtimeMode === 'mock' ? 'demo' : 'real'}</span>
                              </span>
                              {tab.readiness.unread && <span className="sidebar-readiness-dot" title="Unread session output" />}
                            </button>
                          )
                        })}
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

function formatSessionTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'unknown time'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function displayPath(input: string): string {
  if (!input.trim()) return 'No project selected'
  const parts = input.split('/').filter(Boolean)
  return parts.at(-1) || input
}

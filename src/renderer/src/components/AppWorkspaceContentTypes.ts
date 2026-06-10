import type { PointerEvent, RefObject } from 'react'
import type { PermissionMode, SessionExitPayload } from '../../../shared/types'
import type { DiscoveredSession, GitEnvironmentStatus } from '../../../core/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { SessionReadinessEvent } from '../services/sessionReadiness'
import type {
  AppearanceTheme,
  ChatBubbleColors,
  CommandPaletteItem,
  PopoverKey,
  RightInspector,
  RuntimeMode,
  SessionTab,
  SettingsSection,
  UpdateState,
  WorkEvent,
  WorkspaceView
} from '../appTypes'
import type { HeadlessJob } from './HeadlessHistory'

export type AppWorkspaceContentProps = {
  workspaceView: WorkspaceView
  settingsSection: SettingsSection
  cwd: string
  projectLabel: string
  commandExecutable: string
  setCommandExecutable: (value: string) => void
  model: string
  setModel: (value: string) => void
  transport: TransportAPI
  ptyHealth: PtyDoctorResult | null
  permissionMode: PermissionMode
  setPermissionMode: (value: PermissionMode) => void
  trust: boolean
  setTrust: (value: boolean) => void
  skipOnboarding: boolean
  setSkipOnboarding: (value: boolean) => void
  headlessJobs: HeadlessJob[]
  clearHeadlessJobs: () => void
  tabs: SessionTab[]
  runtimeMode: RuntimeMode
  appearanceTheme: AppearanceTheme
  setAppearanceTheme: (value: AppearanceTheme) => void
  chatBubbleColors: ChatBubbleColors
  setChatBubbleColors: (value: ChatBubbleColors) => void
  startupProjectBehavior: 'restore-last' | 'empty' | undefined
  setStartupProjectBehavior: (value: 'restore-last' | 'empty') => void
  updateState: UpdateState
  updateVersion?: string
  updateDetails: string
  runCheck: () => Promise<void>
  openConfigureModels: () => Promise<void>
  openSettingsSection: (section: SettingsSection) => void
  resumeProjectSession: (session: DiscoveredSession) => Promise<void>
  composerPrompt: string
  setComposerPrompt: (value: string | ((current: string) => string)) => void
  submitComposer: () => Promise<void>
  showPlanSuggestion: boolean
  usePlanMode: () => Promise<void>
  permissionLabel: string
  riskyPermission: boolean
  statusLine: string
  gitStatus: GitEnvironmentStatus | null
  gitStatusLoading: boolean
  openPopover: PopoverKey
  setOpenPopover: (value: PopoverKey) => void
  selectedTranscript?: DiscoveredSession
  resumeFailure: string
  workEvents: WorkEvent[]
  revealTranscriptPath: (transcriptPath: string) => Promise<void>
  rightInspector: RightInspector
  setRightInspector: (value: RightInspector | ((current: RightInspector) => RightInspector)) => void
  viewingFile?: string
  viewingFileSource?: string
  setViewingFile: (value: string | undefined) => void
  setViewingFileSource: (value: string | undefined) => void
  addWorkEvent: (label: string, detail: string, tone?: WorkEvent['tone']) => void
  displayPath: (value: string) => string
  activeTab?: SessionTab
  activeTabId?: string
  activeTabTranscript?: DiscoveredSession
  killTab: (id: string) => Promise<void>
  clearTabPrompt: (id: string) => void
  setActiveTabId: (value: string | undefined) => void
  onExit: (payload: SessionExitPayload) => void
  stopSession: () => Promise<void>
  applySessionReadinessEvent: (sessionId: string, event: SessionReadinessEvent) => void
  terminalInputEnabled: boolean
  setTerminalInputEnabled: (value: boolean) => void
  revealProjectPath: () => Promise<void>
  startInspectorResize: (event: PointerEvent<HTMLDivElement>) => void
  popoverRef: RefObject<HTMLDivElement | null>
  recentProjects: string[]
  commandGroups: CommandPaletteItem['group'][]
  commandPaletteItems: CommandPaletteItem[]
  chooseProject: () => Promise<void>
  setCwd: (value: string) => void
  setRuntimeMode: (mode: RuntimeMode) => void
  headlessYolo: boolean
  setHeadlessYolo: (value: boolean) => void
  headlessMaxTurns: number
  setHeadlessMaxTurns: (value: number) => void
  runCommand: (item: CommandPaletteItem) => Promise<void>
  releaseNoteVersion?: string
  dismissReleaseNotes: () => void
  runReleaseNoteCommand: (command: string) => Promise<void>
}

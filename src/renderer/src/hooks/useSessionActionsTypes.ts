import type { Dispatch, SetStateAction } from 'react'
import type { PermissionMode } from '../../../shared/types'
import type { DiscoveredSession } from '../../../core/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type {
  PopoverKey,
  RightInspector,
  RuntimeMode,
  SessionTab,
  WorkEvent
} from '../appTypes'
import type { SessionReadinessEvent, SessionReadinessState } from '../services/sessionReadiness'

export type UseSessionActionsOptions = {
  transport: TransportAPI
  cwd: string
  useMock: boolean
  runtimeMode: RuntimeMode
  setRuntimeModeState: Dispatch<SetStateAction<RuntimeMode>>
  realSessionDisabled: boolean
  ptyHealth: PtyDoctorResult | null
  commandExecutable: string
  model: string
  permissionMode: PermissionMode
  trust: boolean
  skipOnboarding: boolean
  projectLabel: string
  tabs: SessionTab[]
  setTabs: Dispatch<SetStateAction<SessionTab[]>>
  activeTabId?: string
  activeTab?: SessionTab
  composerPrompt: string
  setComposerPrompt: Dispatch<SetStateAction<string>>
  setActiveTabId: Dispatch<SetStateAction<string | undefined>>
  setSelectedTranscript: Dispatch<SetStateAction<DiscoveredSession | undefined>>
  setResumeFailure: Dispatch<SetStateAction<string>>
  setRightInspector: Dispatch<SetStateAction<RightInspector>>
  setOpenPopover: Dispatch<SetStateAction<PopoverKey>>
  setTerminalInputEnabled: Dispatch<SetStateAction<boolean>>
  setSettingsOpen: Dispatch<SetStateAction<boolean>>
  setStatusLine: Dispatch<SetStateAction<string>>
  releaseNoteVersion?: string
  setReleaseNoteVersion: Dispatch<SetStateAction<string | undefined>>
  saveCurrentAppPreferences: () => void
  addWorkEvent: (label: string, detail: string, tone?: WorkEvent['tone']) => void
  createAttachedReadiness: (sessionId: string) => SessionReadinessState
  backgroundExistingTabs: (items: SessionTab[]) => SessionTab[]
  applySessionReadinessEvent: (sessionId: string, event: SessionReadinessEvent) => void
  runHeadless: (prompt: string, maxTurns: number, yolo: boolean, plan?: boolean) => Promise<void>
  headlessMaxTurns: number
  headlessYolo: boolean
}

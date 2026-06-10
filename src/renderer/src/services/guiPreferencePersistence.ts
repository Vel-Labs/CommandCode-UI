import type { AppGuiPreferences } from '../../../core/types'
import type { AppearanceTheme, ChatBubbleColors } from '../appTypes'
import {
  APPEARANCE_KEY,
  CHAT_ASSISTANT_COLOR_KEY,
  CHAT_USER_COLOR_KEY,
  defaultChatBubbleColors,
  loadProjectModels,
  loadSeenReleaseNotes,
  normalizeHexColor
} from './appStorage'

type StateSetter<T> = (value: T) => void
type FunctionalStateSetter<T> = (value: T | ((current: T) => T)) => void

export function applyAppearancePreference(
  prefs: Pick<AppGuiPreferences, 'appearanceTheme' | 'chatBubbleUserColor' | 'chatBubbleAssistantColor'>,
  setAppearanceThemeState: StateSetter<AppearanceTheme>,
  setChatBubbleColorsState: FunctionalStateSetter<ChatBubbleColors>
): void {
  if (prefs.appearanceTheme === 'cc-spectrum' || prefs.appearanceTheme === 'terminal-minimal' || prefs.appearanceTheme === 'blueprint' || prefs.appearanceTheme === 'high-contrast') {
    setAppearanceThemeState(prefs.appearanceTheme)
    localStorage.setItem(APPEARANCE_KEY, prefs.appearanceTheme)
    if (!normalizeHexColor(prefs.chatBubbleUserColor) && !normalizeHexColor(prefs.chatBubbleAssistantColor) && !localStorage.getItem(CHAT_USER_COLOR_KEY) && !localStorage.getItem(CHAT_ASSISTANT_COLOR_KEY)) {
      setChatBubbleColorsState(defaultChatBubbleColors(prefs.appearanceTheme))
    }
  }
  const userColor = normalizeHexColor(prefs.chatBubbleUserColor)
  const assistantColor = normalizeHexColor(prefs.chatBubbleAssistantColor)
  if (userColor || assistantColor) {
    setChatBubbleColorsState((current) => {
      const next = {
        user: userColor || current.user,
        assistant: assistantColor || current.assistant
      }
      localStorage.setItem(CHAT_USER_COLOR_KEY, next.user)
      localStorage.setItem(CHAT_ASSISTANT_COLOR_KEY, next.assistant)
      return next
    })
  }
}

export function buildAppPreferences(input: {
  cwd: string
  recentProjects: string[]
  commandExecutable: string
  model: string
  appearanceTheme: AppearanceTheme
  chatBubbleColors: ChatBubbleColors
  startupProjectBehavior: AppGuiPreferences['startupProjectBehavior']
  sidebarWidth: number
  rightInspectorWidth: number
}): AppGuiPreferences {
  return {
    version: 1,
    cwd: input.cwd,
    recentProjects: input.recentProjects,
    commandExecutable: input.commandExecutable,
    model: input.model,
    projectModels: loadProjectModels(),
    appearanceTheme: input.appearanceTheme,
    chatBubbleUserColor: input.chatBubbleColors.user,
    chatBubbleAssistantColor: input.chatBubbleColors.assistant,
    startupProjectBehavior: input.startupProjectBehavior,
    releaseNotesSeen: loadSeenReleaseNotes(),
    sidebarWidth: input.sidebarWidth,
    rightInspectorWidth: input.rightInspectorWidth,
    updatedAt: new Date().toISOString()
  }
}

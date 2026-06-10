import type { JSX } from 'react'
import type { AppearanceTheme, ChatBubbleColors } from '../appTypes'
import { SettingsDestinationNote } from './CoreSettings'
import { SettingsPageHeader } from './SettingsPageHeader'
import { settingsItem } from './settingsRegistry'

const appearanceOptions: Array<{
  id: AppearanceTheme
  name: string
  description: string
  swatch: string
}> = [
  {
    id: 'cc-spectrum',
    name: 'CC Spectrum',
    description: 'Black canvas, blueprint grid, and spectral Command Code runtime texture.',
    swatch: 'spectrum'
  },
  {
    id: 'terminal-minimal',
    name: 'Terminal Minimal',
    description: 'Quiet dark desktop surface with the least visual motion around the composer.',
    swatch: 'minimal'
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Crisp technical grid with cooler cyan and blue runtime blocks.',
    swatch: 'blueprint'
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Sharper borders, stronger text, and reduced color for long operating sessions.',
    swatch: 'contrast'
  }
]

export function AppearanceSettings({
  appearanceTheme,
  setAppearanceTheme,
  chatBubbleColors,
  setChatBubbleColors
}: {
  appearanceTheme: AppearanceTheme
  setAppearanceTheme: (value: AppearanceTheme) => void
  chatBubbleColors: ChatBubbleColors
  setChatBubbleColors: (value: ChatBubbleColors) => void
}): JSX.Element {
  return (
    <div className="settings-detail-page">
      <SettingsPageHeader item={settingsItem('appearance')} status="Adapter presentation only" scope="Saved as GUI preference" />
      <div className="settings-card settings-card--wide">
        <div className="appearance-options" role="radiogroup" aria-label="Appearance theme">
          {appearanceOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`appearance-option ${appearanceTheme === option.id ? 'appearance-option--selected' : ''}`}
              onClick={() => setAppearanceTheme(option.id)}
              role="radio"
              aria-checked={appearanceTheme === option.id}
            >
              <span className={`appearance-preview appearance-preview--${option.swatch}`} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="appearance-option-copy">
                <strong>{option.name}</strong>
                <span>{option.description}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="appearance-chat-controls" aria-label="Chat bubble colors">
          <label>
            <span>You</span>
            <input
              type="color"
              value={chatBubbleColors.user}
              onChange={(event) => setChatBubbleColors({ ...chatBubbleColors, user: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>CC</span>
            <input
              type="color"
              value={chatBubbleColors.assistant}
              onChange={(event) => setChatBubbleColors({ ...chatBubbleColors, assistant: event.currentTarget.value })}
            />
          </label>
        </div>
        <SettingsDestinationNote
          scope="GUI app and project preferences"
          path="~/.commandcode/gui-preferences.json and <project>/.commandcode/gui-preferences.json"
          fields="appearanceTheme, chatBubbleUserColor, chatBubbleAssistantColor"
        />
        <p className="settings-muted">Theme changes are saved on this machine and only affect the desktop adapter presentation. Command Code CLI behavior and permission semantics stay unchanged.</p>
      </div>
    </div>
  )
}

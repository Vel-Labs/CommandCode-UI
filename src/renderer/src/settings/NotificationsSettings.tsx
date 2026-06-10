import { useCallback, useEffect, useState } from 'react'
import type { JSX } from 'react'
import {
  NOTIFICATION_PREFERENCES_CHANGED_EVENT,
  defaultAudioPrefs,
  loadAudioPrefs,
  loadToastPrefs,
  notificationCategoryLabel,
  saveAudioPrefs,
  saveToastPrefs
} from './notificationPreferences'
import type { AudioPrefs, ToastPrefs } from './notificationPreferences'
import { ReferenceRow, SettingsReferenceCard } from './ReferenceSettingsShared'

export function NotificationsSettings(): JSX.Element {
  const [toastPrefs, setToastPrefs] = useState<ToastPrefs>(loadToastPrefs)
  const [audioPrefs, setAudioPrefs] = useState<AudioPrefs>(loadAudioPrefs)

  useEffect(() => {
    const reload = () => {
      setToastPrefs(loadToastPrefs())
      setAudioPrefs(loadAudioPrefs())
    }
    window.addEventListener(NOTIFICATION_PREFERENCES_CHANGED_EVENT, reload)
    return () => window.removeEventListener(NOTIFICATION_PREFERENCES_CHANGED_EVENT, reload)
  }, [])

  const updateToast = useCallback((update: Partial<ToastPrefs>) => {
    setToastPrefs((prev) => saveToastPrefs({ ...prev, ...update }))
  }, [])

  const updateAudio = useCallback((update: Partial<AudioPrefs>) => {
    setAudioPrefs((prev) => saveAudioPrefs({ ...prev, ...update }))
  }, [])

  return (
    <SettingsReferenceCard title="Notifications">
      <div className="settings-destination-note">
        <span>Renderer-local GUI preference</span>
        <code>localStorage: ccgui.toast-preferences, ccgui.audio-preferences</code>
        <small>toast/audio only</small>
      </div>
      <label className="settings-control-row">
        <span>Toast duration</span>
        <select value={toastPrefs.durationMs} onChange={(event) => updateToast({ durationMs: Number(event.target.value) })}>
          <option value={2500}>2.5 seconds</option>
          <option value={4000}>4 seconds</option>
          <option value={6500}>6.5 seconds</option>
          <option value={10000}>10 seconds</option>
        </select>
      </label>
      <div className="settings-toggle-grid">
        {Object.entries(toastPrefs.categories).map(([key, enabled]) => (
          <label key={key} className="settings-toggle-row">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => updateToast({ categories: { ...toastPrefs.categories, [key]: event.target.checked } })}
            />
            <span>{notificationCategoryLabel(key)}</span>
          </label>
        ))}
      </div>
      <label className="settings-control-row">
        <span>Audio master volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={audioPrefs.masterVolume}
          onChange={(event) => updateAudio({ masterVolume: Number(event.target.value) })}
        />
        <small>{Math.round(audioPrefs.masterVolume * 100)}%</small>
      </label>
      <div className="settings-toggle-grid">
        {Object.entries(defaultAudioPrefs.categories).map(([key]) => {
          const fallback = defaultAudioPrefs.categories[key] || { enabled: false, volume: 1 }
          const category = audioPrefs.categories[key] || fallback
          return (
            <label key={key} className="settings-toggle-row">
              <input
                type="checkbox"
                checked={category.enabled}
                onChange={(event) => updateAudio({ categories: { ...audioPrefs.categories, [key]: { ...category, enabled: event.target.checked } } })}
              />
              <span>{notificationCategoryLabel(key)} audio</span>
            </label>
          )
        })}
      </div>
      <ReferenceRow label="Session readiness" value="Unread state is visible in tabs; response-ready/input-required categories are staged" />
      <p className="settings-muted">These settings control renderer toast/audio preferences. OS notifications, hook-triggered alerts, quiet mode, and response-ready/input-required notification dispatch remain planned.</p>
    </SettingsReferenceCard>
  )
}

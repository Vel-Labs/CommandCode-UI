import { useState, useEffect, useCallback } from 'react'
import type { JSX } from 'react'
import {
  NOTIFICATION_PREFERENCES_CHANGED_EVENT,
  loadAudioPrefs,
  loadToastPrefs,
  notificationCategoryLabel,
  saveAudioPrefs,
  saveToastPrefs
} from '../settings/notificationPreferences'
import type { AudioPrefs, ToastPrefs } from '../settings/notificationPreferences'

type Toast = {
  id: number
  message: string
  category: string
  timestamp: number
}

let nextId = 1
const listeners: Set<(toast: Toast) => void> = new Set()

export function notify(message: string, category: string) {
  const prefs = loadToastPrefs()
  if (prefs.categories[category] === false) return
  const toast: Toast = { id: nextId++, message, category, timestamp: Date.now() }
  listeners.forEach((fn) => fn(toast))
}

export function ToastContainer(): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [prefs, setPrefs] = useState<ToastPrefs>(loadToastPrefs)

  useEffect(() => {
    const reload = () => setPrefs(loadToastPrefs())
    window.addEventListener(NOTIFICATION_PREFERENCES_CHANGED_EVENT, reload)
    return () => window.removeEventListener(NOTIFICATION_PREFERENCES_CHANGED_EVENT, reload)
  }, [])

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, prefs.durationMs)
    }
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [prefs.durationMs])

  return (
    <div className="toast-container toast-top-right">
      {toasts.map((t) => (
        <div key={t.id} className="toast">{t.message}</div>
      ))}
    </div>
  )
}

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(frequency: number, duration: number, volume: number) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = frequency
  gain.gain.value = volume * 0.3
  osc.start()
  osc.stop(ctx.currentTime + duration / 1000)
}

export function playChime(category: string) {
  const prefs = loadAudioPrefs()
  const cat = prefs.categories[category]
  if (!cat?.enabled) return
  const vol = prefs.masterVolume * cat.volume

  if (category === 'session-started') {
    playTone(880, 80, vol)
    setTimeout(() => playTone(1100, 100, vol), 100)
  } else if (category === 'session-exited') {
    playTone(440, 120, vol)
    setTimeout(() => playTone(330, 150, vol), 130)
  } else if (category === 'headless-complete') {
    playTone(660, 80, vol)
    setTimeout(() => playTone(880, 80, vol), 100)
    setTimeout(() => playTone(1100, 120, vol), 200)
  } else if (category === 'headless-error') {
    playTone(220, 200, vol)
    setTimeout(() => playTone(180, 250, vol), 220)
  }
}

export function SettingsDropdown(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [toastPrefs, setToastPrefs] = useState<ToastPrefs>(loadToastPrefs)
  const [audioPrefs, setAudioPrefs] = useState<AudioPrefs>(loadAudioPrefs)

  const updateToast = useCallback((update: Partial<ToastPrefs>) => {
    setToastPrefs((prev) => {
      const next = { ...prev, ...update }
      return saveToastPrefs(next)
    })
  }, [])

  const updateAudio = useCallback((update: Partial<AudioPrefs>) => {
    setAudioPrefs((prev) => {
      const next = { ...prev, ...update }
      return saveAudioPrefs(next)
    })
  }, [])

  useEffect(() => {
    const reload = () => {
      setToastPrefs(loadToastPrefs())
      setAudioPrefs(loadAudioPrefs())
    }
    window.addEventListener(NOTIFICATION_PREFERENCES_CHANGED_EVENT, reload)
    return () => window.removeEventListener(NOTIFICATION_PREFERENCES_CHANGED_EVENT, reload)
  }, [])

  return (
    <div className="settings-dropdown-wrapper">
      <button className="ghost-button settings-bell" onClick={() => setOpen(!open)} title="Settings">
        ⚙
      </button>
      {open && (
        <div className="settings-dropdown">
          <div className="settings-section">
            <div className="settings-section-title">Notifications</div>
            {Object.entries(toastPrefs.categories).map(([key, enabled]) => (
              <label key={key} className="check-row settings-check">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => updateToast({ categories: { ...toastPrefs.categories, [key]: e.target.checked } })}
                />
                {notificationCategoryLabel(key)}
              </label>
            ))}
          </div>
          <div className="settings-section">
            <div className="settings-section-title">Audio cues</div>
            <label className="settings-check">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={audioPrefs.masterVolume}
                onChange={(e) => updateAudio({ masterVolume: Number(e.target.value) })}
              />
              Volume: {Math.round(audioPrefs.masterVolume * 100)}%
            </label>
            {Object.entries(audioPrefs.categories).map(([key, cat]) => (
              <label key={key} className="check-row settings-check">
                <input
                  type="checkbox"
                  checked={cat.enabled}
                  onChange={(e) => updateAudio({ categories: { ...audioPrefs.categories, [key]: { ...cat, enabled: e.target.checked } } })}
                />
                {notificationCategoryLabel(key)}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

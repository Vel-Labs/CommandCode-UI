import { useState, useEffect, useCallback } from 'react'
import type { JSX } from 'react'

type Toast = {
  id: number
  message: string
  category: string
  timestamp: number
}

const TOAST_PREFS_KEY = 'ccgui.toast-preferences'
const AUDIO_PREFS_KEY = 'ccgui.audio-preferences'

type ToastPrefs = {
  durationMs: number
  categories: Record<string, boolean>
}

type AudioPrefs = {
  masterVolume: number
  categories: Record<string, { enabled: boolean; volume: number }>
}

const defaultToastPrefs: ToastPrefs = {
  durationMs: 4000,
  categories: {
    'session-started': true,
    'session-exited': true,
    'session-response': true,
    'headless-complete': true,
    'headless-error': true,
    'transcript-saved': true
  }
}

const defaultAudioPrefs: AudioPrefs = {
  masterVolume: 0.5,
  categories: {
    'session-started': { enabled: false, volume: 1 },
    'session-exited': { enabled: false, volume: 1 },
    'session-response': { enabled: false, volume: 1 },
    'headless-complete': { enabled: false, volume: 1 },
    'headless-error': { enabled: false, volume: 1 }
  }
}

function loadToastPrefs(): ToastPrefs {
  try {
    const stored = localStorage.getItem(TOAST_PREFS_KEY)
    return stored ? { ...defaultToastPrefs, ...JSON.parse(stored) as Partial<ToastPrefs> } : defaultToastPrefs
  } catch { return defaultToastPrefs }
}

function loadAudioPrefs(): AudioPrefs {
  try {
    const stored = localStorage.getItem(AUDIO_PREFS_KEY)
    return stored ? { ...defaultAudioPrefs, ...JSON.parse(stored) as Partial<AudioPrefs> } : defaultAudioPrefs
  } catch { return defaultAudioPrefs }
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
  const [prefs] = useState<ToastPrefs>(loadToastPrefs)

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
      localStorage.setItem(TOAST_PREFS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const updateAudio = useCallback((update: Partial<AudioPrefs>) => {
    setAudioPrefs((prev) => {
      const next = { ...prev, ...update }
      localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(next))
      return next
    })
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
                {key.replace(/-/g, ' ')}
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
                {key.replace(/-/g, ' ')}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import type { AudioPrefs, ToastPrefs } from '../settings/notificationPreferences'
import type { ReadinessNotification } from './sessionReadiness'

export type ReadinessNotificationPlan = {
  category: ReadinessNotification
  message: string
  toast: boolean
  audio: boolean
  volume: number
}

export function planReadinessNotification(
  notification: ReadinessNotification,
  toastPrefs: ToastPrefs,
  audioPrefs: AudioPrefs
): ReadinessNotificationPlan {
  const audioCategory = audioPrefs.categories[notification]
  const audio = Boolean(audioCategory?.enabled) && audioPrefs.masterVolume > 0 && (audioCategory?.volume ?? 0) > 0
  return {
    category: notification,
    message: readinessMessage(notification),
    toast: toastPrefs.categories[notification] !== false,
    audio,
    volume: audio ? Math.max(0, Math.min(1, audioPrefs.masterVolume * (audioCategory?.volume ?? 0))) : 0
  }
}

function readinessMessage(notification: ReadinessNotification): string {
  if (notification === 'input-required') return 'Command Code needs input'
  return 'Command Code response is ready'
}

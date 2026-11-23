import { settingsStore } from '@/features/settings/settingsStore'

/** Vibrates if the player allows it and the device can (Android; iPhones ignore it). */
export function vibrate(pattern: number | number[]): void {
  if (!settingsStore.getState().haptics) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Vibration unsupported.
  }
}

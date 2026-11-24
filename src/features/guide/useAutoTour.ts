import { useEffect } from 'react'
import { settingsStore, type TourName } from '@/features/settings/settingsStore'
import { startTour, tourStore } from './tourStore'

const SETTLE_MS = 600
const RETRY_MS = 1000

/**
 * Starts a screen's guide the first time the player sees that screen, once it is `ready`
 * and nothing else (age check, another guide, an open window) is in the way.
 */
export function useAutoTour(name: TourName, ready = true): void {
  useEffect(() => {
    if (!ready) return
    let timer: ReturnType<typeof setTimeout>
    const tryStart = () => {
      const settings = settingsStore.getState()
      if (settings.toursSeen.includes(name) || !settings.ageConfirmedAt) return
      if (tourStore.getState().active) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        timer = setTimeout(tryStart, RETRY_MS)
        return
      }
      startTour(name)
    }
    timer = setTimeout(tryStart, SETTLE_MS)
    return () => clearTimeout(timer)
  }, [name, ready])
}

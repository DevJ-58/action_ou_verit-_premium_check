import { useEffect } from 'react'
import { settingsStore, type TourName } from '@/features/settings/settingsStore'
import { endTour, startTour, tourStore } from './tourStore'

const SETTLE_MS = 600
const RETRY_MS = 1000
/** After this long behind other windows, the guide waits for the next visit. */
const GIVE_UP_MS = 30_000

/**
 * Starts a screen's guide the first time the player sees that screen, once it is `ready`
 * and nothing else (age check, another guide, an open window) is in the way.
 */
export function useAutoTour(name: TourName, ready = true): void {
  useEffect(() => {
    if (!ready) return
    let timer: ReturnType<typeof setTimeout>
    let waited = 0
    const tryStart = () => {
      const settings = settingsStore.getState()
      if (settings.toursSeen.includes(name) || !settings.ageConfirmedAt) return
      if (tourStore.getState().active) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        waited += RETRY_MS
        if (waited < GIVE_UP_MS) timer = setTimeout(tryStart, RETRY_MS)
        return
      }
      startTour(name)
    }
    timer = setTimeout(tryStart, SETTLE_MS)
    return () => clearTimeout(timer)
  }, [name, ready])
}

/** Closes this guide (as seen) once `over` — e.g. the turn it explains has moved on. */
export function useEndTourWhen(name: TourName, over: boolean): void {
  useEffect(() => {
    if (over && tourStore.getState().active === name) endTour()
  }, [name, over])
}

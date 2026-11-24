import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import { settingsStore } from '@/features/settings/settingsStore'
import { useT } from '@/i18n/useT'
import { stopTour, useActiveTour } from './tourStore'

const Tour = lazy(async () => ({ default: (await import('./Tour')).Tour }))

/** Shows the guide that is running, if any; once closed, it will not start by itself again. */
export function TourHost() {
  const t = useT()
  const active = useActiveTour()
  if (!active) return null
  const close = () => {
    settingsStore.getState().markTourSeen(active)
    stopTour()
  }
  return (
    <Suspense fallback={null}>
      <Tour
        key={active}
        steps={t.tour[active]}
        onClose={close}
        footer={
          <Link to="/regles" onClick={close} className="text-sm font-bold text-gold-text underline">
            {t.tour.rulesLink}
          </Link>
        }
      />
    </Suspense>
  )
}

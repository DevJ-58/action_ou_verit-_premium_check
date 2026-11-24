import { lazy, Suspense, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { useT } from '@/i18n/useT'
import { endTour, useActiveTour } from './tourStore'

const Tour = lazy(async () => ({ default: (await import('./Tour')).Tour }))

/**
 * Shows the guide that is running, if any; once closed, it will not start by itself again.
 * Going to another screen closes it: its elements are gone.
 */
export function TourHost() {
  const t = useT()
  const active = useActiveTour()
  const { pathname } = useLocation()
  const startedOn = useRef(pathname)
  useEffect(() => {
    if (active) startedOn.current = pathname
    // Only when a guide starts: a new screen is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
  useEffect(() => {
    if (startedOn.current !== pathname) endTour()
  }, [pathname])
  if (!active) return null
  return (
    <Suspense fallback={null}>
      <Tour
        key={active}
        steps={t.tour[active]}
        onClose={endTour}
        footer={
          <Link
            to="/regles"
            onClick={endTour}
            className="text-sm font-bold text-gold-text underline"
          >
            {t.tour.rulesLink}
          </Link>
        }
      />
    </Suspense>
  )
}

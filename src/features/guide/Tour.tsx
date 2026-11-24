import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/design-system'
import { useFocusTrap } from '@/design-system/useFocusTrap'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { findTarget, type TourStep } from './tours'

export interface TourProps {
  steps: readonly TourStep[]
  onClose(): void
  /** Shown under the text of the last step (e.g. a link to the rules). */
  footer?: ReactNode
}

interface Spot {
  /** Index in `steps` of the step shown. */
  index: number
  rect: { top: number; left: number; width: number; height: number }
}

const PAD = 8
const BUBBLE_ROOM = 220

/** Next step at or after `from` whose element is on screen, or -1. */
function nextPresent(steps: readonly TourStep[], from: number): number {
  for (let i = from; i < steps.length; i++) if (findTarget(steps[i]!.target)) return i
  return -1
}

/**
 * Dims the screen except one element, with a bubble that says what it is for.
 * Steps whose element is not on screen are skipped.
 */
export function Tour({ steps, onClose, footer }: TourProps) {
  const t = useT()
  const titleId = useId()
  const bubble = useRef<HTMLDivElement>(null)
  const [wanted, setWanted] = useState(0)
  const [spot, setSpot] = useState<Spot | null>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    let scrolled = -1
    let frame = 0
    const measure = () => {
      const index = nextPresent(steps, wanted)
      if (index < 0) {
        setSpot(null)
        closeRef.current()
        return
      }
      const el = findTarget(steps[index]!.target)!
      if (scrolled !== index) {
        scrolled = index
        el.scrollIntoView?.({ block: 'center', behavior: 'instant' })
      }
      const r = el.getBoundingClientRect()
      setSpot({ index, rect: { top: r.top, left: r.left, width: r.width, height: r.height } })
    }
    const later = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    later()
    window.addEventListener('resize', later)
    window.addEventListener('scroll', later, true)
    window.visualViewport?.addEventListener('resize', later)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', later)
      window.removeEventListener('scroll', later, true)
      window.visualViewport?.removeEventListener('resize', later)
    }
  }, [steps, wanted])

  useFocusTrap(bubble, spot !== null, onClose)

  if (!spot) return null
  const shown = steps.filter((s, i) => i <= spot.index && findTarget(s.target))
  const total =
    shown.length + steps.slice(spot.index + 1).filter((s) => findTarget(s.target)).length
  const n = shown.length
  const last = n === total
  const step = steps[spot.index]!
  const { rect } = spot
  const height = window.innerHeight
  // The ring stays inside the screen, even around full-width elements.
  const left = Math.max(4, rect.left - PAD)
  const right = Math.min(window.innerWidth - 4, rect.left + rect.width + PAD)
  const below = rect.top + rect.height + PAD + BUBBLE_ROOM < height
  const above = rect.top - PAD - BUBBLE_ROOM > 0
  const place = below
    ? { top: rect.top + rect.height + PAD + 8 }
    : above
      ? { bottom: height - rect.top + PAD + 8 }
      : { bottom: 16 }

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-2xl ring-2 ring-gold transition-all duration-300 motion-reduce:transition-none"
        style={{
          top: rect.top - PAD,
          left,
          width: Math.max(0, right - left),
          height: rect.height + PAD * 2,
          boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.72)',
        }}
      />
      <div
        ref={bubble}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-4 mx-auto flex max-w-sm flex-col gap-3 rounded-[24px] border border-line bg-bg p-5 shadow-card"
        style={place}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id={titleId} className="text-lg font-extrabold">
            {step.title}
          </h2>
          <span className="shrink-0 text-xs font-bold text-muted">
            {format(t.tour.counter, { n, total })}
          </span>
        </div>
        <p className="text-sm leading-normal text-muted">{step.text}</p>
        {last && footer ? footer : null}
        <div className="flex flex-row-reverse items-center justify-between gap-3">
          <Button size="md" onClick={() => (last ? onClose() : setWanted(spot.index + 1))}>
            {last ? t.tour.finish : t.tour.next}
          </Button>
          {last ? null : (
            <Button variant="ghost" className="normal-case tracking-normal" onClick={onClose}>
              {t.tour.skip}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

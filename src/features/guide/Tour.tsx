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
  bubbleHeight: number
}

const sameSpot = (a: Spot | null, b: Spot) =>
  a !== null &&
  a.index === b.index &&
  a.bubbleHeight === b.bubbleHeight &&
  a.rect.top === b.rect.top &&
  a.rect.left === b.rect.left &&
  a.rect.width === b.rect.width &&
  a.rect.height === b.rect.height

const PAD = 8
const MARGIN = 16
/** Height assumed for the bubble before it has been measured once. */
const BUBBLE_GUESS = 240

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
    let watched: HTMLElement | null = null
    // The page changes under the guide (next turn, a new answer…): it follows.
    const resized: Pick<ResizeObserver, 'observe' | 'unobserve' | 'disconnect'> =
      typeof ResizeObserver === 'undefined'
        ? { observe() {}, unobserve() {}, disconnect() {} }
        : new ResizeObserver(() => later())
    const changed = new MutationObserver(() => later())
    changed.observe(document.body, { childList: true, subtree: true })
    const measure = () => {
      const index = nextPresent(steps, wanted)
      if (index < 0) {
        setSpot(null)
        closeRef.current()
        return
      }
      const el = findTarget(steps[index]!.target)!
      if (watched !== el) {
        if (watched) resized.unobserve(watched)
        resized.observe(el)
        watched = el
      }
      if (bubble.current) resized.observe(bubble.current)
      if (scrolled !== index) {
        scrolled = index
        el.scrollIntoView?.({ block: 'center', behavior: 'instant' })
      }
      const r = el.getBoundingClientRect()
      const next: Spot = {
        index,
        rect: { top: r.top, left: r.left, width: r.width, height: r.height },
        bubbleHeight: bubble.current?.offsetHeight || BUBBLE_GUESS,
      }
      setSpot((current) => (sameSpot(current, next) ? current : next))
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
      resized.disconnect()
      changed.disconnect()
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
  const room = spot.bubbleHeight + PAD + 8
  const below = rect.top + rect.height + room + MARGIN <= height
  const above = rect.top - room - MARGIN >= 0
  // Too tall to fit beside its element (a card, a grid): the bubble stays at the bottom.
  const place = below
    ? { top: rect.top + rect.height + PAD + 8 }
    : above
      ? { bottom: height - rect.top + PAD + 8 }
      : { bottom: MARGIN }

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
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
        aria-labelledby={titleId}
        className="pointer-events-auto absolute inset-x-4 mx-auto flex max-w-sm flex-col gap-3 rounded-[24px] border border-line bg-bg p-5 shadow-card"
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
        <p role="status" className="sr-only">
          {`${step.title}. ${step.text} ${format(t.tour.counter, { n, total })}`}
        </p>
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

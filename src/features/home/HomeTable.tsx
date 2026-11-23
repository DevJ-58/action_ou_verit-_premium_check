import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BottleShape, springs } from '@/design-system'
import { AVATARS } from '@/content/avatars'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'

const SEATS = 8
const SPIN_MS = 2200
const PAUSE_MS = 2400
// Eight faces around the table, picked across the gallery for variety.
const FACES = Array.from({ length: SEATS }, (_, i) => AVATARS[(i * 5) % AVATARS.length]!)

/** The logo come alive: players around the table, the wax bottle spins and picks one. */
export function HomeTable() {
  const t = useT()
  const still = useReducedMotion() ?? false
  const [seat, setSeat] = useState(1)
  const [turns, setTurns] = useState(0)
  const [settled, setSettled] = useState(true)

  useEffect(() => {
    if (still) return
    const id = setInterval(() => {
      setSettled(false)
      setSeat((current) => (current + 3 + Math.floor(Math.random() * 4)) % SEATS)
      setTurns((n) => n + 2)
    }, SPIN_MS + PAUSE_MS)
    return () => clearInterval(id)
  }, [still])

  const rotation = turns * 360 + seat * (360 / SEATS)
  const truth = turns % 4 === 0

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-[min(420px,68vw,40dvh)] [@media(max-height:720px)]:max-w-[min(68vw,30dvh)] [container-type:inline-size] min-[900px]:max-w-[440px]"
    >
      <div className="absolute inset-[9cqw] rounded-full border-[0.8cqw] border-gold bg-seat shadow-card" />
      <div className="absolute inset-[16cqw] rounded-full border border-dashed border-gold/40" />
      {FACES.map((face, i) => {
        const a = (i * 2 * Math.PI) / SEATS - Math.PI / 2
        const chosen = settled && i === seat
        return (
          <motion.img
            key={face.id}
            src={face.src}
            alt=""
            animate={{ scale: chosen ? 1.18 : 1 }}
            transition={springs.bouncy}
            className={cn(
              'absolute size-[15cqw] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.6cqw] bg-bg p-[1cqw]',
              chosen ? 'border-gold' : 'border-line',
            )}
            style={{ left: `${50 + 41 * Math.cos(a)}%`, top: `${50 + 41 * Math.sin(a)}%` }}
          />
        )
      })}
      <motion.svg
        viewBox="0 0 120 120"
        className="absolute inset-[22cqw]"
        initial={false}
        animate={{ rotate: rotation }}
        transition={still ? { duration: 0 } : { duration: SPIN_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => setSettled(true)}
      >
        <g transform="translate(60 60) scale(1.35) translate(-60 -63)">
          <BottleShape />
        </g>
      </motion.svg>
      <AnimatePresence>
        {settled ? (
          <motion.span
            key={turns}
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -4 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springs.bouncy}
            className={cn(
              'absolute top-[2cqw] right-[2cqw] rounded-[2.4cqw] px-[3.6cqw] py-[2cqw] font-display text-[6cqw] leading-none shadow-card',
              truth ? 'bg-truth text-ivory' : 'bg-card-ivory text-dare-ink',
            )}
          >
            {truth ? `${t.game.truth} ?` : `${t.game.dare} !`}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

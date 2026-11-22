import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { springs } from './motion'

export interface FlipCardProps {
  flipped: boolean
  /** Shown once flipped. */
  front: ReactNode
  /** Shown before flipping (the card's back, e.g. the wax pattern). */
  back: ReactNode
  /** Makes the card a button. */
  onFlip?: () => void
  label?: string
  className?: string
}

/** A card that turns over in 3D; only its visible face is exposed to assistive tech. */
export function FlipCard({ flipped, front, back, onFlip, label, className }: FlipCardProps) {
  const reduce = useReducedMotion()
  const inner = (
    <motion.span
      className="relative block size-full [transform-style:preserve-3d]"
      initial={false}
      animate={{ rotateY: flipped ? 180 : 0 }}
      transition={reduce ? { duration: 0 } : springs.flip}
    >
      <span
        aria-hidden={flipped || undefined}
        className="absolute inset-0 [backface-visibility:hidden]"
      >
        {back}
      </span>
      <span
        aria-hidden={!flipped || undefined}
        className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]"
      >
        {front}
      </span>
    </motion.span>
  )
  const frame = `block [perspective:1000px] ${className ?? ''}`
  return onFlip ? (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.95 }}
      onClick={onFlip}
      className={frame}
    >
      {inner}
    </motion.button>
  ) : (
    <span className={frame}>{inner}</span>
  )
}

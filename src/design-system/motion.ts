import type { Transition } from 'motion/react'

/** Shared springs so every movement in the app feels like the same material. */
export const springs = {
  snappy: { type: 'spring', stiffness: 420, damping: 28 },
  bouncy: { type: 'spring', stiffness: 260, damping: 14 },
  gentle: { type: 'spring', stiffness: 180, damping: 24 },
  flip: { type: 'spring', stiffness: 120, damping: 16 },
} satisfies Record<string, Transition>

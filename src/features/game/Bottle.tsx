import { motion } from 'motion/react'

export const SPIN_MS = 4000

export interface BottleProps {
  rotation: number
  animate: boolean
}

/** Faceted glass bottle; its neck points at `rotation` degrees (0 = top, clockwise). */
export function Bottle({ rotation, animate }: BottleProps) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 340 340"
      className="absolute inset-0 size-full"
      initial={false}
      animate={{ rotate: rotation }}
      transition={
        animate ? { duration: SPIN_MS / 1000, ease: [0.12, 0.6, 0.2, 1] } : { duration: 0 }
      }
    >
      <path d="M163 90 L170 90 L170 112 L163 112 Z" fill="var(--glass-2)" />
      <path d="M170 90 L177 90 L177 112 L170 112 Z" fill="var(--glass-4)" />
      <path d="M163 112 L170 112 L170 134 L152 142 Z" fill="var(--glass-2)" />
      <path d="M170 112 L177 112 L188 142 L170 134 Z" fill="var(--glass-4)" />
      <path d="M152 142 L170 134 L170 224 L152 220 Z" fill="var(--glass-3)" />
      <path d="M170 134 L188 142 L188 220 L170 224 Z" fill="var(--glass-5)" />
      <path d="M152 142 L160 139 L160 220 L152 220 Z" fill="var(--glass-1)" />
      <rect x="160" y="81" width="20" height="10" fill="#e3b23c" />
      <rect x="153" y="166" width="34" height="32" fill="#f4ecdd" />
      <rect x="153" y="170" width="34" height="4" fill="#e05a2b" />
      <rect x="153" y="190" width="34" height="4" fill="#4757e8" />
      <path d="M170 177 L175 182 L170 187 L165 182 Z" fill="#e3b23c" />
    </motion.svg>
  )
}

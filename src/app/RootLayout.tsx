import { useLocation, useOutlet } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { springs } from '@/design-system'
import { useApplySettings } from '@/features/settings/useApplySettings'

/** Applies settings and fades/slides each new screen in. */
export function RootLayout() {
  useApplySettings()
  const outlet = useOutlet()
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="min-h-dvh"
    >
      {outlet}
    </motion.div>
  )
}

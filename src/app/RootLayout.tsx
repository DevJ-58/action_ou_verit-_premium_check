import { useLocation, useOutlet } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { springs } from '@/design-system'
import { useAccountBoot } from '@/features/account/useAccountBoot'
import { useApplySettings } from '@/features/settings/useApplySettings'
import { useAudioUnlock } from '@/lib/audio/useAudioUnlock'
import { UpdateBanner } from '@/features/update/UpdateBanner'

/** Applies settings, fades/slides each new screen in, and offers app updates. */
export function RootLayout() {
  useAccountBoot()
  useApplySettings()
  useAudioUnlock()
  const outlet = useOutlet()
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  return (
    <>
      <motion.div
        key={pathname}
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.gentle}
        className="min-h-dvh"
      >
        {outlet}
      </motion.div>
      <UpdateBanner />
    </>
  )
}

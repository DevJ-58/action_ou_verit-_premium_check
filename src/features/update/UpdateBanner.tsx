import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useSettings } from '@/features/settings/settingsStore'
import { UpdatePrompt } from './UpdatePrompt'
import { fetchWhatsNew } from './whatsNew'

const CHECK_EVERY_MS = 20 * 60 * 1000

/** Watches for a new version of the app and offers to apply it. */
export function UpdateBanner() {
  const language = useSettings((s) => s.language)
  const [notes, setNotes] = useState<string[]>([])
  const [later, setLater] = useState(false)
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // Installed apps stay open for long: look for a new version regularly and on return.
      const check = () => void registration.update().catch(() => {})
      setInterval(check, CHECK_EVERY_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  useEffect(() => {
    if (needRefresh) void fetchWhatsNew(language).then(setNotes)
  }, [needRefresh, language])

  return (
    <AnimatePresence>
      {needRefresh && !later ? (
        <UpdatePrompt
          notes={notes}
          onUpdate={() => void updateServiceWorker(true)}
          onLater={() => setLater(true)}
        />
      ) : null}
    </AnimatePresence>
  )
}

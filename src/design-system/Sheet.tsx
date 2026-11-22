import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useFocusTrap } from './useFocusTrap'

export interface SheetProps {
  open: boolean
  onClose(): void
  title: string
  children: ReactNode
}

/** Bottom sheet dialog: modal, focus-trapped, closes on Escape or backdrop tap. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  useFocusTrap(panelRef, open, onClose)

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative w-full max-w-lg rounded-t-[28px] border-t-[1.5px] border-gold bg-bg px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-text shadow-card"
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <h2 id={titleId} className="mb-4 text-xl font-extrabold tracking-[-0.02em]">
              {title}
            </h2>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

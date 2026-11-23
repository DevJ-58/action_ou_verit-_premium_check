import { useId } from 'react'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { Button, LogoMark, springs } from '@/design-system'
import { useT } from '@/i18n/useT'

export interface UpdatePromptProps {
  notes: string[]
  onUpdate(): void
  onLater(): void
}

/** “New version available”: what is new, Update now or Later. */
export function UpdatePrompt({ notes, onUpdate, onLater }: UpdatePromptProps) {
  const t = useT()
  const titleId = useId()
  return (
    <motion.div
      role="alertdialog"
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={springs.bouncy}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex flex-col gap-3 rounded-[26px] border-[1.5px] border-gold bg-seat p-4 shadow-card">
        <div className="flex items-center gap-3">
          <LogoMark size={44} className="shrink-0" />
          <div>
            <h2 id={titleId} className="font-extrabold">
              {t.update.title}
            </h2>
            <p className="text-sm text-muted">{t.update.body}</p>
          </div>
        </div>
        {notes.length > 0 ? (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-[0.14em] text-gold-text uppercase">
              <Sparkles aria-hidden="true" size={14} />
              {t.update.whatsNew}
            </p>
            <ul className="mt-1.5 flex flex-col gap-1 text-sm">
              {notes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span aria-hidden="true" className="text-gold-text">
                    ◆
                  </span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onUpdate}>
            {t.update.apply}
          </Button>
          <button type="button" onClick={onLater} className="min-h-12 px-4 font-bold text-muted">
            {t.update.later}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

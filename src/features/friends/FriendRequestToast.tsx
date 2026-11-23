import { AnimatePresence, motion } from 'motion/react'
import { Avatar, springs } from '@/design-system'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { getSocial } from './getSocial'
import { refreshSocial, useSocial } from './socialHub'

/** “Kofi wants to be your friend”, wherever the player is, with Accept and Decline. */
export function FriendRequestToast() {
  const t = useT()
  const request = useSocial((h) => h.requests.find((r) => r.toId === h.selfId) ?? null)
  const answer = (accept: boolean) =>
    request &&
    void getSocial()
      .answer(request.id, accept)
      .then(() => refreshSocial())
  return (
    <AnimatePresence>
      {request ? (
        <motion.section
          key={request.id}
          aria-label={t.friends.requestTitle}
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={springs.bouncy}
          className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-lg px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <div className="flex items-center gap-3 rounded-[24px] border-[1.5px] border-gold bg-seat p-3 shadow-card">
            <Avatar name={request.fromPseudo} avatarId={request.fromAvatar} size="sm" />
            <p className="min-w-0 flex-1 text-[15px] leading-tight font-extrabold">
              {format(t.friends.wantsYou, { name: request.fromPseudo })}
            </p>
            <button
              type="button"
              onClick={() => answer(true)}
              className="min-h-11 rounded-full bg-gold px-4 text-sm font-extrabold text-on-gold"
            >
              {t.friends.accept}
            </button>
            <button
              type="button"
              onClick={() => answer(false)}
              className="min-h-11 rounded-full px-2 text-sm font-bold text-muted"
            >
              {t.friends.decline}
            </button>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}

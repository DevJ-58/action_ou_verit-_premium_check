import { useNavigate } from 'react-router'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Avatar, springs } from '@/design-system'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { useMyInvites } from './myInvites'

/** “Awa invites you to play”: the newest room invitation, with Join and Ignore. */
export function InviteBanner() {
  const t = useT()
  const navigate = useNavigate()
  const { invites, dismiss } = useMyInvites()
  const invite = invites[0]
  return (
    <AnimatePresence>
      {invite ? (
        <motion.section
          key={invite.code}
          aria-label={t.friends.invitation}
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={springs.bouncy}
          className="sticky top-0 z-40 mx-auto w-full max-w-lg px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <div className="flex items-center gap-3 rounded-[24px] border-[1.5px] border-gold bg-seat p-3 shadow-card">
            <Avatar name={invite.fromPseudo} avatarId={invite.fromAvatar} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold">
                {format(t.friends.invitesYou, { name: invite.fromPseudo })}
              </p>
              <p className="font-mono text-xs tracking-[0.2em] text-gold-text">
                {format(t.friends.roomCode, { code: invite.code })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                dismiss(invite)
                navigate(`/salon/${invite.code}`)
              }}
              className="min-h-11 rounded-full bg-gold px-4 text-sm font-extrabold text-on-gold"
            >
              {t.friends.join}
            </button>
            <button
              type="button"
              aria-label={t.friends.ignore}
              onClick={() => dismiss(invite)}
              className="grid size-11 place-items-center rounded-full text-muted"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}

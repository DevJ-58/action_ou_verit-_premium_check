import { motion, AnimatePresence } from 'motion/react'
import { Crown } from 'lucide-react'
import { Avatar } from '@/design-system'
import { useT } from '@/i18n/useT'
import { AddFriendButton } from '@/features/friends/AddFriendButton'
import { openProfile } from '@/features/friends/profileViewer'
import { format } from '@/i18n/format'
import type { Member } from './types'

export interface MemberListProps {
  members: Member[]
  hostId: string
  selfId: string
  online: ReadonlySet<string>
}

export function MemberList({ members, hostId, selfId, online }: MemberListProps) {
  const t = useT()
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
      <AnimatePresence initial={false}>
        {members.map((m) => (
          <motion.li
            key={m.id}
            layout
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="flex flex-col items-center gap-1.5 rounded-[24px] bg-seat p-3 text-center"
          >
            <button
              type="button"
              aria-label={format(t.friends.seeProfile, { name: m.pseudo })}
              onClick={() => openProfile(m.id)}
              className="flex max-w-full flex-col items-center gap-1.5 rounded-[18px]"
            >
              <span className="relative">
                <Avatar name={m.pseudo} avatarId={m.avatarId} size="lg" />
                <span
                  aria-label={online.has(m.id) ? undefined : t.roomGame.offline}
                  role={online.has(m.id) ? undefined : 'img'}
                  className={`absolute right-0 bottom-0 size-4 rounded-full border-2 border-bg ${online.has(m.id) ? 'bg-[#3aa57a]' : 'bg-muted'}`}
                />
              </span>
              <span className="max-w-full truncate text-sm font-bold">{m.pseudo}</span>
            </button>
            {m.id === hostId ? (
              <span className="flex items-center gap-1 text-[11px] font-extrabold tracking-[0.12em] text-gold-text uppercase">
                <Crown aria-hidden="true" size={12} />
                {t.room.host}
              </span>
            ) : m.id === selfId ? (
              <span className="text-[11px] font-semibold text-muted">{t.room.you}</span>
            ) : null}
            {m.id === selfId ? null : (
              <AddFriendButton person={{ id: m.id, pseudo: m.pseudo, avatarId: m.avatarId }} />
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

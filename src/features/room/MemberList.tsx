import { motion, AnimatePresence } from 'motion/react'
import { Crown } from 'lucide-react'
import { Avatar } from '@/design-system'
import { useT } from '@/i18n/useT'
import type { Member } from './types'

export interface MemberListProps {
  members: Member[]
  hostId: string
  selfId: string
}

export function MemberList({ members, hostId, selfId }: MemberListProps) {
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
            <Avatar name={m.pseudo} avatarId={m.avatarId} size="lg" />
            <span className="max-w-full truncate text-sm font-bold">{m.pseudo}</span>
            {m.id === hostId ? (
              <span className="flex items-center gap-1 text-[11px] font-extrabold tracking-[0.12em] text-gold-text uppercase">
                <Crown aria-hidden="true" size={12} />
                {t.room.host}
              </span>
            ) : m.id === selfId ? (
              <span className="text-[11px] font-semibold text-muted">{t.room.you}</span>
            ) : null}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

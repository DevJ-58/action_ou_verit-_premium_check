import { motion, AnimatePresence } from 'motion/react'
import { Crown } from 'lucide-react'
import { Avatar } from '@/design-system'
import { useT } from '@/i18n/useT'
import { AddFriendButton } from '@/features/friends/AddFriendButton'
import { openProfile } from '@/features/friends/profileViewer'
import { format } from '@/i18n/format'
import { AXIS_AVATAR, isBot } from '@/content/axis'
import { BotBadge } from '@/features/bot/BotBadge'
import type { Member } from './types'

export interface MemberListProps {
  members: Member[]
  hostId: string
  selfId: string
  online: ReadonlySet<string>
  /** Host in the lobby: seats Axis (the AI) or takes him away. */
  onBot?(on: boolean): void
  /** There is a free seat and no Axis yet. */
  canAddBot?: boolean
}

export function MemberList({ members, hostId, selfId, online, onBot, canAddBot }: MemberListProps) {
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
              <span className="flex max-w-full items-center gap-1 text-sm font-bold">
                <span className="truncate">{m.pseudo}</span>
                {isBot(m.id) ? <BotBadge /> : null}
              </span>
            </button>
            {m.id === hostId ? (
              <span className="flex items-center gap-1 text-[11px] font-extrabold tracking-[0.12em] text-gold-text uppercase">
                <Crown aria-hidden="true" size={12} />
                {t.room.host}
              </span>
            ) : m.id === selfId ? (
              <span className="text-[11px] font-semibold text-muted">{t.room.you}</span>
            ) : null}
            {isBot(m.id) && onBot ? (
              <button
                type="button"
                aria-label={format(t.bot.remove, { name: m.pseudo })}
                onClick={() => onBot(false)}
                className="rounded-full border border-line px-3 py-1 text-xs font-bold text-muted"
              >
                {t.bot.removeShort}
              </button>
            ) : m.id === selfId ? null : (
              <AddFriendButton person={{ id: m.id, pseudo: m.pseudo, avatarId: m.avatarId }} />
            )}
          </motion.li>
        ))}
        {onBot && canAddBot ? (
          <motion.li
            key="add-axis"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex"
          >
            <button
              type="button"
              data-tour="add-ai"
              onClick={() => onBot(true)}
              className="flex w-full flex-col items-center gap-1.5 rounded-[24px] border-[1.5px] border-dashed border-line p-3 text-center"
            >
              <span className="opacity-80">
                <Avatar name="Axis" avatarId={AXIS_AVATAR} size="lg" />
              </span>
              <span className="text-sm font-bold">{t.bot.add}</span>
              <span className="text-[11px] text-muted">{t.bot.addHint}</span>
            </button>
          </motion.li>
        ) : null}
      </AnimatePresence>
    </ul>
  )
}

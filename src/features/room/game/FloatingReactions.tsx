import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Emoji } from '@/design-system'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import type { Member, Reaction } from '../types'
import { REACTIONS, type ReactionEmoji } from './reactions'

const isQuick = (e: string): e is ReactionEmoji => (REACTIONS as readonly string[]).includes(e)

/** Reactions sent since this screen opened float up and fade away. */
export function FloatingReactions({
  reactions,
  members,
}: {
  reactions: Reaction[]
  members: Member[]
}) {
  const t = useT()
  const [since] = useState(() => Date.now())
  const recent = reactions.filter((r) => r.at >= since).slice(-6)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center"
    >
      <AnimatePresence>
        {recent.map((r, i) => {
          const name = members.find((m) => m.id === r.from)?.pseudo ?? ''
          const label = format(t.roomGame.reacted, {
            name,
            emoji: isQuick(r.emoji) ? t.roomGame.emoji[r.emoji] : r.emoji,
          })
          return (
            <motion.span
              key={r.id}
              role="img"
              aria-label={label}
              initial={{ y: 0, opacity: 0, scale: 0.4 }}
              animate={{ y: -160, opacity: [0, 1, 1, 0], scale: 1.2, x: (i % 3) * 28 - 28 }}
              transition={{ duration: 2.4, ease: 'easeOut' }}
              className="absolute"
            >
              <Emoji name={r.emoji} size={48} />
            </motion.span>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

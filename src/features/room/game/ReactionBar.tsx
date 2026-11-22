import { motion } from 'motion/react'
import { Emoji } from '@/design-system'
import type { EmojiName } from '@/content/emoji'
import { useT } from '@/i18n/useT'
import { REACTIONS } from './reactions'

/** A row of emoji buttons to react live. */
export function ReactionBar({ onReact }: { onReact(emoji: EmojiName): void }) {
  const t = useT()
  return (
    <div role="toolbar" aria-label={t.roomGame.reactions} className="flex justify-center gap-1.5">
      {REACTIONS.map((emoji) => (
        <motion.button
          key={emoji}
          type="button"
          aria-label={t.roomGame.emoji[emoji]}
          whileTap={{ scale: 1.4, rotate: -8 }}
          onClick={() => onReact(emoji)}
          className="flex size-12 items-center justify-center rounded-full bg-seat"
        >
          <Emoji name={emoji} size={30} />
        </motion.button>
      ))}
    </div>
  )
}

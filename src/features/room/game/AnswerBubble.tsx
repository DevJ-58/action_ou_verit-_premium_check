import { motion } from 'motion/react'
import type { Answer } from '@/engine'
import { springs } from '@/design-system'
import { format } from '@/i18n/format'
import { getChatTransport } from '@/features/chat/getChatTransport'
import { VoicePlayer } from '@/features/chat/VoicePlayer'
import { useT } from '@/i18n/useT'

export interface AnswerBubbleProps {
  answer: Answer
  name: string
}

/** The answer as everyone sees it, under the card. */
export function AnswerBubble({ answer, name }: AnswerBubbleProps) {
  const t = useT()
  return (
    <motion.figure
      key={answer.text ?? answer.voiceId}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springs.bouncy}
      className="w-full max-w-sm rounded-[22px] rounded-tl-md border-[1.5px] border-gold-text/50 bg-seat px-4 py-3"
    >
      <figcaption className="text-[11px] font-extrabold tracking-[0.14em] text-gold-text uppercase">
        {format(t.roomGame.yourAnswer, { name })}
      </figcaption>
      {answer.text ? (
        <blockquote className="mt-1.5 text-lg leading-snug font-semibold break-words">
          {answer.text}
        </blockquote>
      ) : null}
      {answer.voiceId ? (
        <div className="mt-2 text-text">
          <VoicePlayer
            path={answer.voiceId}
            ms={answer.voiceMs ?? 1000}
            resolve={(path) => getChatTransport().voiceUrl(path)}
            label={format(t.chat.listen, {
              name,
              seconds: Math.max(1, Math.round((answer.voiceMs ?? 1000) / 1000)),
            })}
          />
        </div>
      ) : null}
    </motion.figure>
  )
}

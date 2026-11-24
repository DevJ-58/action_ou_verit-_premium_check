import { useState, type ReactNode } from 'react'
import { Smile } from 'lucide-react'
import type { EmojiName } from '@/content/emoji'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import { ReactionBar } from './ReactionBar'

export interface GameDockProps {
  chat: ReactNode
  mic: ReactNode
  players: ReactNode
  onReact(emoji: EmojiName): void
}

/** Bottom bar within thumb reach: chat, mic, reactions, players — each with its name. */
export function GameDock({ chat, mic, players, onReact }: GameDockProps) {
  const t = useT()
  const [reacting, setReacting] = useState(false)
  const slot = (child: ReactNode, label: string, tour: string) => (
    <div data-tour={tour} className="flex flex-col items-center gap-1">
      {child}
      <span aria-hidden="true" className="text-[11px] font-bold text-muted">
        {label}
      </span>
    </div>
  )
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
      {reacting ? (
        <div className="absolute inset-x-0 bottom-full flex justify-center pb-2">
          <div className="rounded-full border border-line bg-bg p-1.5 shadow-card">
            <ReactionBar
              onReact={(emoji) => {
                onReact(emoji)
                setReacting(false)
              }}
            />
          </div>
        </div>
      ) : null}
      <div className="mx-auto grid max-w-lg grid-cols-4 px-3 pt-2">
        {slot(chat, t.guide.chatShort, 'dock-chat')}
        {slot(mic, t.guide.micShort, 'dock-mic')}
        {slot(
          <button
            type="button"
            aria-label={t.guide.react}
            aria-expanded={reacting}
            onClick={() => setReacting((r) => !r)}
            className={cn(
              'grid size-12 place-items-center rounded-full border-[1.5px] active:scale-95',
              reacting ? 'border-gold bg-gold text-on-gold' : 'border-line text-text',
            )}
          >
            <Smile aria-hidden="true" size={21} />
          </button>,
          t.guide.react,
          'dock-react',
        )}
        {slot(players, t.guide.playersShort, 'dock-players')}
      </div>
    </div>
  )
}

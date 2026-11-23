import { Avatar } from '@/design-system'
import type { Member } from '@/features/room/types'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import type { ChatMessage } from './types'
import { ChatPhoto } from './ChatPhoto'
import { VoicePlayer } from './VoicePlayer'
import { openProfile } from '@/features/friends/profileViewer'

export interface MessageBubbleProps {
  message: ChatMessage
  author?: Member
  mine: boolean
  resolveVoice(path: string): Promise<string>
}

/** One chat message: mine on the right in gold, others on the left with their avatar. */
export function MessageBubble({ message, author, mine, resolveVoice }: MessageBubbleProps) {
  const t = useT()
  const name = author?.pseudo ?? '?'
  const seconds = Math.max(1, Math.round((message.voice?.ms ?? 0) / 1000))
  return (
    <li className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}>
      {mine || !author ? null : (
        <button
          type="button"
          aria-label={format(t.friends.seeProfile, { name })}
          onClick={() => openProfile(author.id)}
          className="shrink-0 rounded-full"
        >
          <Avatar name={name} avatarId={author.avatarId} size="sm" />
        </button>
      )}
      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-0.5 rounded-[20px] px-3.5 py-2.5',
          mine ? 'rounded-br-md bg-gold text-on-gold' : 'rounded-bl-md bg-seat text-text',
        )}
      >
        {mine ? null : <span className="text-xs font-extrabold text-gold-text">{name}</span>}
        {message.text ? (
          <p className="text-[15px] leading-snug break-words whitespace-pre-wrap">{message.text}</p>
        ) : null}
        {message.photo ? (
          <ChatPhoto
            path={message.photo.path}
            width={message.photo.width}
            height={message.photo.height}
            resolve={resolveVoice}
            alt={mine ? t.chat.myPhoto : format(t.chat.photoOf, { name })}
          />
        ) : null}
        {message.voice ? (
          <VoicePlayer
            path={message.voice.path}
            ms={message.voice.ms}
            tone={mine ? 'gold' : 'plain'}
            resolve={resolveVoice}
            label={
              mine
                ? format(t.chat.listenMine, { seconds })
                : format(t.chat.listen, { name, seconds })
            }
          />
        ) : null}
      </div>
    </li>
  )
}

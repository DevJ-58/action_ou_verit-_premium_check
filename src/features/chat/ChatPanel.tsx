import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { Emoji, Sheet } from '@/design-system'
import type { Member } from '@/features/room/types'
import { useT } from '@/i18n/useT'
import { ChatComposer } from './ChatComposer'
import type { ChatStore } from './chatStore'
import { MessageBubble } from './MessageBubble'

export interface ChatPanelProps {
  store: ChatStore
  members: Member[]
  selfId: string
  open: boolean
  onClose(): void
}

/** The room conversation, in a sheet over the game. */
export function ChatPanel({ store, members, selfId, open, onClose }: ChatPanelProps) {
  const t = useT()
  const messages = useStore(store, (s) => s.messages)
  const transport = useStore(store, (s) => s.transport)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    store.getState().setOpen(open)
  }, [open, store])
  const count = messages.length
  useEffect(() => {
    // Keep the newest message in view when one arrives or the panel opens.
    if (open && count > 0) end.current?.scrollIntoView?.({ block: 'end' })
  }, [count, open])

  return (
    <Sheet open={open} onClose={onClose} title={t.chat.title}>
      <div className="flex h-[min(70dvh,560px)] flex-col gap-3">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted">
              <Emoji name="speech" size={56} />
              <p className="max-w-60 font-semibold">{t.chat.empty}</p>
            </div>
          ) : null}
          <ul
            role="log"
            aria-live="polite"
            aria-label={t.chat.title}
            className="flex flex-col gap-2.5"
          >
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                author={members.find((x) => x.id === m.from)}
                mine={m.from === selfId}
                resolveVoice={transport.voiceUrl}
              />
            ))}
          </ul>
          <div ref={end} />
        </div>
        <ChatComposer store={store} />
      </div>
    </Sheet>
  )
}

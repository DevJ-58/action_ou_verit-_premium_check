import { MessageCircle } from 'lucide-react'
import { useStore } from 'zustand'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import type { ChatStore } from './chatStore'

/** Opens the chat; shows how many messages are unread. */
export function ChatButton({ store, onOpen }: { store: ChatStore; onOpen(): void }) {
  const t = useT()
  const unread = useStore(store, (s) => s.unread)
  const label =
    unread > 0 ? `${t.chat.open} · ${format(t.chat.unread, { count: unread })}` : t.chat.open
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onOpen}
      className="relative inline-flex size-12 items-center justify-center rounded-full border-[1.5px] border-line text-text active:scale-95"
    >
      <MessageCircle aria-hidden="true" size={20} />
      {unread > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 grid min-w-5.5 place-items-center rounded-full bg-dare px-1 text-xs font-extrabold text-ivory"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      ) : null}
    </button>
  )
}

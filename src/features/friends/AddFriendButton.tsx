import { isBot } from '@/content/axis'
import { useState } from 'react'
import { Check, Clock, UserPlus } from 'lucide-react'
import { useAccount } from '@/features/account/accountStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import type { Friend } from './friends'
import { getSocial } from './getSocial'
import { refreshSocial, useSocial } from './socialHub'

const PILL = 'flex min-h-9 items-center gap-1 rounded-full px-2.5 text-xs font-extrabold'

/** “+ Ami” on another player: sends a friend request; shows its state (sent, friends, to accept). */
export function AddFriendButton({ person }: { person: Friend }) {
  const t = useT()
  const selfId = useAccount((s) => s.session?.profile.id)
  const isFriend = useAccount((s) => s.session?.profile.friends.some((f) => f.id === person.id))
  const sent = useSocial((h) => h.requests.some((r) => r.toId === person.id))
  const incoming = useSocial((h) => h.requests.find((r) => r.fromId === person.id))
  const [justSent, setJustSent] = useState(false)
  // Axis, the game's AI, is nobody's friend request.
  if (!selfId || selfId === person.id || isBot(person.id)) return null

  if (isFriend) {
    return (
      <span className={`${PILL} tracking-[0.12em] text-gold-text uppercase`}>
        <Check aria-hidden="true" size={12} />
        {t.friends.friend}
      </span>
    )
  }
  if (incoming) {
    return (
      <button
        type="button"
        onClick={() =>
          void getSocial()
            .answer(incoming.id, true)
            .then(() => refreshSocial())
        }
        className={`${PILL} bg-gold text-on-gold`}
      >
        <Check aria-hidden="true" size={14} />
        {t.friends.accept}
      </button>
    )
  }
  if (sent || justSent) {
    return (
      <span className={`${PILL} text-muted`}>
        <Clock aria-hidden="true" size={12} />
        {t.friends.requested}
      </span>
    )
  }
  return (
    <button
      type="button"
      aria-label={format(t.friends.request, { name: person.pseudo })}
      onClick={() =>
        void getSocial()
          .sendRequest(person)
          .then((result) => {
            if (result !== 'failed') setJustSent(true)
            return refreshSocial()
          })
      }
      className={`${PILL} border-[1.5px] border-gold text-gold-text`}
    >
      <UserPlus aria-hidden="true" size={14} />
      {t.friends.friend}
    </button>
  )
}

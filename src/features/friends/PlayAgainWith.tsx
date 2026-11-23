import { Avatar } from '@/design-system'
import { useAccount } from '@/features/account/accountStore'
import type { Member } from '@/features/room/types'
import { useT } from '@/i18n/useT'
import { format } from '@/i18n/format'
import { AddFriendButton } from './AddFriendButton'
import { openProfile } from './profileViewer'

/** After a room game: keep the other players as friends to play again. */
export function PlayAgainWith({ members }: { members: Member[] }) {
  const t = useT()
  const selfId = useAccount((s) => s.session?.profile.id)
  const others = members.filter((m) => m.id !== selfId)
  if (!selfId || others.length === 0) return null
  return (
    <section aria-label={t.friends.again} className="flex flex-col gap-3">
      <h2 className="text-lg font-extrabold">{t.friends.again}</h2>
      <ul className="flex flex-wrap gap-2.5">
        {others.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-2 rounded-full bg-seat py-1.5 pr-2 pl-1.5"
          >
            <button
              type="button"
              aria-label={format(t.friends.seeProfile, { name: m.pseudo })}
              onClick={() => openProfile(m.id)}
              className="flex items-center gap-2 rounded-full"
            >
              <Avatar name={m.pseudo} avatarId={m.avatarId} size="sm" />
              <span className="max-w-28 truncate text-sm font-bold">{m.pseudo}</span>
            </button>
            <AddFriendButton person={{ id: m.id, pseudo: m.pseudo, avatarId: m.avatarId }} />
          </li>
        ))}
      </ul>
    </section>
  )
}

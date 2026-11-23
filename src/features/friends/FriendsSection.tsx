import { Smartphone, UserMinus } from 'lucide-react'
import { Avatar, IconButton } from '@/design-system'
import { accountStore, useAccount } from '@/features/account/accountStore'
import { playersStore, usePlayers } from '@/features/players/playersStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import type { Friend } from './friends'

const NONE: Friend[] = []

/** Friends of the signed-in player, in the Players tab; one tap seats them on this phone. */
export function FriendsSection() {
  const t = useT()
  const friends = useAccount((s) => s.session?.profile.friends ?? NONE)
  const local = usePlayers((s) => s.players)
  if (friends.length === 0) return null
  const fold = (name: string) => name.trim().toLocaleLowerCase('fr')
  return (
    <section aria-label={t.friends.title} className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-extrabold">{t.friends.title}</h2>
        <p className="text-sm text-muted">{t.friends.hint}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {friends.map((f) => {
          const seated = local.some((p) => fold(p.name) === fold(f.pseudo))
          return (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-[20px] border border-line p-2.5"
            >
              <Avatar name={f.pseudo} avatarId={f.avatarId} size="sm" />
              <span className="flex-1 truncate font-bold">{f.pseudo}</span>
              {seated ? (
                <span className="text-xs font-bold text-gold-text">{t.friends.onPhone}</span>
              ) : (
                <IconButton
                  label={format(t.friends.toPhone, { name: f.pseudo })}
                  icon={<Smartphone size={17} />}
                  onClick={() =>
                    playersStore.getState().addPlayer({ name: f.pseudo, avatar: f.avatarId })
                  }
                />
              )}
              <IconButton
                label={format(t.friends.remove, { name: f.pseudo })}
                icon={<UserMinus size={17} />}
                onClick={() => void accountStore.getState().removeFriend(f.id)}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

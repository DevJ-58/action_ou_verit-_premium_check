import { Avatar } from '@/design-system'
import { useAccount } from '@/features/account/accountStore'
import { usePlayers } from '@/features/players/playersStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { FriendRow } from './FriendRow'
import type { Friend } from './friends'
import { getSocial } from './getSocial'
import { refreshSocial, useSocial } from './socialHub'

const NONE: Friend[] = []

/** Players tab: friend requests to answer, then friends (online first). */
export function FriendsSection() {
  const t = useT()
  const friends = useAccount((s) => s.session?.profile.friends ?? NONE)
  const local = usePlayers((s) => s.players)
  const online = useSocial((h) => h.online)
  const requests = useSocial((h) => h.requests)
  const selfId = useSocial((h) => h.selfId)
  const incoming = requests.filter((r) => r.toId === selfId)
  if (friends.length === 0 && incoming.length === 0) return null
  const fold = (name: string) => name.trim().toLocaleLowerCase('fr')
  const sorted = [...friends].sort((a, b) => Number(online.has(b.id)) - Number(online.has(a.id)))
  return (
    <div className="flex flex-col gap-8">
      {incoming.length > 0 ? (
        <section aria-label={t.friends.requestsTitle} className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">{t.friends.requestsTitle}</h2>
          <ul className="flex flex-col gap-2">
            {incoming.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-[20px] border-[1.5px] border-gold p-2.5"
              >
                <Avatar name={r.fromPseudo} avatarId={r.fromAvatar} size="sm" />
                <span className="min-w-0 flex-1 text-sm font-bold">
                  {format(t.friends.wantsYou, { name: r.fromPseudo })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    void getSocial()
                      .answer(r.id, true)
                      .then(() => refreshSocial())
                  }
                  className="min-h-11 rounded-full bg-gold px-4 text-sm font-extrabold text-on-gold"
                >
                  {t.friends.accept}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void getSocial()
                      .answer(r.id, false)
                      .then(() => refreshSocial())
                  }
                  className="min-h-11 px-2 text-sm font-bold text-muted"
                >
                  {t.friends.decline}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {friends.length > 0 ? (
        <section aria-label={t.friends.title} className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-extrabold">{t.friends.title}</h2>
            <p className="text-sm text-muted">{t.friends.hint}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {sorted.map((f) => (
              <FriendRow
                key={f.id}
                friend={f}
                online={online.has(f.id)}
                seated={local.some((p) => fold(p.name) === fold(f.pseudo))}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

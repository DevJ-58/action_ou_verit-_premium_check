import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Avatar, Screen } from '@/design-system'
import { usePlayers } from '@/features/players/playersStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'

/** Custom dares of every player on this phone, grouped by author. */
export function MyDaresScreen() {
  const t = useT()
  const players = usePlayers((s) => s.players)
  const authors = players.filter((p) => p.customDares.length > 0)

  if (authors.length === 0) {
    return (
      <Screen title={t.myDares.title}>
        <div className="m-auto max-w-xs text-center">
          <p className="text-lg font-semibold">{t.myDares.empty}</p>
          <p className="mt-2 text-muted">{t.myDares.emptyHint}</p>
        </div>
      </Screen>
    )
  }

  return (
    <Screen title={t.myDares.title}>
      <div className="flex flex-col gap-8 pt-2">
        {authors.map((player) => (
          <section key={player.id} className="flex flex-col gap-3">
            <Link to={`/joueurs/${player.id}`} className="flex min-h-12 items-center gap-3">
              <Avatar name={player.name} size="sm" />
              <span className="flex-1">
                <span className="block font-bold">{player.name}</span>
                <span className="block text-sm text-muted">
                  {format(t.players.dareCount, { count: player.customDares.length })}
                </span>
              </span>
              <ChevronRight aria-hidden="true" size={20} className="text-muted" />
            </Link>
            <ul className="flex flex-col gap-2">
              {player.customDares.map((dare) => (
                <li key={dare.id} className="rounded-xl border border-line px-4 py-3">
                  <span className="mr-2 font-display text-lg text-gold-text">
                    {dare.kind === 'truth' ? 'V' : 'A'}
                  </span>
                  {dare.text}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Screen>
  )
}

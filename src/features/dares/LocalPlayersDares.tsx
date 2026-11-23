import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Avatar } from '@/design-system'
import { usePlayers } from '@/features/players/playersStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'

/** Custom dares of the players registered on this phone (one-phone games), by author. */
export function LocalPlayersDares() {
  const t = useT()
  const players = usePlayers((s) => s.players)
  const authors = players.filter((p) => p.customDares.length > 0)
  if (authors.length === 0) return null
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-extrabold">{t.myDares.localTitle}</h2>
      {authors.map((player) => (
        <div key={player.id} className="flex flex-col gap-3">
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
        </div>
      ))}
    </section>
  )
}

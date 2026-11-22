import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, UserPlus } from 'lucide-react'
import { Avatar, Button, Emoji, Screen, Sheet } from '@/design-system'
import { useT } from '@/i18n/useT'
import { format } from '@/i18n/format'
import { AddPlayerForm } from './AddPlayerForm'
import { playersStore, usePlayers } from './playersStore'

export function PlayersScreen() {
  const t = useT()
  const players = usePlayers((s) => s.players)
  const [adding, setAdding] = useState(false)

  return (
    <Screen title={t.players.title}>
      {players.length === 0 ? (
        <div className="my-auto flex flex-col items-center text-center">
          <Emoji name="people" size={72} />
          <p className="text-lg font-semibold">{t.players.empty}</p>
          <p className="mt-2 text-muted">{t.players.emptyHint}</p>
        </div>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-line border-y border-line">
          {players.map((player) => (
            <li key={player.id}>
              <Link to={`/joueurs/${player.id}`} className="flex min-h-16 items-center gap-4 py-2">
                <Avatar name={player.name} />
                <span className="flex flex-1 flex-col">
                  <span className="text-base font-bold">{player.name}</span>
                  <span className="text-sm text-muted">
                    {format(t.players.dareCount, { count: player.customDares.length })}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" size={20} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Button size="lg" className="mt-6" onClick={() => setAdding(true)}>
        <UserPlus aria-hidden="true" size={20} />
        {t.players.add}
      </Button>
      <Sheet open={adding} onClose={() => setAdding(false)} title={t.players.add}>
        <AddPlayerForm
          existingNames={players.map((p) => p.name)}
          onAdd={(name) => {
            playersStore.getState().addPlayer({ name, avatar: '' })
            setAdding(false)
          }}
        />
      </Sheet>
    </Screen>
  )
}

import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Award as AwardIcon } from 'lucide-react'
import { Avatar, Button, KenteBand } from '@/design-system'
import { statsStore } from '@/features/players/statsStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import { computeAwards } from './awards'
import { gameStore, useGame } from './gameStore'

export function RecapScreen() {
  const t = useT()
  const navigate = useNavigate()
  const game = useGame((s) => s.game)
  const finished = game?.phase === 'finished' ? game : null

  useEffect(() => {
    if (finished) statsStore.getState().recordGame(finished)
  }, [finished])

  if (!finished) return <Navigate to={game ? '/partie' : '/'} replace />

  const ranking = [...finished.players].sort(
    (a, b) => finished.scores[b.id]!.points - finished.scores[a.id]!.points,
  )
  const awards = computeAwards(finished)
  const nameOf = (id: string) => finished.players.find((p) => p.id === id)!.name
  const winner = awards.find((a) => a.award === 'winner')

  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <KenteBand />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-5 pt-8 pb-6">
        <h1 className="font-display text-[44px] leading-[0.98]">
          {winner ? format(t.recap.winner, { name: nameOf(winner.playerId) }) : t.recap.ranking}
        </h1>

        <ul className="flex flex-wrap gap-2" aria-label={t.recap.titles}>
          {awards.map(({ award, playerId }) => (
            <li
              key={award}
              className="flex items-center gap-2 rounded-full border-[1.5px] border-gold px-3 py-1.5 text-sm font-bold"
            >
              <AwardIcon aria-hidden="true" size={16} className="text-gold-text" />
              {t.recap.awards[award]} · {nameOf(playerId)}
            </li>
          ))}
        </ul>

        <ol
          aria-label={t.recap.ranking}
          className="flex flex-col divide-y divide-line border-y border-line"
        >
          {ranking.map((player, index) => (
            <li key={player.id} className="flex min-h-16 items-center gap-4">
              <span className="w-6 text-lg font-extrabold text-gold-text tabular-nums">
                {index + 1}
              </span>
              <Avatar name={player.name} highlight={index === 0 ? 'answerer' : 'none'} />
              <span
                className={cn('flex-1 text-base', index === 0 ? 'font-extrabold' : 'font-semibold')}
              >
                {player.name}
              </span>
              <span className="text-lg font-extrabold tabular-nums">
                {format(t.recap.points, { points: finished.scores[player.id]!.points })}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-auto flex flex-col gap-2.5">
          <Button
            size="lg"
            onClick={() => {
              gameStore.getState().dispatch({ type: 'RESTART' })
              navigate('/partie', { replace: true })
            }}
          >
            {t.recap.replay}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              gameStore.getState().quit()
              navigate('/', { replace: true })
            }}
          >
            {t.recap.home}
          </Button>
        </div>
      </main>
    </div>
  )
}

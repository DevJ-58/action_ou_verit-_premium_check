import { Award as AwardIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { Avatar, Button, Emoji } from '@/design-system'
import type { GameState } from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import { computeAwards } from './awards'

export interface RecapBodyProps {
  game: GameState
  /** Hidden when the player cannot restart (room guests). */
  onReplay?: () => void
  onHome(): void
}

/** Ranking, titles and the replay / home actions — shared by one-phone and room games. */
export function RecapBody({ game, onReplay, onHome }: RecapBodyProps) {
  const t = useT()
  const ranking = [...game.players].sort(
    (a, b) => game.scores[b.id]!.points - game.scores[a.id]!.points,
  )
  const awards = computeAwards(game)
  const nameOf = (id: string) => game.players.find((p) => p.id === id)!.name
  const winner = awards.find((a) => a.award === 'winner')

  return (
    <div className="flex flex-1 flex-col gap-8">
      <motion.div
        initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="self-start"
      >
        <Emoji name="trophy" size={72} />
      </motion.div>
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

      <ol aria-label={t.recap.ranking} className="flex flex-col gap-2">
        {ranking.map((player, index) => (
          <motion.li
            key={player.id}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + index * 0.08, type: 'spring', stiffness: 300, damping: 26 }}
            className={cn(
              'flex min-h-16 items-center gap-4 rounded-[22px] px-4',
              index === 0 ? 'bg-seat' : '',
            )}
          >
            <span className="w-6 text-lg font-extrabold text-gold-text tabular-nums">
              {index + 1}
            </span>
            <Avatar
              name={player.name}
              avatarId={player.avatar}
              highlight={index === 0 ? 'answerer' : 'none'}
            />
            <span
              className={cn('flex-1 text-base', index === 0 ? 'font-extrabold' : 'font-semibold')}
            >
              {player.name}
            </span>
            <span className="text-lg font-extrabold tabular-nums">
              {format(t.recap.points, { points: game.scores[player.id]!.points })}
            </span>
          </motion.li>
        ))}
      </ol>

      <div className="mt-auto flex flex-col gap-2.5">
        {onReplay ? (
          <Button size="lg" onClick={onReplay}>
            {t.recap.replay}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onHome}>
          {t.recap.home}
        </Button>
      </div>
    </div>
  )
}

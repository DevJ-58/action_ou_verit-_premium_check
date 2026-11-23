import { motion } from 'motion/react'
import { Emoji, springs } from '@/design-system'
import type { EmojiName } from '@/content/emoji'
import type { AccountStats } from '@/features/account/accountStats'
import { useT } from '@/i18n/useT'

export interface StatsGridProps {
  stats: AccountStats
}

/** The player's numbers, as tiles. */
export function StatsGrid({ stats }: StatsGridProps) {
  const t = useT()
  const tiles: { emoji: EmojiName; value: number; label: string }[] = [
    { emoji: 'game', value: stats.games, label: t.profile.statGames },
    { emoji: 'trophy', value: stats.wins, label: t.profile.statWins },
    { emoji: 'star', value: stats.points, label: t.profile.statPoints },
    { emoji: 'speech', value: stats.truths, label: t.profile.statTruths },
    { emoji: 'fire', value: stats.dares, label: t.profile.statDares },
    { emoji: 'seeNoEvil', value: stats.skipped, label: t.profile.statSkipped },
  ]
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-extrabold">{t.profile.stats}</h2>
      <ul aria-label={t.profile.stats} className="grid grid-cols-3 gap-2.5">
        {tiles.map((tile, i) => (
          <motion.li
            key={tile.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: i * 0.04 }}
            className="flex flex-col items-center gap-1 rounded-[22px] border border-line px-2 py-3.5 text-center"
          >
            <Emoji name={tile.emoji} size={30} />
            <span className="font-display text-[30px] leading-none tabular-nums">{tile.value}</span>
            <span className="text-xs font-bold text-muted">{tile.label}</span>
          </motion.li>
        ))}
      </ul>
      {stats.games === 0 ? <p className="text-sm text-muted">{t.profile.noStats}</p> : null}
    </section>
  )
}

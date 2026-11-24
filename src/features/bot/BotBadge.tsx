import { useT } from '@/i18n/useT'

/** Marks the game's built-in player, so nobody mistakes him for a person. */
export function BotBadge() {
  const t = useT()
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-truth px-1.5 py-px text-[10px] font-extrabold tracking-wide text-ivory">
      {t.bot.badge}
    </span>
  )
}

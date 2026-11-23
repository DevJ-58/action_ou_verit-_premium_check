import { useT } from '@/i18n/useT'

/** “● LIVE · 42 s” over a video. */
export function LiveBadge({ seconds }: { seconds: number }) {
  const t = useT()
  return (
    <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-dare px-3 py-1 text-xs font-extrabold tracking-[0.14em] text-ivory uppercase">
      <span aria-hidden="true" className="size-2 rounded-full bg-ivory motion-safe:animate-pulse" />
      {t.live.badge}
      <span className="tabular-nums" aria-live="off">
        · {seconds} s
      </span>
    </span>
  )
}

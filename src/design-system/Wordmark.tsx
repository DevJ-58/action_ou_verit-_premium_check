import { useT } from '@/i18n/useT'
import { LogoMark } from './LogoMark'

/** Logo and name side by side, for headers. */
export function Wordmark({ size = 34 }: { size?: number }) {
  const t = useT()
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-display text-[22px] leading-none whitespace-nowrap">
        {t.home.titleBefore} <em className="text-gold-text">{t.home.titleOr}</em>{' '}
        {t.home.titleAfter}
      </span>
    </span>
  )
}

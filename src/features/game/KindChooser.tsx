import type { ChallengeKind } from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'

export interface KindChooserProps {
  answerer: string
  /** Line under the title, e.g. who will set the dare. */
  subtitle: string
  onChoose(kind: ChallengeKind): void
}

/** The designated player picks Vérité or Action from two cards. */
export function KindChooser({ answerer, subtitle, onChoose }: KindChooserProps) {
  const t = useT()
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-[26px] font-extrabold tracking-[-0.02em]">
          {format(t.game.drawTitle, { name: answerer })}
        </p>
        <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>
      </div>
      <div className="flex gap-3.5">
        <button
          type="button"
          onClick={() => onChoose('truth')}
          className="relative h-30 flex-1 -rotate-3 rounded-2xl bg-truth font-display text-[32px] text-ivory shadow-soft active:scale-95"
        >
          <span
            aria-hidden="true"
            className="absolute inset-1.5 rounded-[11px] border border-[#e3b23c]"
          />
          {t.game.truth}
        </button>
        <button
          type="button"
          onClick={() => onChoose('dare')}
          className="relative h-30 flex-1 rotate-3 rounded-2xl bg-card-ivory font-display text-[32px] text-ink shadow-soft active:scale-95"
        >
          <span
            aria-hidden="true"
            className="absolute inset-1.5 rounded-[11px] border border-card-rim"
          />
          {t.game.dare}
        </button>
      </div>
    </div>
  )
}

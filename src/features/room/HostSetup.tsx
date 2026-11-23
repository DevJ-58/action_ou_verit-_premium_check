import { useState } from 'react'
import { Play } from 'lucide-react'
import { Button, Segmented } from '@/design-system'
import type { CategoryId, GameSettings } from '@/engine'
import { ReaderSetting } from '@/features/game/ReaderSetting'
import { PremiumCategoryGrid } from '@/features/premium/PremiumCategoryGrid'
import { PremiumSheet } from '@/features/premium/PremiumSheet'
import { PremiumBadge } from '@/features/premium/PremiumBadge'
import { PremiumMark } from '@/features/premium/PremiumMark'
import { useT } from '@/i18n/useT'
import type { RoomSetup } from './types'

export interface HostSetupProps {
  memberCount: number
  /** The host is Premium: unlocks Premium categories and live video for the room. */
  premium: boolean
  onStart(setup: RoomSetup): void
}

const ROUNDS = ['1', '3', '5', '10'] as const
const PROPOSE = ['30', '60', '90'] as const
const LIVE = ['0', '30', '60', '120'] as const

/** The host chooses categories and pace, then starts the game. */
export function HostSetup({ memberCount, premium, onStart }: HostSetupProps) {
  const t = useT()
  const [categories, setCategories] = useState<CategoryId[]>([])
  const [rounds, setRounds] = useState(3)
  const [proposeSeconds, setProposeSeconds] =
    useState<NonNullable<GameSettings['proposeSeconds']>>(60)
  const [liveSeconds, setLiveSeconds] = useState<NonNullable<GameSettings['liveSeconds']>>(60)
  const [liveLocked, setLiveLocked] = useState(false)
  const [readAloud, setReadAloud] = useState<NonNullable<GameSettings['readAloud']>>('female')
  const canStart = memberCount >= 2 && categories.length > 0

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-extrabold">{t.setup.categories}</h2>
      <PremiumCategoryGrid premium={premium} selected={categories} onChange={setCategories} />
      <Segmented
        label={t.setup.rounds}
        value={String(rounds)}
        options={ROUNDS.map((r) => ({ value: r, label: r }))}
        onChange={(v) => setRounds(Number(v))}
      />
      <Segmented
        label={t.room.proposeTime}
        value={String(proposeSeconds)}
        options={PROPOSE.map((s) => ({ value: s, label: `${s} s` }))}
        onChange={(v) => setProposeSeconds(Number(v) as 30 | 60 | 90)}
      />
      {premium ? (
        <Segmented
          label={t.live.setting}
          badge={<PremiumMark />}
          value={String(liveSeconds)}
          options={LIVE.map((s) => ({
            value: s,
            label: s === '0' ? t.live.off : s === '120' ? '2 min' : s === '60' ? '1 min' : `${s} s`,
          }))}
          onChange={(v) => setLiveSeconds(Number(v) as 0 | 30 | 60 | 120)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setLiveLocked(true)}
          className="flex min-h-14 items-center justify-between gap-3 rounded-[20px] border-[1.5px] border-line px-4 text-left font-semibold"
        >
          {t.live.setting}
          <PremiumBadge />
        </button>
      )}
      <PremiumSheet
        open={liveLocked}
        onClose={() => setLiveLocked(false)}
        reason={t.premium.lockedLive}
      />
      <ReaderSetting value={readAloud} onChange={setReadAloud} />
      {memberCount < 2 ? (
        <p className="text-sm font-semibold text-muted">{t.room.needTwo}</p>
      ) : null}
      <Button
        size="lg"
        disabled={!canStart}
        onClick={() =>
          onStart({
            categories,
            rounds,
            proposeSeconds,
            liveSeconds: premium ? liveSeconds : 0,
            readAloud,
          })
        }
      >
        <Play aria-hidden="true" size={20} />
        {t.setup.launch}
      </Button>
    </section>
  )
}

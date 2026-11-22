import { useState } from 'react'
import { Play } from 'lucide-react'
import { Button, Segmented } from '@/design-system'
import type { CategoryId, GameSettings } from '@/engine'
import { CategoryGrid } from '@/features/game-setup/CategoryGrid'
import { useT } from '@/i18n/useT'
import type { RoomSetup } from './types'

export interface HostSetupProps {
  memberCount: number
  onStart(setup: RoomSetup): void
}

const ROUNDS = ['1', '3', '5', '10'] as const
const PROPOSE = ['30', '60', '90'] as const

/** The host chooses categories and pace, then starts the game. */
export function HostSetup({ memberCount, onStart }: HostSetupProps) {
  const t = useT()
  const [categories, setCategories] = useState<CategoryId[]>([])
  const [rounds, setRounds] = useState(3)
  const [proposeSeconds, setProposeSeconds] =
    useState<NonNullable<GameSettings['proposeSeconds']>>(60)
  const canStart = memberCount >= 2 && categories.length > 0

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-extrabold">{t.setup.categories}</h2>
      <CategoryGrid selected={categories} onChange={setCategories} />
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
      {memberCount < 2 ? (
        <p className="text-sm font-semibold text-muted">{t.room.needTwo}</p>
      ) : null}
      <Button
        size="lg"
        disabled={!canStart}
        onClick={() => onStart({ categories, rounds, proposeSeconds })}
      >
        <Play aria-hidden="true" size={20} />
        {t.setup.launch}
      </Button>
    </section>
  )
}

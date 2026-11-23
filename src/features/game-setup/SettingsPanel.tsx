import { Segmented } from '@/design-system'
import { ReaderSetting } from '@/features/game/ReaderSetting'
import type { GameSettings } from '@/engine'
import { useT } from '@/i18n/useT'

export type SetupSettings = Omit<GameSettings, 'categories'>

export interface SettingsPanelProps {
  value: SetupSettings
  onChange(value: SetupSettings): void
}

const ROUNDS = ['1', '3', '5', '10'] as const
const TIMERS = ['0', '30', '60', '90'] as const
const SKIPS = ['0', '1', '3', '5'] as const

export function SettingsPanel({ value, onChange }: SettingsPanelProps) {
  const t = useT()
  const set = (patch: Partial<SetupSettings>) => onChange({ ...value, ...patch })
  return (
    <div className="flex flex-col gap-6">
      <Segmented
        label={t.setup.rounds}
        value={String(value.rounds)}
        options={ROUNDS.map((r) => ({ value: r, label: r }))}
        onChange={(v) => set({ rounds: Number(v) })}
      />
      <Segmented
        label={t.setup.timer}
        value={String(value.timerSeconds)}
        options={TIMERS.map((s) => ({ value: s, label: s === '0' ? t.setup.timerOff : `${s} s` }))}
        onChange={(v) => set({ timerSeconds: Number(v) as GameSettings['timerSeconds'] })}
      />
      <Segmented<GameSettings['source']>
        label={t.setup.source}
        value={value.source}
        options={(['system', 'custom', 'both'] as const).map((s) => ({
          value: s,
          label: t.setup.sources[s],
        }))}
        onChange={(source) => set({ source })}
      />
      <Segmented
        label={t.setup.skips}
        value={String(value.maxSkips)}
        options={SKIPS.map((s) => ({ value: s, label: s }))}
        onChange={(v) => set({ maxSkips: Number(v) })}
      />
      <Segmented<GameSettings['picker']>
        label={t.setup.picker}
        value={value.picker}
        options={(['bottle', 'random'] as const).map((p) => ({
          value: p,
          label: t.setup.pickers[p],
        }))}
        onChange={(picker) => set({ picker })}
      />
      <ReaderSetting
        value={value.readAloud ?? 'female'}
        onChange={(readAloud) => set({ readAloud })}
      />
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertTriangle, Play } from 'lucide-react'
import { Button, Screen } from '@/design-system'
import { MIN_PLAYERS, type CategoryId } from '@/engine'
import { gameStore } from '@/features/game/gameStore'
import { usePlayers } from '@/features/players/playersStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { CategoryGrid } from './CategoryGrid'
import { SeatOrder } from './SeatOrder'
import { SettingsPanel, type SetupSettings } from './SettingsPanel'
import { setupWarnings } from './setupWarnings'

const DEFAULTS: SetupSettings = {
  mode: 'nearby',
  source: 'both',
  rounds: 3,
  timerSeconds: 0,
  maxSkips: 3,
  picker: 'bottle',
}

/** Beyond this many players the light sweep reads better than the bottle. */
const RANDOM_PICKER_FROM = 9

export function SetupScreen() {
  const t = useT()
  const navigate = useNavigate()
  const players = usePlayers((s) => s.players)
  const [seated, setSeated] = useState(() => players.map((p) => p.id))
  const [categories, setCategories] = useState<CategoryId[]>([])
  const [settings, setSettings] = useState<SetupSettings>(DEFAULTS)
  const [pickerTouched, setPickerTouched] = useState(false)

  const table = seated.map((id) => players.find((p) => p.id === id)).filter((p) => p !== undefined)
  const picker = pickerTouched
    ? settings.picker
    : table.length >= RANDOM_PICKER_FROM
      ? 'random'
      : 'bottle'
  const warnings = setupWarnings(table, categories)
  const canLaunch = table.length >= MIN_PLAYERS && categories.length > 0

  return (
    <Screen title={t.setup.title} back={() => navigate('/')} backLabel={t.common.back}>
      <div className="flex flex-col gap-10 pt-4">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">{t.setup.players}</h2>
          <p className="text-sm text-muted">{t.setup.playersHint}</p>
          <SeatOrder players={players} seated={seated} onChange={setSeated} />
          {table.length < MIN_PLAYERS ? (
            <Button variant="ghost" onClick={() => navigate('/joueurs')}>
              {t.setup.needPlayers} · {t.players.add}
            </Button>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">{t.setup.categories}</h2>
          <CategoryGrid selected={categories} onChange={setCategories} />
          {warnings.map((w) => (
            <p
              key={w.playerId}
              role="status"
              className="flex gap-2 text-sm font-semibold text-dare"
            >
              <AlertTriangle aria-hidden="true" size={18} className="shrink-0" />
              {format(t.setup.warning, { name: table.find((p) => p.id === w.playerId)!.name })}
            </p>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">{t.setup.settings}</h2>
          <SettingsPanel
            value={{ ...settings, picker }}
            onChange={(next) => {
              if (next.picker !== picker) setPickerTouched(true)
              setSettings(next)
            }}
          />
        </section>

        <Button
          size="lg"
          disabled={!canLaunch}
          className="sticky bottom-4"
          onClick={() => {
            gameStore
              .getState()
              .start({ settings: { ...settings, picker, categories }, players: table })
            navigate('/partie')
          }}
        >
          <Play aria-hidden="true" size={20} />
          {t.setup.launch}
        </Button>
      </div>
    </Screen>
  )
}

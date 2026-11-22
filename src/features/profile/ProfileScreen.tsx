import { Screen, Segmented, Toggle } from '@/design-system'
import { settingsStore, useSettings, type Language } from '@/features/settings/settingsStore'
import { useT } from '@/i18n/useT'
import { ThemePicker } from './ThemePicker'

const LANGUAGES: ReadonlyArray<{ value: Language; label: string }> = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

export function ProfileScreen() {
  const t = useT()
  const theme = useSettings((s) => s.theme)
  const language = useSettings((s) => s.language)
  const sound = useSettings((s) => s.sound)
  const haptics = useSettings((s) => s.haptics)
  const actions = settingsStore.getState()

  return (
    <Screen title={t.profile.title}>
      <div className="flex flex-col gap-8 pt-4">
        <ThemePicker
          label={t.profile.theme}
          value={theme}
          names={t.profile.themes}
          onChange={actions.setTheme}
        />
        <Segmented
          label={t.profile.language}
          value={language}
          options={LANGUAGES}
          onChange={actions.setLanguage}
        />
        <div className="flex flex-col divide-y divide-line border-y border-line">
          <Toggle label={t.profile.sound} checked={sound} onChange={actions.setSound} />
          <Toggle label={t.profile.haptics} checked={haptics} onChange={actions.setHaptics} />
        </div>
      </div>
    </Screen>
  )
}

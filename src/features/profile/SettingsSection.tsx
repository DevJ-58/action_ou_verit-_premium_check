import { Segmented, Toggle } from '@/design-system'
import { settingsStore, useSettings, type Language } from '@/features/settings/settingsStore'
import { useT } from '@/i18n/useT'
import { ThemePicker } from './ThemePicker'

const LANGUAGES: ReadonlyArray<{ value: Language; label: string }> = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

/** Appearance, language, sounds and vibrations — available signed in or not. */
export function SettingsSection() {
  const t = useT()
  const theme = useSettings((s) => s.theme)
  const language = useSettings((s) => s.language)
  const sound = useSettings((s) => s.sound)
  const haptics = useSettings((s) => s.haptics)
  const actions = settingsStore.getState()
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-extrabold">{t.profile.appearance}</h2>
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
      <div className="flex flex-col divide-y divide-line rounded-[22px] border border-line px-4">
        <Toggle label={t.profile.sound} checked={sound} onChange={actions.setSound} />
        <Toggle label={t.profile.haptics} checked={haptics} onChange={actions.setHaptics} />
      </div>
    </section>
  )
}

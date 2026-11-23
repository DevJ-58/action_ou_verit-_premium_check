import { Segmented } from '@/design-system'
import { useT } from '@/i18n/useT'
import { settingsStore, useSettings, type Language } from './settingsStore'
import { SettingsGroup } from './SettingsGroup'
import { ThemePicker } from './ThemePicker'

const LANGUAGES: ReadonlyArray<{ value: Language; label: string }> = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

/** Theme and language. */
export function AppearanceSection() {
  const t = useT()
  const theme = useSettings((s) => s.theme)
  const language = useSettings((s) => s.language)
  const actions = settingsStore.getState()
  return (
    <SettingsGroup emoji="sparkles" title={t.settings.appearance}>
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
    </SettingsGroup>
  )
}

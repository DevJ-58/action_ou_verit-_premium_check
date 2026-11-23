import { Toggle } from '@/design-system'
import { useT } from '@/i18n/useT'
import { settingsStore, useSettings } from './settingsStore'
import { SettingsGroup } from './SettingsGroup'

/** Music, sound effects and vibrations. */
export function AudioSection() {
  const t = useT()
  const music = useSettings((s) => s.music)
  const sound = useSettings((s) => s.sound)
  const haptics = useSettings((s) => s.haptics)
  const actions = settingsStore.getState()
  return (
    <SettingsGroup emoji="party" title={t.settings.audio}>
      <div className="flex flex-col divide-y divide-line rounded-[22px] border border-line px-4">
        <Toggle label={t.settings.music} checked={music} onChange={actions.setMusic} />
        <Toggle label={t.profile.sound} checked={sound} onChange={actions.setSound} />
        <Toggle label={t.profile.haptics} checked={haptics} onChange={actions.setHaptics} />
      </div>
      <p className="text-sm text-muted">{t.settings.hapticsHint}</p>
    </SettingsGroup>
  )
}

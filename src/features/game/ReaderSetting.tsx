import { Segmented } from '@/design-system'
import type { GameSettings } from '@/engine'
import { useT } from '@/i18n/useT'

type Reader = NonNullable<GameSettings['readAloud']>

/** Host setting: read the turned card aloud, with a woman's or a man's voice. */
export function ReaderSetting({ value, onChange }: { value: Reader; onChange(v: Reader): void }) {
  const t = useT()
  return (
    <Segmented<Reader>
      label={t.reader.setting}
      value={value}
      options={(['off', 'female', 'male'] as const).map((v) => ({ value: v, label: t.reader[v] }))}
      onChange={onChange}
    />
  )
}

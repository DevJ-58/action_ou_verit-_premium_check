import { Screen } from '@/design-system'
import { useT } from '@/i18n/useT'

/** Placeholder for screens built in later steps of the plan. */
export function ComingSoonScreen() {
  const t = useT()
  return (
    <Screen>
      <p className="m-auto text-muted">{t.comingSoon}</p>
    </Screen>
  )
}

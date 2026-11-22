import { Screen } from '@/design-system'
import { useT } from '@/i18n/useT'

/** All custom dares of the players on this phone (filled in by the players feature). */
export function MyDaresScreen() {
  const t = useT()
  return (
    <Screen title={t.myDares.title}>
      <div className="m-auto max-w-xs text-center">
        <p className="text-lg font-semibold">{t.myDares.empty}</p>
        <p className="mt-2 text-muted">{t.myDares.emptyHint}</p>
      </div>
    </Screen>
  )
}

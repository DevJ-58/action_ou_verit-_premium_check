import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Button, KenteBand } from '@/design-system'
import { settingsStore, useSettings } from '@/features/settings/settingsStore'
import { useT } from '@/i18n/useT'

export function AgeGateScreen() {
  const t = useT()
  const navigate = useNavigate()
  const confirmed = useSettings((s) => s.ageConfirmedAt !== null)
  const [declined, setDeclined] = useState(false)

  if (confirmed) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <KenteBand />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pt-14 pb-8">
        <p className="text-xs font-extrabold tracking-[0.18em] text-gold-text uppercase">
          {t.ageGate.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-5xl leading-none">{t.ageGate.title}</h1>
        <p className="mt-5 text-base leading-relaxed text-muted">{t.ageGate.body}</p>

        {declined ? (
          <p
            role="status"
            className="mt-10 rounded-xl border border-line p-5 text-lg font-semibold"
          >
            {t.ageGate.declined}
          </p>
        ) : (
          <div className="mt-auto flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => {
                settingsStore.getState().confirmAge()
                navigate('/', { replace: true })
              }}
            >
              {t.ageGate.confirm}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setDeclined(true)}>
              {t.ageGate.decline}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

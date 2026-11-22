import { useNavigate } from 'react-router'
import { Button, KenteBand } from '@/design-system'
import { useT } from '@/i18n/useT'
import { resetLocalData } from './resetLocalData'

/** Shown instead of a blank page when a screen crashes. */
export function RootErrorScreen() {
  const t = useT()
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <KenteBand />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-6 pt-14 pb-8">
        <h1 className="font-display text-[40px] leading-none">{t.crash.title}</h1>
        <p className="text-base leading-relaxed text-muted">{t.crash.body}</p>
        <div className="mt-auto flex flex-col gap-3">
          <Button
            size="lg"
            onClick={async () => {
              await resetLocalData()
              navigate('/', { replace: true })
            }}
          >
            {t.crash.reset}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/', { replace: true })}>
            {t.crash.home}
          </Button>
        </div>
      </main>
    </div>
  )
}

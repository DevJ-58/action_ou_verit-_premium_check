import { useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Button, KenteBand } from '@/design-system'
import { hasResumableGame } from '@/features/game/resumable'
import { useT } from '@/i18n/useT'
import { CardFan } from './CardFan'

export function HomeScreen() {
  const t = useT()
  const navigate = useNavigate()
  const canResume = hasResumableGame()
  return (
    <div className="flex flex-1 flex-col pt-[env(safe-area-inset-top)]">
      <KenteBand />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <header className="flex items-center justify-between px-5 pt-4">
          <span className="font-display text-xl text-gold-text">A ◆ V</span>
          <span className="rounded-md border-[1.5px] border-gold-text px-2 py-0.5 text-xs font-extrabold tracking-[0.14em] text-gold-text">
            18+
          </span>
        </header>
        <div className="mt-3.5">
          <CardFan />
        </div>
        <div className="px-5">
          <h1 className="font-display text-[46px] leading-none">
            {t.home.titleBefore} <em className="text-gold-text">{t.home.titleOr}</em>{' '}
            {t.home.titleAfter}
          </h1>
          <p className="mt-2.5 text-base leading-normal text-muted">{t.home.tagline}</p>
        </div>
        <div className="mt-auto flex flex-col gap-2.5 px-5 pt-6 pb-5">
          {canResume ? (
            <Button variant="truth" size="lg" onClick={() => navigate('/partie')}>
              {t.home.resume}
            </Button>
          ) : null}
          <Button
            size="lg"
            className="justify-between"
            onClick={() => navigate('/partie/nouvelle')}
          >
            {t.home.newGame}
            <ArrowRight aria-hidden="true" size={22} />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="justify-between normal-case tracking-normal"
            disabled
          >
            {t.home.joinRoom}
            <span className="text-xs font-extrabold tracking-[0.14em] text-gold-text uppercase">
              {t.home.soon}
            </span>
          </Button>
        </div>
      </main>
    </div>
  )
}

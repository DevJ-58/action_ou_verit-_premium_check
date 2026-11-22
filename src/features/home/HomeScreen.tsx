import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Button, KenteBand, springs } from '@/design-system'
import { hasResumableGame } from '@/features/game/resumable'
import { useT } from '@/i18n/useT'
import { CardFan } from './CardFan'
import { EntryLink } from './EntryLink'

export function HomeScreen() {
  const t = useT()
  const navigate = useNavigate()
  const canResume = hasResumableGame()
  return (
    <div className="flex flex-1 flex-col pt-[env(safe-area-inset-top)]">
      <KenteBand />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col min-[900px]:max-w-5xl">
        <header className="flex items-center justify-between px-5 pt-4">
          <span className="font-display text-xl text-gold-text">A ◆ V</span>
          <span className="rounded-full border-[1.5px] border-gold-text px-2.5 py-0.5 text-xs font-extrabold tracking-[0.14em] text-gold-text">
            18+
          </span>
        </header>
        <div className="flex flex-1 flex-col min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:items-center min-[900px]:gap-12">
          <motion.div
            className="mt-3.5 px-2"
            initial={{ opacity: 0, y: 24, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={springs.bouncy}
          >
            <CardFan />
          </motion.div>
          <div className="flex flex-1 flex-col">
            <div className="px-5">
              <h1 className="font-display text-[clamp(38px,11vw,64px)] leading-none">
                {t.home.titleBefore} <em className="text-gold-text">{t.home.titleOr}</em>{' '}
                {t.home.titleAfter}
              </h1>
              <p className="mt-2.5 text-base leading-normal text-muted">{t.home.tagline}</p>
            </div>
            <div className="mt-auto flex flex-col gap-3 px-5 pt-6 pb-5 min-[900px]:mt-8">
              {canResume ? (
                <Button variant="truth" size="lg" onClick={() => navigate('/partie')}>
                  {t.home.resume}
                </Button>
              ) : null}
              <EntryLink
                to="/salon/nouveau"
                emoji="phone"
                title={t.room.create}
                hint={t.room.createHint}
                primary
              />
              <EntryLink
                to="/salon/rejoindre"
                emoji="link"
                title={t.room.join}
                hint={t.room.joinHint}
              />
              <EntryLink
                to="/partie/nouvelle"
                emoji="dice"
                title={t.room.playHere}
                hint={t.room.playHereHint}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

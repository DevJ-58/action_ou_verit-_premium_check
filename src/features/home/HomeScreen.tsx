import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Button, KenteBand, springs, Wordmark } from '@/design-system'
import { hasResumableGame } from '@/features/game/resumable'
import { TourButton } from '@/features/guide/TourButton'
import { useAutoTour } from '@/features/guide/useAutoTour'
import { InstallCard } from '@/features/install/InstallCard'
import { TrialNotice } from '@/features/premium/TrialNotice'
import { useT } from '@/i18n/useT'
import { EntryLink } from './EntryLink'
import { HomeTable } from './HomeTable'

export function HomeScreen() {
  const t = useT()
  const navigate = useNavigate()
  const canResume = hasResumableGame()
  useAutoTour('home')
  return (
    <div className="flex flex-1 flex-col pt-[env(safe-area-inset-top)]">
      <KenteBand />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 min-[900px]:max-w-5xl">
        <header className="flex items-center justify-between pt-4">
          <Wordmark />
          <div className="flex shrink-0 items-center gap-1.5">
            <TourButton name="home" className="size-9" />
            <span className="rounded-full border-[1.5px] border-gold-text px-2.5 py-0.5 text-xs font-extrabold tracking-[0.14em] text-gold-text">
              18+
            </span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 pt-2 min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:items-center min-[900px]:gap-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={springs.gentle}
            className="px-4 min-[900px]:px-0"
          >
            <HomeTable />
          </motion.div>
          <div className="flex flex-1 flex-col gap-5 pb-5">
            <div>
              <p className="text-xs font-extrabold tracking-[0.18em] text-gold-text uppercase [@media(max-height:640px)]:hidden">
                {t.home.eyebrow}
              </p>
              <h1 className="mt-2 font-display text-[clamp(44px,13vw,76px)] leading-[0.92] [@media(max-height:720px)]:text-[clamp(34px,10vw,48px)]">
                {t.home.titleBefore} <em className="text-gold-text">{t.home.titleOr}</em>
                <br />
                {t.home.titleAfter}
              </h1>
              <p className="mt-3 max-w-md text-base leading-normal text-muted [@media(max-height:720px)]:text-sm">
                {t.home.tagline}
              </p>
            </div>
            <div className="mt-auto flex flex-col gap-3 min-[900px]:mt-2">
              <TrialNotice />
              {canResume ? (
                <Button variant="truth" size="lg" onClick={() => navigate('/partie')}>
                  {t.home.resume}
                </Button>
              ) : null}
              <EntryLink
                to="/salon/nouveau"
                tour="create-room"
                emoji="phone"
                title={t.room.create}
                hint={t.room.createHint}
                primary
              />
              <div className="grid grid-cols-2 gap-3">
                <EntryLink
                  to="/salon/rejoindre"
                  tour="join-room"
                  emoji="link"
                  title={t.room.join}
                  hint={t.room.joinHint}
                  compact
                />
                <EntryLink
                  to="/partie/nouvelle"
                  tour="play-here"
                  emoji="dice"
                  title={t.room.playHere}
                  hint={t.room.playHereHint}
                  compact
                />
              </div>
              <Link
                to="/regles"
                data-tour="rules"
                className="self-center rounded-full px-4 py-2 text-sm font-bold text-gold-text underline underline-offset-4"
              >
                {t.rules.title}
              </Link>
              <InstallCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

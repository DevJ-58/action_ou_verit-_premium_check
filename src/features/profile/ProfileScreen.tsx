import { useEffect } from 'react'
import { Link } from 'react-router'
import { ChevronRight, Settings } from 'lucide-react'
import { Avatar, Emoji, Screen } from '@/design-system'
import { accountStore, useAccount } from '@/features/account/accountStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { StatsGrid } from './StatsGrid'

/** The player's space: who they are, their stats, their dares. Settings live behind the gear. */
export function ProfileScreen() {
  const t = useT()
  const status = useAccount((s) => s.status)
  const profile = useAccount((s) => s.session?.profile ?? null)

  useEffect(() => {
    if (status === 'loading') void accountStore.getState().init()
  }, [status])

  const gear = (
    <Link
      to="/reglages"
      aria-label={t.settings.title}
      className="grid size-12 place-items-center rounded-full border-[1.5px] border-line text-text"
    >
      <Settings aria-hidden="true" size={20} />
    </Link>
  )

  return (
    <Screen title={t.profile.title} actions={gear}>
      {profile ? (
        <div className="grid gap-8 pt-4 min-[900px]:grid-cols-2 min-[900px]:gap-x-12">
          <header className="flex flex-col items-center gap-3 rounded-[32px] border border-line px-6 py-8 text-center">
            <Avatar name={profile.pseudo} avatarId={profile.avatarId} size="xl" />
            <h2 className="font-display text-[40px] leading-none">{profile.pseudo}</h2>
            {profile.bio ? <p className="max-w-xs text-muted">{profile.bio}</p> : null}
          </header>
          <div className="flex flex-col gap-8">
            <StatsGrid stats={profile.stats} />
            <Link
              to="/defis"
              className="flex min-h-16 items-center gap-3 rounded-[22px] border border-line px-4"
            >
              <Emoji name="loveLetter" size={36} />
              <span className="flex-1">
                <span className="block font-extrabold">{t.nav.dares}</span>
                <span className="block text-sm text-muted">
                  {format(t.profile.daresCount, { count: profile.customDares.length })}
                </span>
              </span>
              <ChevronRight aria-hidden="true" size={20} className="text-muted" />
            </Link>
          </div>
        </div>
      ) : (
        <section className="mt-4 flex flex-col items-center gap-4 rounded-[32px] border border-line p-8 text-center">
          <Emoji name="sparkles" size={64} />
          <h2 className="font-display text-[34px] leading-none">{t.profile.signedOutTitle}</h2>
          <p className="max-w-xs text-muted">{t.profile.signedOutBody}</p>
          <Link
            to="/compte?next=%2Fprofil"
            className="mt-2 inline-flex min-h-14 items-center rounded-full bg-gold px-6 font-extrabold text-on-gold"
          >
            {t.profile.signedOutCta}
          </Link>
        </section>
      )}
    </Screen>
  )
}

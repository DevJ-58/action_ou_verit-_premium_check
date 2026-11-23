import { useEffect } from 'react'
import { Link } from 'react-router'
import { Emoji, Screen } from '@/design-system'
import { accountStore, useAccount } from '@/features/account/accountStore'
import { useT } from '@/i18n/useT'
import { AccountLibrary } from './AccountLibrary'
import { LocalPlayersDares } from './LocalPlayersDares'

/** “My dares”: the account library, plus the dares of players on this phone. */
export function MyDaresScreen() {
  const t = useT()
  const status = useAccount((s) => s.status)
  const profile = useAccount((s) => s.session?.profile ?? null)

  useEffect(() => {
    if (status === 'loading') void accountStore.getState().init()
  }, [status])

  return (
    <Screen title={t.myDares.title}>
      <div className="flex flex-col gap-10 pt-2">
        {profile ? (
          <AccountLibrary profile={profile} />
        ) : (
          <section className="flex flex-col items-center gap-3 rounded-[32px] border border-line p-8 text-center">
            <Emoji name="loveLetter" size={64} />
            <h2 className="font-display text-[30px] leading-none">{t.myDares.signInTitle}</h2>
            <p className="max-w-xs text-muted">{t.myDares.signInBody}</p>
            <Link
              to="/compte?next=%2Fdefis"
              className="mt-2 inline-flex min-h-14 items-center rounded-full bg-gold px-6 font-extrabold text-on-gold"
            >
              {t.myDares.signInCta}
            </Link>
          </section>
        )}
        <LocalPlayersDares />
      </div>
    </Screen>
  )
}

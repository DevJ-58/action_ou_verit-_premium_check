import { useEffect } from 'react'
import { Link } from 'react-router'
import { LogOut } from 'lucide-react'
import { Avatar, Button, Emoji, Screen } from '@/design-system'
import { accountStore, useAccount } from '@/features/account/accountStore'
import { LimitsEditor } from '@/features/players/LimitsEditor'
import { useT } from '@/i18n/useT'
import { AvatarGallery } from './AvatarGallery'
import { BioField } from './BioField'
import { ProfileDares } from './ProfileDares'
import { SettingsSection } from './SettingsSection'

export function ProfileScreen() {
  const t = useT()
  const status = useAccount((s) => s.status)
  const profile = useAccount((s) => s.session?.profile ?? null)
  const store = accountStore.getState()

  useEffect(() => {
    if (status === 'loading') void accountStore.getState().init()
  }, [status])

  return (
    <Screen>
      <div className="grid gap-10 pt-4 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[900px]:gap-x-12">
        {profile ? (
          <div className="flex flex-col gap-10">
            <header className="flex flex-col items-center gap-3 text-center">
              <Avatar name={profile.pseudo} avatarId={profile.avatarId} size="xl" />
              <h1 className="font-display text-[40px] leading-none">{profile.pseudo}</h1>
              {profile.bio ? <p className="max-w-xs text-muted">{profile.bio}</p> : null}
            </header>
            <AvatarGallery
              label={t.profile.avatar}
              value={profile.avatarId}
              onChange={(avatarId) => void store.updateProfile({ avatarId })}
            />
            <BioField
              label={t.profile.bio}
              placeholder={t.profile.bioPlaceholder}
              value={profile.bio}
              onSave={(bio) => void store.updateProfile({ bio })}
            />
            <LimitsEditor
              limits={profile.limits}
              onChange={(limits) => void store.updateProfile({ limits })}
            />
            <ProfileDares
              ownerId={profile.id}
              dares={profile.customDares}
              onChange={(customDares) => void store.updateProfile({ customDares })}
            />
          </div>
        ) : (
          <section className="flex flex-col items-center gap-4 rounded-[32px] border border-line p-8 text-center">
            <Emoji name="sparkles" size={64} />
            <h1 className="font-display text-[34px] leading-none">{t.profile.signedOutTitle}</h1>
            <p className="max-w-xs text-muted">{t.profile.signedOutBody}</p>
            <Link
              to="/compte?next=%2Fprofil"
              className="mt-2 inline-flex min-h-14 items-center rounded-full bg-gold px-6 font-extrabold text-on-gold"
            >
              {t.profile.signedOutCta}
            </Link>
          </section>
        )}
        <div className="flex flex-col gap-10">
          <SettingsSection />
          {profile ? (
            <Button variant="ghost" onClick={() => void store.signOut()}>
              <LogOut aria-hidden="true" size={18} />
              {t.account.signOut}
            </Button>
          ) : null}
        </div>
      </div>
    </Screen>
  )
}

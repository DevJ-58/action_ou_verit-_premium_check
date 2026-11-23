import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
import { Button, Screen } from '@/design-system'
import { accountStore, useAccount } from '@/features/account/accountStore'
import { LimitsEditor } from '@/features/players/LimitsEditor'
import { PremiumSheet } from '@/features/premium/PremiumSheet'
import { usePremium } from '@/features/premium/usePremium'
import { useT } from '@/i18n/useT'
import { AppearanceSection } from './AppearanceSection'
import { AudioSection } from './AudioSection'
import { AvatarGallery } from './AvatarGallery'
import { BioField } from './BioField'
import { PseudoField } from './PseudoField'
import { SettingsGroup } from './SettingsGroup'

/** Everything the player can tune: their look, limits, appearance, audio, account. */
export function SettingsScreen() {
  const t = useT()
  const navigate = useNavigate()
  const status = useAccount((s) => s.status)
  const profile = useAccount((s) => s.session?.profile ?? null)
  const store = accountStore.getState()
  const premium = usePremium()
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (status === 'loading') void accountStore.getState().init()
  }, [status])

  return (
    <Screen
      wide
      title={t.settings.title}
      back={() => navigate('/profil')}
      backLabel={t.common.back}
    >
      <div className="grid gap-10 pt-4 min-[900px]:grid-cols-2 min-[900px]:gap-x-12">
        {profile ? (
          <div className="flex flex-col gap-10">
            <SettingsGroup emoji="masks" title={t.settings.me}>
              <AvatarGallery
                label={t.profile.avatar}
                value={profile.avatarId}
                onChange={(avatarId) => void store.updateProfile({ avatarId })}
                premium={premium}
                onLocked={() => setLocked(true)}
              />
              <PremiumSheet
                open={locked}
                onClose={() => setLocked(false)}
                reason={t.premium.lockedLook}
              />
              <PseudoField
                value={profile.pseudo}
                onSave={(pseudo) => void store.updateProfile({ pseudo })}
              />
              <BioField
                label={t.profile.bio}
                placeholder={t.profile.bioPlaceholder}
                value={profile.bio}
                onSave={(bio) => void store.updateProfile({ bio })}
              />
            </SettingsGroup>
            <LimitsEditor
              limits={profile.limits}
              onChange={(limits) => void store.updateProfile({ limits })}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-10">
          <AppearanceSection />
          <AudioSection />
          {profile ? (
            <Button
              variant="ghost"
              onClick={async () => {
                await store.signOut()
                navigate('/profil', { replace: true })
              }}
            >
              <LogOut aria-hidden="true" size={18} />
              {t.account.signOut}
            </Button>
          ) : null}
        </div>
      </div>
    </Screen>
  )
}

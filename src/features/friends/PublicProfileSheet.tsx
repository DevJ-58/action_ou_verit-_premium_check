import { useEffect, useState } from 'react'
import { Avatar, Sheet } from '@/design-system'
import { AXIS_AVATAR, isBot } from '@/content/axis'
import { BotBadge } from '@/features/bot/BotBadge'
import { StatsGrid } from '@/features/profile/StatsGrid'
import { useT } from '@/i18n/useT'
import { AddFriendButton } from './AddFriendButton'
import { getSocial } from './getSocial'
import { closeProfile, useViewedProfile } from './profileViewer'
import type { PublicProfile } from './social'

/** Another player's public profile: avatar, pseudo, bio, stats. Nothing can be changed here. */
export function PublicProfileSheet() {
  const t = useT()
  const id = useViewedProfile()
  const [loaded, setLoaded] = useState<{ id: string; profile: PublicProfile | null } | null>(null)

  useEffect(() => {
    if (!id || isBot(id)) return
    let alive = true
    void getSocial()
      .publicProfile(id)
      .then((profile) => alive && setLoaded({ id, profile }))
      .catch(() => alive && setLoaded({ id, profile: null }))
    return () => {
      alive = false
    }
  }, [id])

  const profile = loaded?.id === id ? loaded.profile : undefined
  if (id && isBot(id)) {
    return (
      <Sheet open onClose={closeProfile} title="Axis">
        <header className="flex flex-col items-center gap-3 pb-4 text-center">
          <Avatar name="Axis" avatarId={AXIS_AVATAR} size="xl" />
          <h3 className="flex items-center gap-2 font-display text-[34px] leading-none">
            Axis <BotBadge />
          </h3>
          <p className="max-w-xs text-muted">{t.bot.bio}</p>
        </header>
      </Sheet>
    )
  }
  return (
    <Sheet open={id !== null} onClose={closeProfile} title={profile?.pseudo ?? t.profile.title}>
      {profile === undefined ? (
        <p role="status" className="py-8 text-center text-muted">
          {t.friends.profileLoading}
        </p>
      ) : profile === null ? (
        <p className="py-8 text-center text-muted">{t.friends.profileMissing}</p>
      ) : (
        <div className="flex flex-col gap-6 pb-2">
          <header className="flex flex-col items-center gap-2 text-center">
            <Avatar name={profile.pseudo} avatarId={profile.avatarId} size="xl" />
            <h3 className="font-display text-[34px] leading-none">{profile.pseudo}</h3>
            {profile.bio ? <p className="max-w-xs text-muted">{profile.bio}</p> : null}
            <AddFriendButton
              person={{ id: profile.id, pseudo: profile.pseudo, avatarId: profile.avatarId }}
            />
          </header>
          <StatsGrid stats={{ ...profile.stats, gameIds: [] }} own={false} />
        </div>
      )}
    </Sheet>
  )
}

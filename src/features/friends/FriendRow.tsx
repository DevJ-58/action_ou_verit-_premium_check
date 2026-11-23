import { useState } from 'react'
import { Send, Smartphone, UserMinus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Avatar, IconButton } from '@/design-system'
import { accountStore } from '@/features/account/accountStore'
import { playersStore } from '@/features/players/playersStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import type { Friend } from './friends'
import { getSocial } from './getSocial'
import { inviteFriend } from './inviteFriend'
import { openProfile } from './profileViewer'

export interface FriendRowProps {
  friend: Friend
  online: boolean
  seated: boolean
}

/** A friend: tap for their profile; invite them into a room; seat them on this phone; remove. */
export function FriendRow({ friend, online, seated }: FriendRowProps) {
  const t = useT()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  return (
    <li
      aria-label={friend.pseudo}
      className="flex items-center gap-2 rounded-[20px] border border-line p-2"
    >
      <button
        type="button"
        aria-label={format(t.friends.seeProfile, { name: friend.pseudo })}
        onClick={() => openProfile(friend.id)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[16px] p-0.5 text-left"
      >
        <span className="relative shrink-0">
          <Avatar name={friend.pseudo} avatarId={friend.avatarId} size="sm" />
          <span
            aria-hidden="true"
            className={cn(
              'absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-bg',
              online ? 'bg-[#3aa57a]' : 'bg-muted',
            )}
          />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold">{friend.pseudo}</span>
          <span
            className={cn('block text-xs font-semibold', online ? 'text-[#3aa57a]' : 'text-muted')}
          >
            {online ? t.friends.online : t.friends.offline}
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-label={format(t.friends.inviteTo, { name: friend.pseudo })}
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          const code = await inviteFriend(friend)
          setBusy(false)
          if (code) navigate(`/salon/${code}`)
        }}
        className="flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-3.5 text-sm font-extrabold text-on-gold disabled:opacity-60"
      >
        <Send aria-hidden="true" size={15} />
        {t.friends.send}
      </button>
      {seated ? null : (
        <IconButton
          label={format(t.friends.toPhone, { name: friend.pseudo })}
          icon={<Smartphone size={17} />}
          onClick={() =>
            playersStore.getState().addPlayer({ name: friend.pseudo, avatar: friend.avatarId })
          }
        />
      )}
      <IconButton
        label={format(t.friends.remove, { name: friend.pseudo })}
        icon={<UserMinus size={17} />}
        onClick={() =>
          void getSocial()
            .removeFriend(friend.id)
            .then(() => accountStore.getState().reloadProfile())
        }
      />
    </li>
  )
}

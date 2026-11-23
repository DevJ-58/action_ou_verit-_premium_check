import { Check, UserPlus } from 'lucide-react'
import { accountStore, useAccount } from '@/features/account/accountStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import type { Friend } from './friends'

/** “+” on another player's card: keeps them as a friend; shows “Friend” once done. */
export function AddFriendButton({ person }: { person: Friend }) {
  const t = useT()
  const selfId = useAccount((s) => s.session?.profile.id)
  const isFriend = useAccount((s) => s.session?.profile.friends.some((f) => f.id === person.id))
  if (!selfId || selfId === person.id) return null
  if (isFriend) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-extrabold tracking-[0.12em] text-gold-text uppercase">
        <Check aria-hidden="true" size={12} />
        {t.friends.friend}
      </span>
    )
  }
  return (
    <button
      type="button"
      aria-label={format(t.friends.add, { name: person.pseudo })}
      onClick={() => void accountStore.getState().addFriend(person)}
      className="flex min-h-9 items-center gap-1 rounded-full border-[1.5px] border-gold px-2.5 text-xs font-extrabold text-gold-text"
    >
      <UserPlus aria-hidden="true" size={14} />
      {t.friends.friend}
    </button>
  )
}

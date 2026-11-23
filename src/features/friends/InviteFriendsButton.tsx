import { useState } from 'react'
import { Send, UsersRound } from 'lucide-react'
import { Avatar, Button, Sheet } from '@/design-system'
import { useAccount } from '@/features/account/accountStore'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { inviteSender } from './myInvites'

export interface InviteFriendsButtonProps {
  code: string
  memberIds: string[]
}

/** In the waiting room: invite friends who are not here yet, live. */
export function InviteFriendsButton({ code, memberIds }: InviteFriendsButtonProps) {
  const t = useT()
  const profile = useAccount((s) => s.session?.profile ?? null)
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState<string[]>([])
  if (!profile) return null
  const friends = profile.friends.filter((f) => !memberIds.includes(f.id))

  async function invite(id: string) {
    if (!profile) return
    const ok = await inviteSender(profile.id).getState().send({
      code,
      fromId: profile.id,
      fromPseudo: profile.pseudo,
      fromAvatar: profile.avatarId,
      toId: id,
    })
    if (ok) setSent((list) => [...list, id])
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <UsersRound aria-hidden="true" size={18} />
        {t.friends.invite}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t.friends.inviteTitle}>
        {friends.length === 0 ? (
          <p className="py-6 text-center text-muted">{t.friends.noneToInvite}</p>
        ) : (
          <ul className="flex max-h-[55dvh] flex-col gap-2 overflow-y-auto">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-[20px] border border-line p-2.5"
              >
                <Avatar name={f.pseudo} avatarId={f.avatarId} size="sm" />
                <span className="flex-1 truncate font-bold">{f.pseudo}</span>
                {sent.includes(f.id) ? (
                  <span className="px-3 text-sm font-extrabold text-gold-text">
                    {t.friends.invited}
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={format(t.friends.inviteOne, { name: f.pseudo })}
                    onClick={() => void invite(f.id)}
                    className="flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-extrabold text-on-gold"
                  >
                    <Send aria-hidden="true" size={15} />
                    {t.friends.send}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  )
}

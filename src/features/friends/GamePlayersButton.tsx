import { useState } from 'react'
import { UsersRound } from 'lucide-react'
import { Avatar, Sheet } from '@/design-system'
import type { Member } from '@/features/room/types'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { cn } from '@/lib/cn'
import { AddFriendButton } from './AddFriendButton'
import { closeProfile, openProfile } from './profileViewer'

export interface GamePlayersButtonProps {
  members: Member[]
  selfId: string
  online: ReadonlySet<string>
}

/** Header button: the players of this game, each with their profile and “+ Ami”. */
export function GamePlayersButton({ members, selfId, online }: GamePlayersButtonProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-label={t.friends.gamePlayers}
        onClick={() => {
          closeProfile()
          setOpen(true)
        }}
        className="grid size-12 place-items-center rounded-full border-[1.5px] border-line text-text active:scale-95"
      >
        <UsersRound aria-hidden="true" size={20} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t.friends.gamePlayers}>
        <ul className="flex max-h-[60dvh] flex-col gap-2 overflow-y-auto pb-1">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-[20px] border border-line p-2"
            >
              <button
                type="button"
                aria-label={format(t.friends.seeProfile, { name: m.pseudo })}
                onClick={() => {
                  setOpen(false)
                  openProfile(m.id)
                }}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-[16px] text-left"
              >
                <span className="relative shrink-0">
                  <Avatar name={m.pseudo} avatarId={m.avatarId} size="sm" />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-bg',
                      online.has(m.id) ? 'bg-[#3aa57a]' : 'bg-muted',
                    )}
                  />
                </span>
                <span className="truncate font-bold">
                  {m.pseudo}
                  {m.id === selfId ? (
                    <span className="font-semibold text-muted"> · {t.room.you}</span>
                  ) : null}
                </span>
              </button>
              <AddFriendButton person={{ id: m.id, pseudo: m.pseudo, avatarId: m.avatarId }} />
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  )
}

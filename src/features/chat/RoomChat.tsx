import { useState } from 'react'
import type { Member } from '@/features/room/types'
import { ChatButton } from './ChatButton'
import { ChatPanel } from './ChatPanel'
import type { ChatStore } from './chatStore'

export interface RoomChatProps {
  store: ChatStore
  members: Member[]
  selfId: string
  premiumLocked?: boolean
}

/** The chat button of a room screen and its panel. */
export function RoomChat({ store, members, selfId, premiumLocked = false }: RoomChatProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ChatButton store={store} onOpen={() => setOpen(true)} />
      <ChatPanel
        store={store}
        members={members}
        selfId={selfId}
        open={open}
        onClose={() => setOpen(false)}
        premiumLocked={premiumLocked}
      />
    </>
  )
}

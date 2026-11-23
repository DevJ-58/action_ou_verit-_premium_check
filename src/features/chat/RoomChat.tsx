import { useState } from 'react'
import type { Member } from '@/features/room/types'
import { ChatButton } from './ChatButton'
import { ChatPanel } from './ChatPanel'
import type { ChatStore } from './chatStore'

export interface RoomChatProps {
  store: ChatStore
  members: Member[]
  selfId: string
  voiceLocked?: boolean
}

/** The chat button of a room screen and its panel. */
export function RoomChat({ store, members, selfId, voiceLocked = false }: RoomChatProps) {
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
        voiceLocked={voiceLocked}
      />
    </>
  )
}

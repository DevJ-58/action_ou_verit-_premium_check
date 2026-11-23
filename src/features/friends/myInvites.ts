import { useEffect } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { accountStore, useAccount } from '@/features/account/accountStore'
import { feedback } from '@/lib/feedback'
import { getInviteTransport } from './getInviteTransport'
import { createInviteStore, type InviteStore } from './inviteStore'
import type { Invite } from './invites'

const holder = createStore<{
  id: string | null
  store: InviteStore | null
  stop: (() => void) | null
}>()(() => ({ id: null, store: null, stop: null }))
const empty = createStore<{ invites: Invite[] }>()(() => ({ invites: [] }))

function storeFor(selfId: string): InviteStore {
  const current = holder.getState()
  if (current.id === selfId && current.store) return current.store
  current.stop?.()
  const store = createInviteStore({
    transport: getInviteTransport(),
    selfId,
    onIncoming: () => feedback.yourTurn(),
  })
  holder.setState({ id: selfId, store, stop: null })
  void store
    .getState()
    .connect()
    .then((stop) => {
      if (holder.getState().store === store) holder.setState({ stop })
      else stop()
    })
  return store
}

/** Invitations waiting for the signed-in player (live), plus a way to dismiss them. */
export function useMyInvites(): { invites: Invite[]; dismiss(invite: Invite): void } {
  const selfId = useAccount((s) => s.session?.account.id ?? null)
  const status = useAccount((s) => s.status)
  useEffect(() => {
    // The home screen may be the first one opened: know who is signed in to fetch invitations.
    if (status === 'loading') void accountStore.getState().init()
  }, [status])
  useEffect(() => {
    if (selfId) storeFor(selfId)
  }, [selfId])
  const store = useStore(holder, (s) => (selfId && s.id === selfId ? s.store : null))
  const invites = useStore((store ?? empty) as typeof empty, (s) => s.invites)
  return { invites, dismiss: (invite) => void store?.getState().dismiss(invite) }
}

/** Sends an invitation as the signed-in player. */
export function inviteSender(selfId: string): InviteStore {
  return storeFor(selfId)
}

/** Test seam. */
export function resetMyInvites(): void {
  holder.getState().stop?.()
  holder.setState({ id: null, store: null, stop: null })
}

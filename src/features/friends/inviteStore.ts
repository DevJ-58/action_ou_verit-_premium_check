import { createStore } from 'zustand/vanilla'
import type { Invite, InviteTransport } from './invites'

export interface InviteState {
  invites: Invite[]
  connect(): Promise<() => void>
  send(invite: Omit<Invite, 'id' | 'at'>): Promise<boolean>
  dismiss(invite: Invite): Promise<void>
}

export type InviteStore = ReturnType<typeof createInviteStore>

/** Keeps one invitation per room (the newest). */
function merge(list: Invite[], invite: Invite): Invite[] {
  return [invite, ...list.filter((i) => i.code !== invite.code)].sort((a, b) => b.at - a.at)
}

/** Invitations waiting for this player, live. */
export function createInviteStore(input: {
  transport: InviteTransport
  selfId: string
  onIncoming?(invite: Invite): void
}) {
  const { transport, selfId, onIncoming } = input
  return createStore<InviteState>()((set, get) => ({
    invites: [],
    connect: async () => {
      const off = transport.onInvite(selfId, (invite) => {
        set({ invites: merge(get().invites, invite) })
        onIncoming?.(invite)
      })
      const earlier = await transport.pending(selfId).catch(() => [])
      set({ invites: earlier.reduce((list, i) => merge(list, i), get().invites) })
      return off
    },
    send: async (invite) => {
      try {
        await transport.send(invite)
        return true
      } catch {
        return false
      }
    },
    dismiss: async (invite) => {
      set({ invites: get().invites.filter((i) => i.code !== invite.code) })
      await transport.dismiss(invite).catch(() => {})
    },
  }))
}

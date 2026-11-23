import { useEffect } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { accountStore, useAccount } from '@/features/account/accountStore'
import { createBroadcastBus } from '@/features/room/bus'
import { getSupabase, supabaseConfig } from '@/lib/backend'
import { feedback } from '@/lib/feedback'
import { getSocial } from './getSocial'
import { createLocalPresence, createSupabasePresence, type PresenceService } from './presence'
import type { FriendRequest } from './social'

interface Hub {
  selfId: string | null
  requests: FriendRequest[]
  online: ReadonlySet<string>
}

export const socialHub = createStore<Hub>()(() => ({
  selfId: null,
  requests: [],
  online: new Set(),
}))

let presence: PresenceService | null = null
function getPresence(): PresenceService {
  if (!presence) {
    const config = supabaseConfig()
    presence = config
      ? createSupabasePresence(() => getSupabase(config))
      : createLocalPresence(createBroadcastBus())
  }
  return presence
}

/** Test seam. */
export function setPresence(next: PresenceService | null): void {
  presence = next
}

/** Re-reads pending requests (and the friends list, which may have changed). */
export async function refreshSocial(): Promise<void> {
  const before = socialHub.getState().requests
  const requests = await getSocial().requests()
  const selfId = socialHub.getState().selfId
  const fresh = requests.some((r) => r.toId === selfId && !before.some((b) => b.id === r.id))
  socialHub.setState({ requests })
  if (fresh) feedback.message()
  await accountStore.getState().reloadProfile()
}

/** While signed in: announce this player online, follow friends' presence and requests. */
export function useSocialBoot(): void {
  const selfId = useAccount((s) => s.session?.account.id ?? null)
  useEffect(() => {
    if (!selfId) return
    socialHub.setState({ selfId, requests: [] })
    const service = getPresence()
    const leave = service.track(selfId)
    const offOnline = service.onOnline((online) => socialHub.setState({ online }))
    const offChange = getSocial().onChange(() => void refreshSocial())
    void refreshSocial()
    return () => {
      leave()
      offOnline()
      offChange()
      socialHub.setState({ selfId: null, requests: [], online: new Set() })
    }
  }, [selfId])
}

export function useSocial<T>(selector: (hub: Hub) => T): T {
  return useStore(socialHub, selector)
}

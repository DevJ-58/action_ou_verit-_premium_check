import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { Profile } from '@/features/account/authService'
import { createBroadcastBus } from './bus'
import { getSupabase, supabaseConfig } from '@/lib/backend'
import { createLocalTransport, type RoomTransport } from './localTransport'
import { createSupabaseTransport } from './supabaseTransport'
import { createRoomStore, type RoomStore, type RoomStoreState } from './roomStore'
import type { Member } from './types'

let transport: RoomTransport | null = null

/** The room network: Supabase Realtime when configured; otherwise tabs of this browser. */
export function getRoomTransport(): RoomTransport {
  if (!transport) {
    const config = supabaseConfig()
    transport = config
      ? createSupabaseTransport(() => getSupabase(config))
      : createLocalTransport(createBroadcastBus())
  }
  return transport
}

/** Test seam. */
export function setRoomTransport(next: RoomTransport): void {
  transport = next
}

export function memberFromProfile(profile: Profile): Member {
  return {
    id: profile.id,
    pseudo: profile.pseudo,
    avatarId: profile.avatarId,
    limits: profile.limits,
    customDares: profile.customDares,
  }
}

const holder = createStore<{ store: RoomStore | null }>()(() => ({ store: null }))

/** The room this phone is in (one at a time). */
export function openRoomStore(self: Member): RoomStore {
  holder.getState().store?.getState().leave()
  const store = createRoomStore({ transport: getRoomTransport(), self, rng: Math.random })
  holder.setState({ store })
  return store
}

export function activeRoomStore(): RoomStore | null {
  return holder.getState().store
}

export function resetActiveRoom(): void {
  holder.setState({ store: null })
}

const empty = createStore<RoomStoreState | null>()(() => null)

/** Reads the active room store (null when not in a room). */
export function useActiveRoom<T>(selector: (state: RoomStoreState | null) => T): T {
  const store = useStore(holder, (s) => s.store)
  return useStore((store ?? empty) as typeof empty, selector as (s: RoomStoreState | null) => T)
}

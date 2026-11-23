import { accountStore } from '@/features/account/accountStore'
import { isPremium } from '@/features/premium/premium'
import { activeRoomStore, memberFromProfile, openRoomStore } from './activeRoom'
import type { RoomError } from './types'

/** Joins `code` with the signed-in profile, reusing the active room when it is the same one. */
export async function joinActiveRoom(code: string): Promise<RoomError | null> {
  const current = activeRoomStore()
  if (current?.getState().room?.code === code) return null
  const session = accountStore.getState().session
  const profile = session?.profile
  if (!profile) return 'roomNotFound'
  return openRoomStore(memberFromProfile(profile, isPremium(session?.premiumUntil)))
    .getState()
    .joinRoom(code)
}

import { accountStore } from '@/features/account/accountStore'
import { activeRoomStore, memberFromProfile, openRoomStore } from './activeRoom'
import type { RoomError } from './types'

/** Joins `code` with the signed-in profile, reusing the active room when it is the same one. */
export async function joinActiveRoom(code: string): Promise<RoomError | null> {
  const current = activeRoomStore()
  if (current?.getState().room?.code === code) return null
  const profile = accountStore.getState().session?.profile
  if (!profile) return 'roomNotFound'
  return openRoomStore(memberFromProfile(profile)).getState().joinRoom(code)
}

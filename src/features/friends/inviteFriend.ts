import { accountStore } from '@/features/account/accountStore'
import { isPremium } from '@/features/premium/premium'
import { activeRoomStore, memberFromProfile, openRoomStore } from '@/features/room/activeRoom'
import type { Friend } from './friends'
import { inviteSender } from './myInvites'

/**
 * Invites a friend into this player's waiting room, opening a new room first if they are not
 * in one. Returns the room code (to go there), or null if it could not be done.
 */
export async function inviteFriend(friend: Friend): Promise<string | null> {
  const session = accountStore.getState().session
  if (!session) return null
  const profile = session.profile
  const current = activeRoomStore()?.getState()
  let code = current?.room?.status === 'lobby' ? current.room.code : null
  if (!code) {
    code = await openRoomStore(memberFromProfile(profile, isPremium(session.premiumUntil)))
      .getState()
      .createRoom()
  }
  const ok = await inviteSender(profile.id).getState().send({
    code,
    fromId: profile.id,
    fromPseudo: profile.pseudo,
    fromAvatar: profile.avatarId,
    toId: friend.id,
  })
  return ok ? code : null
}

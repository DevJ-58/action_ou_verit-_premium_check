import { accountStore } from '@/features/account/accountStore'
import { readLocalProfile, updateLocalProfile } from '@/features/account/localAuth'
import type { Bus } from '@/features/room/bus'
import { newId } from '@/lib/id'
import { safeStorage } from '@/lib/safeStorage'
import { withFriend, type Friend } from './friends'
import { publicStats, type FriendRequest, type SocialService } from './social'

const KEY = 'av:friend-requests'

function read(): FriendRequest[] {
  try {
    const list = JSON.parse((safeStorage.getItem(KEY) as string | null) ?? '[]') as unknown
    return Array.isArray(list) ? (list as FriendRequest[]) : []
  } catch {
    return []
  }
}
const write = (list: FriendRequest[]) => safeStorage.setItem(KEY, JSON.stringify(list.slice(-200)))

const asFriend = (id: string): Friend | null => {
  const p = readLocalProfile(id)
  return p ? { id: p.id, pseudo: p.pseudo, avatarId: p.avatarId } : null
}

function befriend(a: string, b: string) {
  const fa = asFriend(a)
  const fb = asFriend(b)
  if (!fa || !fb) return
  updateLocalProfile(a, (p) => ({ ...p, friends: withFriend(p.friends, fb) }))
  updateLocalProfile(b, (p) => ({ ...p, friends: withFriend(p.friends, fa) }))
}

/** Friend requests between local accounts (development and tests); changes travel on the bus. */
export function createLocalSocial(bus: Bus): SocialService {
  const me = () => accountStore.getState().session?.profile ?? null
  const changed = () => bus.publish({ kind: 'social', code: 'social' })

  return {
    async sendRequest(to) {
      const self = me()
      if (!self || to.id === self.id) return 'failed'
      if (readLocalProfile(self.id)?.friends.some((f) => f.id === to.id)) return 'friends'
      const list = read()
      const theirs = list.find(
        (r) => r.fromId === to.id && r.toId === self.id && r.status === 'pending',
      )
      if (theirs) {
        write(list.map((r) => (r.id === theirs.id ? { ...r, status: 'accepted' } : r)))
        befriend(self.id, to.id)
        changed()
        return 'friends'
      }
      const request: FriendRequest = {
        id: newId('friend-request'),
        fromId: self.id,
        fromPseudo: self.pseudo,
        fromAvatar: self.avatarId,
        toId: to.id,
        status: 'pending',
        at: Date.now(),
      }
      write([...list.filter((r) => !(r.fromId === self.id && r.toId === to.id)), request])
      changed()
      return 'sent'
    },
    async requests() {
      const self = me()
      if (!self) return []
      return read()
        .filter((r) => r.status === 'pending' && (r.toId === self.id || r.fromId === self.id))
        .sort((a, b) => b.at - a.at)
    },
    async answer(id, accept) {
      const self = me()
      const request = read().find((r) => r.id === id)
      if (!self || !request || request.toId !== self.id || request.status !== 'pending')
        return false
      write(
        read().map((r) => (r.id === id ? { ...r, status: accept ? 'accepted' : 'declined' } : r)),
      )
      if (accept) befriend(request.fromId, self.id)
      changed()
      return true
    },
    onChange: (listener) =>
      bus.subscribe((m) => {
        if (m.kind === 'social') listener()
      }),
    async publicProfile(id) {
      const p = readLocalProfile(id)
      return p
        ? {
            id: p.id,
            pseudo: p.pseudo,
            avatarId: p.avatarId,
            bio: p.bio,
            stats: publicStats(p.stats),
          }
        : null
    },
    async removeFriend(id) {
      const self = me()
      if (!self) return
      updateLocalProfile(self.id, (p) => ({ ...p, friends: p.friends.filter((f) => f.id !== id) }))
      updateLocalProfile(id, (p) => ({ ...p, friends: p.friends.filter((f) => f.id !== self.id) }))
      changed()
    },
  }
}

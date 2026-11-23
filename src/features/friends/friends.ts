/** Someone met in a room and kept, to play with again. */
export interface Friend {
  id: string
  pseudo: string
  avatarId: string
}

export const FRIENDS_MAX = 200

/** Reads saved friends of any shape; broken entries are dropped. */
export function sanitizeFriends(raw: unknown): Friend[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((f) => {
    if (typeof f !== 'object' || f === null) return []
    const r = f as Record<string, unknown>
    if (typeof r.id !== 'string' || typeof r.pseudo !== 'string') return []
    return [
      { id: r.id, pseudo: r.pseudo, avatarId: typeof r.avatarId === 'string' ? r.avatarId : '' },
    ]
  })
}

/** Adds or refreshes a friend (by id). */
export function withFriend(friends: readonly Friend[], friend: Friend): Friend[] {
  const clean = { id: friend.id, pseudo: friend.pseudo, avatarId: friend.avatarId }
  return friends.some((f) => f.id === friend.id)
    ? friends.map((f) => (f.id === friend.id ? clean : f))
    : [...friends, clean].slice(-FRIENDS_MAX)
}

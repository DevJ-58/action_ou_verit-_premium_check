import type { AccountStats } from '@/features/account/accountStats'
import type { Friend } from './friends'

/** A request to become friends; once accepted, each is in the other's friends. */
export interface FriendRequest {
  id: string
  fromId: string
  fromPseudo: string
  fromAvatar: string
  toId: string
  status: 'pending' | 'accepted' | 'declined'
  at: number
}

/** What anyone may see of a player (never their e-mail, limits or own dares). */
export interface PublicProfile {
  id: string
  pseudo: string
  avatarId: string
  bio: string
  stats: Omit<AccountStats, 'gameIds'>
}

export interface SocialService {
  /** 'friends' when you already are, or when they had asked you first. */
  sendRequest(to: Friend): Promise<'sent' | 'friends' | 'failed'>
  /** Pending requests to or from the signed-in player, newest first. */
  requests(): Promise<FriendRequest[]>
  answer(id: string, accept: boolean): Promise<boolean>
  /** Something changed about the signed-in player's requests or friends. */
  onChange(listener: () => void): () => void
  publicProfile(id: string): Promise<PublicProfile | null>
  /** Ends the friendship on both sides. */
  removeFriend(id: string): Promise<void>
}

export function publicStats(stats: AccountStats): PublicProfile['stats'] {
  const { gameIds: _ignored, ...rest } = stats
  void _ignored
  return rest
}

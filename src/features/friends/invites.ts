/** An invitation to join a room, sent to a friend. */
export interface Invite {
  id: string
  code: string
  fromId: string
  fromPseudo: string
  fromAvatar: string
  toId: string
  at: number
}

/** Invitations older than this are no longer shown. */
export const INVITE_TTL_MS = 2 * 3600 * 1000

export interface InviteTransport {
  send(invite: Omit<Invite, 'id' | 'at'>): Promise<void>
  /** Invitations waiting for this player, newest first. */
  pending(toId: string): Promise<Invite[]>
  onInvite(toId: string, listener: (invite: Invite) => void): () => void
  dismiss(invite: Invite): Promise<void>
}

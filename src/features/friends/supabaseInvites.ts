import type { SupabaseClient } from '@supabase/supabase-js'
import { INVITE_TTL_MS, type Invite, type InviteTransport } from './invites'

interface InviteRow {
  id: string
  code: string
  from_id: string
  to_id: string
  from_pseudo: string
  from_avatar: string
  created_at: string
}

const fromRow = (r: InviteRow): Invite => ({
  id: r.id,
  code: r.code,
  fromId: r.from_id,
  toId: r.to_id,
  fromPseudo: r.from_pseudo,
  fromAvatar: r.from_avatar,
  at: Date.parse(r.created_at),
})

/**
 * Invitations over Supabase (see supabase/migrations/0004_friends_invites.sql): a room member
 * invites a friend; only that friend reads it, live through database changes.
 */
export function createSupabaseInvites(getClient: () => Promise<SupabaseClient>): InviteTransport {
  return {
    send: async (invite) => {
      const client = await getClient()
      const { error } = await client.from('room_invites').insert({
        code: invite.code,
        to_id: invite.toId,
        from_pseudo: invite.fromPseudo,
        from_avatar: invite.fromAvatar,
      })
      if (error) throw error
    },
    pending: async (toId) => {
      const client = await getClient()
      const since = new Date(Date.now() - INVITE_TTL_MS).toISOString()
      const { data, error } = await client
        .from('room_invites')
        .select('*')
        .eq('to_id', toId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as InviteRow[]).map(fromRow)
    },
    onInvite: (toId, listener) => {
      let stop = () => {}
      let stopped = false
      void getClient().then((client) => {
        if (stopped) return
        const channel = client
          .channel(`invites:${toId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'room_invites',
              filter: `to_id=eq.${toId}`,
            },
            (change) => listener(fromRow((change as unknown as { new: InviteRow }).new)),
          )
          .subscribe()
        stop = () => void client.removeChannel(channel)
      })
      return () => {
        stopped = true
        stop()
      }
    },
    dismiss: async (invite) => {
      const client = await getClient()
      await client.from('room_invites').delete().eq('code', invite.code).eq('to_id', invite.toId)
    },
  }
}

import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeStats } from '@/features/account/accountStats'
import { publicStats, type FriendRequest, type PublicProfile, type SocialService } from './social'

interface RequestRow {
  id: string
  from_id: string
  to_id: string
  from_pseudo: string
  from_avatar: string
  status: FriendRequest['status']
  created_at: string
}

const fromRow = (r: RequestRow): FriendRequest => ({
  id: r.id,
  fromId: r.from_id,
  toId: r.to_id,
  fromPseudo: r.from_pseudo,
  fromAvatar: r.from_avatar,
  status: r.status,
  at: Date.parse(r.created_at),
})

/**
 * Friend requests over Supabase (supabase/migrations/0010_friend_requests.sql): every change
 * goes through server functions, which update both players' friends when a request is accepted.
 */
export function createSupabaseSocial(getClient: () => Promise<SupabaseClient>): SocialService {
  const myId = async (client: SupabaseClient) =>
    (await client.auth.getSession()).data.session?.user.id ?? null

  return {
    async sendRequest(to) {
      const client = await getClient()
      const { data, error } = await client.rpc('send_friend_request', { p_to: to.id })
      if (error) return 'failed'
      return data === 'sent' || data === 'friends' ? data : 'failed'
    },
    async requests() {
      const client = await getClient()
      const me = await myId(client)
      if (!me) return []
      const { data, error } = await client
        .from('friend_requests')
        .select('*')
        .or(`to_id.eq.${me},from_id.eq.${me}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      return error || !data ? [] : (data as RequestRow[]).map(fromRow)
    },
    async answer(id, accept) {
      const client = await getClient()
      const { data, error } = await client.rpc('answer_friend_request', {
        p_id: id,
        p_accept: accept,
      })
      return !error && data === true
    },
    onChange(listener) {
      let stop = () => {}
      let stopped = false
      void getClient().then(async (client) => {
        const me = await myId(client)
        if (stopped || !me) return
        const channel = client.channel(`friends:${me}`)
        for (const column of ['to_id', 'from_id']) {
          channel.on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'friend_requests',
              filter: `${column}=eq.${me}`,
            },
            () => listener(),
          )
        }
        channel.subscribe()
        stop = () => void client.removeChannel(channel)
      })
      return () => {
        stopped = true
        stop()
      }
    },
    async publicProfile(id) {
      const client = await getClient()
      const { data, error } = await client.rpc('public_profile', { p_id: id })
      if (error || !data) return null
      const p = data as Omit<PublicProfile, 'stats'> & { stats?: unknown }
      return {
        id: p.id,
        pseudo: p.pseudo,
        avatarId: p.avatarId ?? '',
        bio: p.bio ?? '',
        stats: publicStats(sanitizeStats(p.stats)),
      }
    },
    async removeFriend(id) {
      const client = await getClient()
      await client.rpc('remove_friend', { p_id: id })
    },
  }
}

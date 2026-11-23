import type { Bus } from '@/features/room/bus'
import { newId } from '@/lib/id'
import { safeStorage } from '@/lib/safeStorage'
import { INVITE_TTL_MS, type Invite, type InviteTransport } from './invites'

const KEY = 'av:invites'

function readAll(): Invite[] {
  try {
    const list = JSON.parse((safeStorage.getItem(KEY) as string | null) ?? '[]') as unknown
    return Array.isArray(list) ? (list as Invite[]) : []
  } catch {
    return []
  }
}
const writeAll = (list: Invite[]) => safeStorage.setItem(KEY, JSON.stringify(list.slice(-100)))

/** Invitations between tabs of one browser (development and tests). */
export function createLocalInvites(bus: Bus): InviteTransport {
  const origin = newId('inv')
  return {
    send: async (input) => {
      const invite: Invite = { ...input, id: newId('invite'), at: Date.now() }
      writeAll([...readAll(), invite])
      bus.publish({ kind: 'invite', code: invite.code, invite, origin })
    },
    pending: async (toId) =>
      readAll()
        .filter((i) => i.toId === toId && Date.now() - i.at < INVITE_TTL_MS)
        .sort((a, b) => b.at - a.at),
    onInvite: (toId, listener) =>
      bus.subscribe((m) => {
        if (m.kind === 'invite' && m.invite.toId === toId && m.origin !== origin) listener(m.invite)
      }),
    dismiss: async (invite) => {
      writeAll(readAll().filter((i) => !(i.code === invite.code && i.toId === invite.toId)))
    },
  }
}

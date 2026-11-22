import { Emoji } from '@/design-system'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { HostSetup } from './HostSetup'
import { InviteCard } from './InviteCard'
import { MemberList } from './MemberList'
import type { RoomStoreState } from './roomStore'

/** Waiting room: invite, see who is here, and (host) configure and start. */
export function LobbyView({ state }: { state: RoomStoreState }) {
  const t = useT()
  const room = state.room!
  const host = room.members.find((m) => m.id === room.hostId)
  return (
    <div className="grid gap-8 min-[900px]:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] min-[900px]:gap-x-12">
      <div className="flex flex-col gap-8">
        <InviteCard code={room.code} />
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">
            {format(t.room.players, { count: room.members.length })}
          </h2>
          <MemberList members={room.members} hostId={room.hostId} selfId={state.self.id} />
        </section>
      </div>
      {state.role === 'host' ? (
        <HostSetup memberCount={room.members.length} onStart={(setup) => void state.start(setup)} />
      ) : (
        <section className="flex flex-col items-center gap-3 self-center rounded-[32px] bg-seat p-8 text-center">
          <Emoji name="hourglass" size={56} className="motion-safe:animate-bounce" />
          <p className="text-xl font-extrabold">
            {format(t.room.waitingHost, { name: host?.pseudo ?? '' })}
          </p>
          <p className="text-muted">{t.room.waitingHint}</p>
        </section>
      )}
    </div>
  )
}

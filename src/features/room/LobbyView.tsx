import { isBot } from '@/content/axis'
import { Emoji } from '@/design-system'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { InviteFriendsButton } from '@/features/friends/InviteFriendsButton'
import { roomCapacity, roomIsPremium } from './applyIntent'
import { PremiumMark } from '@/features/premium/PremiumMark'
import { useBotDriver } from '@/features/bot/useBotDriver'
import { useAutoTour } from '@/features/guide/useAutoTour'
import { HostSetup } from './HostSetup'
import { InviteCard } from './InviteCard'
import { MemberList } from './MemberList'
import type { RoomStoreState } from './roomStore'

/** Waiting room: invite, see who is here, and (host) configure and start. */
export function LobbyView({ state }: { state: RoomStoreState }) {
  const t = useT()
  const room = state.room!
  const host = room.members.find((m) => m.id === room.hostId)
  useAutoTour('lobby')
  useBotDriver(state)
  return (
    <div className="grid gap-8 min-[900px]:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] min-[900px]:gap-x-12">
      <div className="flex flex-col gap-8">
        <div data-tour="room-code">
          <InviteCard code={room.code} />
        </div>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">
            {format(t.premium.roomCount, { count: room.members.length, max: roomCapacity(room) })}
            {roomIsPremium(room) ? <PremiumMark className="ml-1.5 align-middle" /> : null}
          </h2>
          <MemberList
            members={room.members}
            hostId={room.hostId}
            selfId={state.self.id}
            online={state.online}
            {...(state.role === 'host'
              ? {
                  onBot: (on: boolean) => state.setBot(on),
                  canAddBot:
                    !room.members.some((m) => isBot(m.id)) &&
                    room.members.length < roomCapacity(room),
                }
              : {})}
          />
          <InviteFriendsButton code={room.code} memberIds={room.members.map((m) => m.id)} />
        </section>
      </div>
      {state.role === 'host' ? (
        <HostSetup
          memberCount={room.members.length}
          premium={roomIsPremium(room)}
          onStart={(setup) => void state.start(setup)}
        />
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

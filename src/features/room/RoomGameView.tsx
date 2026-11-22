import { Screen } from '@/design-system'
import { useT } from '@/i18n/useT'
import type { RoomStoreState } from './roomStore'

/** Placeholder until the room game screen lands (Plan 2, Task 8). */
export function RoomGameView({ onLeave }: { state: RoomStoreState; onLeave(): void }) {
  const t = useT()
  return (
    <Screen title={t.room.playing} back={onLeave} backLabel={t.room.leave}>
      <p className="m-auto text-muted">{t.room.playing}</p>
    </Screen>
  )
}

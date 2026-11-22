import { newId } from '@/lib/id'
import type { Bus } from './bus'
import type { Intent, RoomState } from './types'

/** How a phone talks to its room, whatever carries the messages. */
export interface RoomTransport {
  readSnapshot(code: string): Promise<RoomState | null>
  publishState(state: RoomState): void
  sendIntent(code: string, intent: Intent): void
  onState(code: string, listener: (state: RoomState) => void): () => void
  onIntent(code: string, listener: (intent: Intent) => void): () => void
}

/** Transport over a local bus (tabs of one browser, or memory in tests). */
export function createLocalTransport(bus: Bus): RoomTransport {
  const origin = newId('tab')
  return {
    readSnapshot: async (code) => bus.readSnapshot(code),
    publishState: (state) => {
      bus.writeSnapshot(state)
      bus.publish({ kind: 'state', code: state.code, state, origin })
    },
    sendIntent: (code, intent) => bus.publish({ kind: 'intent', code, intent, origin }),
    onState: (code, listener) =>
      bus.subscribe((m) => {
        if (m.kind === 'state' && m.code === code && m.origin !== origin) listener(m.state)
      }),
    onIntent: (code, listener) =>
      bus.subscribe((m) => {
        if (m.kind === 'intent' && m.code === code && m.origin !== origin) listener(m.intent)
      }),
  }
}

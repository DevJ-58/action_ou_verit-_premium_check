import { safeStorage } from '@/lib/safeStorage'
import type { BusMessage, RoomState } from './types'

/** Messages between the phones of a room, plus the last known room state (for joining and resuming). */
export interface Bus {
  publish(message: BusMessage): void
  subscribe(listener: (message: BusMessage) => void): () => void
  readSnapshot(code: string): RoomState | null
  writeSnapshot(state: RoomState): void
}

/** In one process (tests): asynchronous delivery to every subscriber. */
export function createInMemoryBus(): Bus {
  const listeners = new Set<(message: BusMessage) => void>()
  const snapshots = new Map<string, RoomState>()
  return {
    publish: (message) => {
      const copy = structuredClone(message)
      setTimeout(() => listeners.forEach((l) => l(copy)), 0)
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    readSnapshot: (code) => structuredClone(snapshots.get(code) ?? null),
    writeSnapshot: (state) => snapshots.set(state.code, structuredClone(state)),
  }
}

/** Between tabs of the same browser: lets two tabs act as two phones without a server. */
export function createBroadcastBus(): Bus {
  const channel = new BroadcastChannel('action-ou-verite-rooms')
  const key = (code: string) => `av:room:${code}`
  return {
    publish: (message) => channel.postMessage(message),
    subscribe: (listener) => {
      const handler = (event: MessageEvent<BusMessage>) => listener(event.data)
      channel.addEventListener('message', handler)
      return () => channel.removeEventListener('message', handler)
    },
    readSnapshot: (code) => {
      try {
        return JSON.parse(safeStorage.getItem(key(code)) as string) as RoomState | null
      } catch {
        return null
      }
    },
    writeSnapshot: (state) => safeStorage.setItem(key(state.code), JSON.stringify(state)),
  }
}

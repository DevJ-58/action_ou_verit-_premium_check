import { safeStorage } from '@/lib/safeStorage'
import type { BusMessage, Intent, RoomState } from './types'

/** Messages between the phones of a room, plus the last known room state (for joining and resuming). */
export interface Bus {
  publish(message: BusMessage): void
  subscribe(listener: (message: BusMessage) => void): () => void
  readSnapshot(code: string): RoomState | null
  writeSnapshot(state: RoomState): void
  /** Keeps sent intents for a while, so a host that missed one live can still apply it. */
  logIntent(code: string, intent: Intent): void
  readIntents(code: string, since: number): Intent[]
}

const INTENTS_KEPT = 50
type Logged = { at: number; intent: Intent }

/** In one process (tests): asynchronous delivery to every subscriber. */
export function createInMemoryBus(): Bus {
  const listeners = new Set<(message: BusMessage) => void>()
  const snapshots = new Map<string, RoomState>()
  const intents = new Map<string, Logged[]>()
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
    logIntent: (code, intent) =>
      intents.set(
        code,
        [...(intents.get(code) ?? []), { at: Date.now(), intent: structuredClone(intent) }].slice(
          -INTENTS_KEPT,
        ),
      ),
    readIntents: (code, since) =>
      (intents.get(code) ?? []).filter((l) => l.at >= since).map((l) => structuredClone(l.intent)),
  }
}

function readLog(code: string): Logged[] {
  try {
    const list = JSON.parse((safeStorage.getItem(`av:intents:${code}`) as string | null) ?? '[]')
    return Array.isArray(list) ? (list as Logged[]) : []
  } catch {
    return []
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
    logIntent: (code, intent) =>
      safeStorage.setItem(
        `av:intents:${code}`,
        JSON.stringify([...readLog(code), { at: Date.now(), intent }].slice(-INTENTS_KEPT)),
      ),
    readIntents: (code, since) =>
      readLog(code)
        .filter((l) => l.at >= since)
        .map((l) => l.intent),
  }
}

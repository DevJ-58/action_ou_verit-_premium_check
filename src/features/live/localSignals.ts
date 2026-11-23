import type { Bus } from '@/features/room/bus'
import type { SignalTransport } from './types'

/** Signalling over the local bus (tabs of one browser, or memory in tests). */
export function createLocalSignals(bus: Bus): SignalTransport {
  return {
    send: (code, signal) => bus.publish({ kind: 'signal', code, signal }),
    onSignal: (code, selfId, listener) =>
      bus.subscribe((m) => {
        if (m.kind === 'signal' && m.code === code && m.signal.to === selfId) listener(m.signal)
      }),
  }
}

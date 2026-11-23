import { useEffect, useMemo } from 'react'
import { feedback } from '@/lib/feedback'
import { createChatStore, type ChatStore } from './chatStore'
import { getChatTransport } from './getChatTransport'

/** The chat of the room this phone is in, connected while the screen is open. */
export function useRoomChat(code: string, selfId: string): ChatStore {
  const store = useMemo(
    () =>
      createChatStore({
        transport: getChatTransport(),
        code,
        selfId,
        onIncoming: () => feedback.message(),
      }),
    [code, selfId],
  )
  useEffect(() => {
    let stop: (() => void) | null = null
    let cancelled = false
    void store
      .getState()
      .connect()
      .then((off) => (cancelled ? off() : (stop = off)))
    return () => {
      cancelled = true
      stop?.()
    }
  }, [store])
  return store
}

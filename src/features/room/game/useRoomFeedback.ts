import { useEffect, useRef } from 'react'
import { feedback } from '@/lib/feedback'
import type { RoomState } from '../types'
import { roomFeedback } from './roomFeedback'

/** Plays this phone's sounds and vibrations as the shared room state changes. */
export function useRoomFeedback(room: RoomState | null, selfId: string): void {
  const prev = useRef<RoomState | null>(null)
  useEffect(() => {
    if (!room) return
    for (const name of roomFeedback(prev.current, room, selfId)) feedback[name]()
    prev.current = room
  }, [room, selfId])
}

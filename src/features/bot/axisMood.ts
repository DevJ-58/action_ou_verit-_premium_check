import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { axisFace, TALKING_FACES, type AxisMood } from '@/content/axis'

const TALK_MS = 2000
const FRAME_MS = 180

interface MoodState {
  mood: AxisMood
  /** Until when his mouth moves (ms, this phone's clock). */
  talkingUntil: number
}

const moodStore = createStore<MoodState>()(() => ({ mood: 'happy', talkingUntil: 0 }))

/** Axis's expression on this phone; `talk` animates his mouth for a moment. */
export function setAxisMood(mood: AxisMood, options: { talk?: boolean } = {}) {
  moodStore.setState({
    mood,
    talkingUntil: options.talk ? Date.now() + TALK_MS : moodStore.getState().talkingUntil,
  })
}

/** The image to show for Axis right now. */
export function useAxisFace(): string {
  const { mood, talkingUntil } = useStore(moodStore)
  const [frame, setFrame] = useState(-1)
  useEffect(() => {
    if (talkingUntil <= Date.now()) return
    let i = 0
    const tick = setInterval(() => {
      if (Date.now() >= talkingUntil) {
        clearInterval(tick)
        setFrame(-1)
        return
      }
      setFrame(i++ % TALKING_FACES.length)
    }, FRAME_MS)
    return () => clearInterval(tick)
  }, [talkingUntil])
  return frame >= 0 ? TALKING_FACES[frame]! : axisFace(mood)
}

import type { Member } from '@/features/room/types'
import face1 from '@/assets/axis/axis-1.webp'
import face2 from '@/assets/axis/axis-2.webp'
import face3 from '@/assets/axis/axis-3.webp'
import face4 from '@/assets/axis/axis-4.webp'
import face5 from '@/assets/axis/axis-5.webp'
import face6 from '@/assets/axis/axis-6.webp'

/** Axis, the game's built-in player. The host's phone plays him. */
export const AXIS_ID = 'bot-axis'
export const AXIS_AVATAR = 'axis'

export const isBot = (id: string) => id.startsWith('bot-')

export type AxisMood = 'happy' | 'talking' | 'calm' | 'cheeky' | 'doubt' | 'laugh'

const FACES: Record<AxisMood, string> = {
  happy: face1,
  talking: face2,
  calm: face3,
  cheeky: face4,
  doubt: face5,
  laugh: face6,
}

export const axisFace = (mood: AxisMood) => FACES[mood]

/** While he talks, his mouth moves through these faces. */
export const TALKING_FACES = [face2, face3, face1] as const

export function axisMember(): Member {
  return {
    id: AXIS_ID,
    pseudo: 'Axis',
    avatarId: AXIS_AVATAR,
    limits: { excludedCategories: [], maxIntensity: 4 },
    customDares: [],
  }
}

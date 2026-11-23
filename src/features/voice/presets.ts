import type { EmojiName } from '@/content/emoji'

/**
 * Voices for the live mic. `pitch` shifts the voice (-1 lower … +1 higher), then effects colour it.
 * Nobody talks with their natural voice: the avatar decides.
 */
export const VOICES = {
  deep: { pitch: -0.45, emoji: 'masks', label: { fr: 'Voix grave', en: 'Deep voice' } },
  high: { pitch: 0.45, emoji: 'sparkles', label: { fr: 'Voix aiguë', en: 'High voice' } },
  robot: { pitch: 0, ring: 50, emoji: 'game', label: { fr: 'Robot', en: 'Robot' } },
  monster: { pitch: -0.8, drive: 18, emoji: 'fire', label: { fr: 'Monstre', en: 'Monster' } },
  ghost: { pitch: 0.2, echo: 0.32, emoji: 'moon', label: { fr: 'Fantôme', en: 'Ghost' } },
  alien: { pitch: 0.7, ring: 300, emoji: 'rocket', label: { fr: 'Alien', en: 'Alien' } },
  radio: {
    pitch: -0.15,
    band: true,
    drive: 6,
    emoji: 'speech',
    label: { fr: 'Radio', en: 'Radio' },
  },
  fairy: { pitch: 0.85, echo: 0.18, emoji: 'star', label: { fr: 'Fée', en: 'Fairy' } },
} as const satisfies Record<
  string,
  {
    pitch: number
    ring?: number
    drive?: number
    echo?: number
    band?: boolean
    emoji: EmojiName
    label: { fr: string; en: string }
  }
>

export type VoiceId = keyof typeof VOICES

const BY_AVATAR: Record<string, VoiceId> = {
  // Animals and creatures.
  '1f981': 'monster',
  '1f42f': 'monster',
  '1f43a': 'monster',
  '1f409': 'monster',
  '1f608': 'monster',
  '1f98a': 'high',
  '1f43c': 'deep',
  '1f431': 'high',
  '1f985': 'radio',
  '1f989': 'ghost',
  '1f984': 'fairy',
  '1f9da-1f3fe': 'fairy',
  '1f9dc-1f3ff': 'fairy',
  '1f478-1f3ff': 'fairy',
  '1f916': 'robot',
  '1f9b8-1f3ff': 'robot',
  '1f977-1f3fe': 'radio',
  '1f47d': 'alien',
  '1f47e': 'alien',
  '1f47b': 'ghost',
  '1f9db-1f3ff': 'ghost',
  '1f9d9-1f3ff': 'ghost',
  '1f920': 'radio',
  '1f60e': 'radio',
  '1f934-1f3ff': 'deep',
  '1f483-1f3ff': 'high',
}

/** The voice of an avatar: creatures have their own; people get a deep, high or radio voice. */
export function voiceFor(avatarId: string): VoiceId {
  const known = BY_AVATAR[avatarId]
  if (known) return known
  if (avatarId.startsWith('1f468') || avatarId.startsWith('1f9d4')) return 'deep'
  if (avatarId.startsWith('1f469') || avatarId.startsWith('1f9d5')) return 'high'
  return 'radio'
}

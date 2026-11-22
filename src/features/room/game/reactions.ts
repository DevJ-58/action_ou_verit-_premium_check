import type { EmojiName } from '@/content/emoji'

/** The quick reactions everyone can send during a turn. */
export const REACTIONS = [
  'fire',
  'rofl',
  'heartEyes',
  'scream',
  'clap',
  'eyes',
] as const satisfies readonly EmojiName[]
export type ReactionEmoji = (typeof REACTIONS)[number]

/** 3D emoji used across the UI — Microsoft Fluent Emoji 3D (MIT licence). */
const FILES = import.meta.glob<string>('../assets/fluent/emoji/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

const CODES = {
  fire: '1f525',
  heart: '2764-fe0f',
  kiss: '1f48b',
  champagne: '1f37e',
  wine: '1f377',
  party: '1f389',
  rofl: '1f923',
  heartEyes: '1f60d',
  shush: '1f92b',
  eyes: '1f440',
  dice: '1f3b2',
  crown: '1f451',
  trophy: '1f3c6',
  star: '2b50',
  sparkles: '2728',
  moon: '1f319',
  seeNoEvil: '1f648',
  joy: '1f602',
  clap: '1f44f',
  thinking: '1f914',
  hot: '1f975',
  flushed: '1f633',
  scream: '1f631',
  hundred: '1f4af',
  speech: '1f4ac',
  lock: '1f512',
  link: '1f517',
  game: '1f3ae',
  pencil: '270f-fe0f',
  target: '1f3af',
  loveLetter: '1f48c',
  hug: '1f917',
  wave: '1f44b',
  masks: '1f3ad',
  rocket: '1f680',
  gift: '1f381',
  twoHearts: '1f495',
  smirk: '1f60f',
  zany: '1f92a',
  raisedHands: '1f64c',
  phone: '1f4f1',
  globe: '1f30d',
  people: '1f465',
  hourglass: '23f3',
} as const

export type EmojiName = keyof typeof CODES

export function emojiSrc(name: EmojiName): string {
  return FILES[`../assets/fluent/emoji/${CODES[name]}.webp`] ?? ''
}

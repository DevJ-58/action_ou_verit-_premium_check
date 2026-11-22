export type CategoryId =
  'fun' | 'honest' | 'romantic' | 'closer' | 'spicy' | 'night' | 'intimate' | 'noreturn'

export type Intensity = 1 | 2 | 3 | 4
export type ChallengeKind = 'truth' | 'dare'
export type PlayMode = 'nearby' | 'remote'
export type DareSource = 'system' | 'custom' | 'both'

export interface Dare {
  id: string
  kind: ChallengeKind
  category: CategoryId
  intensity: Intensity
  modes: PlayMode[]
  text: string
  /** Set for custom and written dares: the player who created it. */
  authorId?: string
}

export interface PlayerLimits {
  excludedCategories: CategoryId[]
  maxIntensity: Intensity
}

/**
 * A player at the table. The order of the `players` array is the seating
 * order around the phone, clockwise.
 */
export interface Player {
  id: string
  name: string
  avatar: string
  limits: PlayerLimits
  customDares: Dare[]
}

/** Random source returning a number in [0, 1). */
export type Rng = () => number

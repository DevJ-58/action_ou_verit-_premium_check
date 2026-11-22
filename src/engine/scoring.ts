import type { ChallengeKind } from './types'

export type Outcome = 'done' | 'skipped'

/** Truth done +1, dare done +2, any skip −1. */
export function pointsFor(kind: ChallengeKind, outcome: Outcome): number {
  if (outcome === 'skipped') return -1
  return kind === 'dare' ? 2 : 1
}

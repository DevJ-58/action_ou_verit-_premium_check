import type { GameState } from '@/engine'
import type { Dictionary } from '@/i18n/fr'
import { format } from '@/i18n/format'

export interface TurnGuide {
  /** 0 Bottle · 1 Choice · 2 Dares · 3 Card · 4 Verdict. */
  step: number
  /** This phone has something to do now. */
  mine: boolean
  text: string
}

/** What is happening in the turn and who must act, from this phone's point of view. */
export function turnGuide(
  game: GameState,
  selfId: string,
  nameOf: (id: string) => string,
  t: Dictionary,
): TurnGuide {
  const g = t.guide
  const turn = game.turn
  if (game.phase === 'finished') return { step: 4, mine: false, text: g.over }
  if (!turn || game.phase === 'ready') return { step: 0, mine: true, text: g.spin }
  if (game.phase === 'spinning') return { step: 0, mine: false, text: g.spinning }
  const isAnswerer = turn.answererId === selfId
  const answerer = nameOf(turn.answererId)
  switch (game.phase) {
    case 'choosing':
      return isAnswerer
        ? { step: 1, mine: true, text: g.chooseMine }
        : { step: 1, mine: false, text: format(g.choose, { name: answerer }) }
    case 'proposing': {
      const count = turn.proposals?.length ?? 0
      const total = game.players.length - 1
      if (isAnswerer) return { step: 2, mine: false, text: format(g.waitDares, { count, total }) }
      const sent = turn.proposals?.some((p) => p.playerId === selfId) ?? false
      return sent
        ? { step: 2, mine: false, text: format(g.proposed, { count, total }) }
        : { step: 2, mine: true, text: format(g.proposeMine, { name: answerer }) }
    }
    case 'asking':
      return isAnswerer
        ? {
            step: 2,
            mine: false,
            text: format(g.waitDares, { count: 0, total: game.players.length - 1 }),
          }
        : { step: 2, mine: true, text: format(g.write, { name: answerer }) }
    case 'picking':
      return isAnswerer
        ? { step: 3, mine: true, text: g.pickMine }
        : { step: 3, mine: false, text: format(g.pick, { name: answerer }) }
    default: {
      const votes = turn.votes ?? {}
      if (isAnswerer) {
        return Object.keys(votes).length > 0
          ? { step: 4, mine: true, text: g.doneMine }
          : { step: 4, mine: true, text: g.doMine }
      }
      return selfId in votes
        ? { step: 4, mine: false, text: format(g.voted, { name: answerer }) }
        : { step: 4, mine: true, text: g.voteMine }
    }
  }
}

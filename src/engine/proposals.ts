import { drawDare, isAllowedFor, validateWrittenDare } from './dares'
import { GameRuleError } from './errors'
import { pickIndex } from './rng'
import type { GameState, Proposal, Turn } from './state'
import type { Dare, Rng } from './types'

function filterFor(state: GameState, turn: Turn) {
  const answerer = state.players.find((p) => p.id === turn.answererId)!
  return {
    kind: turn.kind!,
    mode: state.settings.mode,
    categories: state.settings.categories,
    limits: answerer.limits,
  }
}

/** A player (not the answerer) proposes or replaces their dare. */
export function propose(state: GameState, turn: Turn, playerId: string, dare: Dare): GameState {
  if (playerId === turn.answererId || !state.players.some((p) => p.id === playerId)) {
    throw new GameRuleError('dareNotAllowed')
  }
  const text = validateWrittenDare(dare.text)
  if (!text.ok) throw new GameRuleError('writtenInvalid')
  const id = `prop-${state.id}-${state.history.length}-${playerId}`
  const proposal: Proposal = {
    playerId,
    dare: { ...dare, id, text: text.text, authorId: playerId },
  }
  if (!isAllowedFor(proposal.dare, filterFor(state, turn)))
    throw new GameRuleError('dareNotAllowed')
  const proposals = [...(turn.proposals ?? []).filter((p) => p.playerId !== playerId), proposal]
  return { ...state, turn: { ...turn, proposals } }
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, rng)
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/** Ends the proposal time: shuffled cards for the answerer, or a game dare if nobody proposed. */
export function closeProposals(
  state: GameState,
  turn: Turn,
  ctx: { rng: Rng; systemDares: readonly Dare[] },
): GameState {
  const proposals = turn.proposals ?? []
  if (proposals.length > 0) {
    return { ...state, phase: 'picking', turn: { ...turn, proposals: shuffle(proposals, ctx.rng) } }
  }
  const dare = drawDare(
    ctx.systemDares,
    { ...filterFor(state, turn), usedIds: new Set(state.usedDareIds) },
    ctx.rng,
  )
  if (!dare) return { ...state, phase: 'asking', turn: { ...turn, noDareAvailable: true } }
  return { ...state, phase: 'challenge', turn: { ...turn, dare } }
}

/** The answerer turns over one of the face-down proposals. */
export function pickProposal(state: GameState, turn: Turn, index: number): GameState {
  const chosen = turn.proposals?.[index]
  if (!chosen) throw new GameRuleError('dareNotAllowed')
  return {
    ...state,
    phase: 'challenge',
    turn: { ...turn, dare: chosen.dare, askerId: chosen.playerId },
  }
}

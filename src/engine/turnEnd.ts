import { pointsFor, type Outcome } from './scoring'
import type { GameState, Turn } from './state'

/** Ends the turn: scores and history (with the answer and votes), then the next turn or the end. */
export function endTurn(state: GameState, turn: Turn, outcome: Outcome | null): GameState {
  const scores = { ...state.scores }
  let { history, usedDareIds } = state
  if (outcome && turn.dare && turn.kind) {
    const prev = scores[turn.answererId]!
    const done = outcome === 'done'
    scores[turn.answererId] = {
      done: prev.done + (done ? 1 : 0),
      skipped: prev.skipped + (done ? 0 : 1),
      points: prev.points + pointsFor(turn.kind, outcome),
      truths: prev.truths + (done && turn.kind === 'truth' ? 1 : 0),
      dares: prev.dares + (done && turn.kind === 'dare' ? 1 : 0),
    }
    history = [
      ...history,
      {
        round: state.round,
        answererId: turn.answererId,
        askerId: turn.askerId,
        dare: turn.dare,
        outcome,
        ...(turn.answer ? { answer: turn.answer } : {}),
        ...(turn.votes ? { votes: turn.votes } : {}),
      },
    ]
    usedDareIds = [...usedDareIds, turn.dare.id]
  }
  const played = [...state.playedThisRound, turn.answererId]
  const roundOver = played.length >= state.players.length
  const round = roundOver ? state.round + 1 : state.round
  const over = roundOver && round > state.settings.rounds
  return {
    ...state,
    scores,
    history,
    usedDareIds,
    turn: null,
    playedThisRound: roundOver ? [] : played,
    round: over ? state.round : round,
    phase: over ? 'finished' : 'ready',
  }
}

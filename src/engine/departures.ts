import { MIN_PLAYERS, type GameState } from './state'

/**
 * A player leaves for good: removed from the table, their scores kept in history only.
 * If they were in the current turn as the answerer (or the one-phone asker), the turn
 * ends without scoring; a proposer's proposal is withdrawn. Fewer than 2 players ends the game.
 */
export function removePlayer(state: GameState, playerId: string): GameState {
  if (!state.players.some((p) => p.id === playerId)) return state
  const players = state.players.filter((p) => p.id !== playerId)
  const playedThisRound = state.playedThisRound.filter((id) => id !== playerId)
  const base = { ...state, players, playedThisRound }
  if (players.length < MIN_PLAYERS) return { ...base, phase: 'finished', turn: null }

  const turn = state.turn
  if (!turn) return base
  const inTurn =
    turn.answererId === playerId ||
    (state.settings.flow !== 'everyone' && turn.askerId === playerId)
  if (inTurn) {
    const roundOver = playedThisRound.length >= players.length
    return {
      ...base,
      turn: null,
      phase: 'ready',
      playedThisRound: roundOver ? [] : playedThisRound,
    }
  }
  const proposals = turn.proposals?.filter((p) => p.playerId !== playerId)
  const askerId = turn.askerId === playerId ? turn.answererId : turn.askerId
  return { ...base, turn: { ...turn, askerId, ...(proposals ? { proposals } : {}) } }
}

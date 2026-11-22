import type { GameAction, GameState } from '@/engine'

/** Who may send which action in a room. The engine then checks the phase and rules. */
export function mayAct(game: GameState, hostId: string, from: string, action: GameAction): boolean {
  const answerer = game.turn?.answererId
  switch (action.type) {
    case 'SPIN':
      return game.players.some((p) => p.id === from)
    case 'CHOOSE_KIND':
    case 'PICK_PROPOSAL':
      return from === answerer
    case 'COMPLETE':
    case 'SKIP':
      return from === answerer || from === hostId
    case 'PROPOSE':
      return action.playerId === from
    case 'PICK_SYSTEM':
    case 'PICK_CUSTOM':
    case 'PICK_WRITTEN':
      return game.players.some((p) => p.id === from)
    case 'SPIN_SETTLED':
    case 'CLOSE_PROPOSALS':
    case 'TIMEOUT_PICK':
    case 'RESTART':
      return from === hostId
    default:
      return false
  }
}

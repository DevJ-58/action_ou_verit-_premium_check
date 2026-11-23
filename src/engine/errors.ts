export type GameRuleCode =
  | 'invalidPhase'
  | 'noSkipsLeft'
  | 'dareNotAllowed'
  | 'writtenInvalid'
  | 'notEnoughPlayers'
  | 'tooManyPlayers'
  | 'noCategory'
  | 'notYourTurn'
  | 'answerInvalid'

/** Thrown when an action breaks a rule of the game. */
export class GameRuleError extends Error {
  readonly code: GameRuleCode

  constructor(code: GameRuleCode) {
    super(`Game rule broken: ${code}`)
    this.name = 'GameRuleError'
    this.code = code
  }
}

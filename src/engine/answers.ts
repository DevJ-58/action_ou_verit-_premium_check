import { GameRuleError } from './errors'
import type { Answer, GameState, Turn } from './state'

export const ANSWER_MAX = 500

/** The designated player answers (in writing or with a voice note); a new answer replaces the old. */
export function answer(
  state: GameState,
  turn: Turn,
  input: { playerId: string; text?: string; voiceId?: string },
): GameState {
  if (input.playerId !== turn.answererId) throw new GameRuleError('notYourTurn')
  const text = input.text?.trim()
  let value: Answer
  if (text) {
    if (text.length > ANSWER_MAX) throw new GameRuleError('answerInvalid')
    value = { text }
  } else if (input.voiceId && input.text === undefined) {
    value = { voiceId: input.voiceId }
  } else {
    throw new GameRuleError('answerInvalid')
  }
  return { ...state, turn: { ...turn, answer: value } }
}

/** Another player says whether the answer convinced them; they can change their mind. */
export function vote(state: GameState, turn: Turn, playerId: string, ok: boolean): GameState {
  if (playerId === turn.answererId || !state.players.some((p) => p.id === playerId)) {
    throw new GameRuleError('notYourTurn')
  }
  return { ...state, turn: { ...turn, votes: { ...turn.votes, [playerId]: ok } } }
}

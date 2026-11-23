import { reduce } from './reduce'
import { createSeededRng } from './rng'
import { createGame, type GameAction, type GameSettings, type GameState } from './state'
import { deepFreeze, makeDare, makePlayer } from './testing'

const settings: GameSettings = {
  mode: 'remote',
  categories: ['fun'],
  source: 'both',
  rounds: 2,
  timerSeconds: 0,
  maxSkips: 3,
  picker: 'bottle',
  flow: 'everyone',
  proposeSeconds: 60,
}

function inChallenge() {
  const ctx = { rng: createSeededRng(3), systemDares: [makeDare('sys-1', { kind: 'truth' })] }
  let state = createGame({
    id: 'g',
    settings,
    players: ['a', 'b', 'c'].map((id) => makePlayer(id)),
  })
  const run = (action: GameAction) => (state = deepFreeze(reduce(state, action, ctx)))
  run({ type: 'SPIN' })
  run({ type: 'SPIN_SETTLED' })
  run({ type: 'CHOOSE_KIND', kind: 'truth' })
  run({ type: 'CLOSE_PROPOSALS' })
  const answerer = state.turn!.answererId
  const others = state.players.map((p) => p.id).filter((id) => id !== answerer)
  return {
    get state(): GameState {
      return state
    },
    run,
    answerer,
    others,
  }
}

const expectRule = (fn: () => unknown, code: string) =>
  expect(fn).toThrowError(expect.objectContaining({ code }))

test('the designated player answers in writing; the answer is trimmed and can be replaced', () => {
  const g = inChallenge()
  expect(g.state.phase).toBe('challenge')
  g.run({ type: 'ANSWER', playerId: g.answerer, text: '  Oui, une fois.  ' })
  expect(g.state.turn!.answer).toEqual({ text: 'Oui, une fois.' })
  g.run({ type: 'ANSWER', playerId: g.answerer, text: 'Deux fois.' })
  expect(g.state.turn!.answer).toEqual({ text: 'Deux fois.' })
})

test('a voice answer is kept by its id, with its length', () => {
  const g = inChallenge()
  g.run({ type: 'ANSWER', playerId: g.answerer, voiceId: 'v-123', voiceMs: 4200 })
  expect(g.state.turn!.answer).toEqual({ voiceId: 'v-123', voiceMs: 4200 })
  expectRule(
    () => g.run({ type: 'ANSWER', playerId: g.answerer, voiceId: 'v', voiceMs: 60_000 }),
    'answerInvalid',
  )
})

test('only the designated player answers, with text of 1 to 500 characters or a voice note', () => {
  const g = inChallenge()
  expectRule(() => g.run({ type: 'ANSWER', playerId: g.others[0]!, text: 'moi' }), 'notYourTurn')
  expectRule(() => g.run({ type: 'ANSWER', playerId: g.answerer, text: '   ' }), 'answerInvalid')
  expectRule(
    () => g.run({ type: 'ANSWER', playerId: g.answerer, text: 'x'.repeat(501) }),
    'answerInvalid',
  )
  expectRule(() => g.run({ type: 'ANSWER', playerId: g.answerer }), 'answerInvalid')
})

test('answering outside the challenge phase is refused', () => {
  const g = inChallenge()
  g.run({ type: 'COMPLETE' })
  expectRule(() => g.run({ type: 'ANSWER', playerId: g.answerer, text: 'x' }), 'invalidPhase')
})

test('other players vote once each (they can change their mind); the answerer cannot vote', () => {
  const g = inChallenge()
  g.run({ type: 'VOTE', playerId: g.others[0]!, ok: true })
  g.run({ type: 'VOTE', playerId: g.others[1]!, ok: false })
  g.run({ type: 'VOTE', playerId: g.others[1]!, ok: true })
  expect(g.state.turn!.votes).toEqual({ [g.others[0]!]: true, [g.others[1]!]: true })
  expectRule(() => g.run({ type: 'VOTE', playerId: g.answerer, ok: true }), 'notYourTurn')
  expectRule(() => g.run({ type: 'VOTE', playerId: 'ghost', ok: true }), 'notYourTurn')
})

test('the answer and the votes go into the history when the turn ends', () => {
  const g = inChallenge()
  g.run({ type: 'ANSWER', playerId: g.answerer, text: 'Jamais.' })
  g.run({ type: 'VOTE', playerId: g.others[0]!, ok: false })
  g.run({ type: 'COMPLETE' })
  const entry = g.state.history.at(-1)!
  expect(entry.answer).toEqual({ text: 'Jamais.' })
  expect(entry.votes).toEqual({ [g.others[0]!]: false })
})

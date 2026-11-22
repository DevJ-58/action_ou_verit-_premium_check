import { GameRuleError } from './errors'
import { reduce } from './reduce'
import { createSeededRng } from './rng'
import { createGame, type GameAction, type GameSettings, type GameState } from './state'
import { deepFreeze, makeDare, makePlayer } from './testing'

const settings: GameSettings = {
  mode: 'remote',
  categories: ['fun'],
  source: 'both',
  rounds: 1,
  timerSeconds: 0,
  maxSkips: 3,
  picker: 'bottle',
  flow: 'everyone',
  proposeSeconds: 60,
}

const pool = [makeDare('sys-d1'), makeDare('sys-t1', { kind: 'truth' })]
const players = () => ['a', 'b', 'c'].map((id) => makePlayer(id))

function setup(over: Partial<GameSettings> = {}, ps = players()) {
  const ctx = { rng: createSeededRng(5), systemDares: pool }
  let state = createGame({ id: 'g', settings: { ...settings, ...over }, players: ps })
  const run = (action: GameAction) => (state = reduce(state, action, ctx))
  run({ type: 'SPIN' })
  run({ type: 'SPIN_SETTLED' })
  return {
    get state(): GameState {
      return state
    },
    run,
    ctx,
  }
}

function others(state: GameState) {
  return state.players.map((p) => p.id).filter((id) => id !== state.turn!.answererId)
}

function expectRule(fn: () => unknown, code: GameRuleError['code']) {
  expect(fn).toThrowError(expect.objectContaining({ code }))
}

const written = (text: string) =>
  makeDare('w', { text, category: 'fun', intensity: 1, modes: ['remote'] })

test('in “everyone” mode, choosing the kind opens proposals', () => {
  const g = setup()
  const s = g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
  expect(s.phase).toBe('proposing')
  expect(s.turn!.proposals).toEqual([])
})

test('in “asker” mode, proposals are never opened', () => {
  const g = setup({ flow: 'asker' })
  expect(g.run({ type: 'CHOOSE_KIND', kind: 'dare' }).phase).toBe('asking')
})

test('the designated player cannot propose; others can, once each (latest wins)', () => {
  const g = setup()
  g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
  const answerer = g.state.turn!.answererId
  const [x] = others(g.state)
  expectRule(
    () => g.run({ type: 'PROPOSE', playerId: answerer, dare: written('Chante') }),
    'dareNotAllowed',
  )
  g.run({ type: 'PROPOSE', playerId: x!, dare: written('Chante faux') })
  const s = g.run({ type: 'PROPOSE', playerId: x!, dare: written('Danse le zouk') })
  expect(s.turn!.proposals).toHaveLength(1)
  expect(s.turn!.proposals![0]).toMatchObject({
    playerId: x,
    dare: { text: 'Danse le zouk', authorId: x },
  })
})

test('a proposal outside the answerer’s limits or of the wrong kind is refused', () => {
  const g = setup()
  g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
  const [x] = others(g.state)
  expectRule(
    () =>
      g.run({
        type: 'PROPOSE',
        playerId: x!,
        dare: makeDare('s', { category: 'spicy', intensity: 3 }),
      }),
    'dareNotAllowed',
  )
  expectRule(
    () => g.run({ type: 'PROPOSE', playerId: x!, dare: makeDare('t', { kind: 'truth' }) }),
    'dareNotAllowed',
  )
  expectRule(() => g.run({ type: 'PROPOSE', playerId: x!, dare: written('ok') }), 'writtenInvalid')
})

test('closing with no proposal draws a game dare', () => {
  const g = setup()
  g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
  const s = g.run({ type: 'CLOSE_PROPOSALS' })
  expect(s.phase).toBe('challenge')
  expect(s.turn!.dare!.id).toBe('sys-d1')
})

test('closing with proposals lets the answerer pick one; its author becomes the asker', () => {
  const g = setup()
  g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
  const [x, y] = others(g.state)
  g.run({ type: 'PROPOSE', playerId: x!, dare: written('Imite un chat') })
  g.run({ type: 'PROPOSE', playerId: y!, dare: written('Fais dix squats') })
  const picking = g.run({ type: 'CLOSE_PROPOSALS' })
  expect(picking.phase).toBe('picking')
  expectRule(() => g.run({ type: 'PICK_PROPOSAL', index: 2 }), 'dareNotAllowed')
  const s = g.run({ type: 'PICK_PROPOSAL', index: 1 })
  expect(s.phase).toBe('challenge')
  const chosen = picking.turn!.proposals![1]!
  expect(s.turn!.dare).toEqual(chosen.dare)
  expect(s.turn!.askerId).toBe(chosen.playerId)
})

test('if the answerer does not pick in time, a proposal is drawn', () => {
  const g = setup()
  g.run({ type: 'CHOOSE_KIND', kind: 'truth' })
  const [x] = others(g.state)
  g.run({
    type: 'PROPOSE',
    playerId: x!,
    dare: { ...written('Ton pire souvenir ?'), kind: 'truth' },
  })
  g.run({ type: 'CLOSE_PROPOSALS' })
  const s = g.run({ type: 'TIMEOUT_PICK' })
  expect(s.phase).toBe('challenge')
  expect(s.turn!.dare!.text).toBe('Ton pire souvenir ?')
})

test('proposal actions outside their phase are refused and inputs are never mutated', () => {
  const g = setup()
  expectRule(
    () => g.run({ type: 'PROPOSE', playerId: 'a', dare: written('Chante') }),
    'invalidPhase',
  )
  expectRule(() => g.run({ type: 'CLOSE_PROPOSALS' }), 'invalidPhase')
  g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
  const frozen = deepFreeze(structuredClone(g.state))
  const [x] = others(frozen)
  expect(() =>
    reduce(frozen, { type: 'PROPOSE', playerId: x!, dare: written('Saute') }, g.ctx),
  ).not.toThrow()
})

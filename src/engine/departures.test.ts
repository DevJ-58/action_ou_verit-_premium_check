import { reduce } from './reduce'
import { createSeededRng } from './rng'
import { createGame, type GameAction, type GameSettings, type GameState } from './state'
import { makeDare, makePlayer } from './testing'

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
const pool = [makeDare('d1'), makeDare('t1', { kind: 'truth' })]

function setup(ids = ['a', 'b', 'c']) {
  const ctx = { rng: createSeededRng(3), systemDares: pool }
  let state = createGame({ id: 'g', settings, players: ids.map((id) => makePlayer(id)) })
  const run = (action: GameAction) => (state = reduce(state, action, ctx))
  return {
    get state(): GameState {
      return state
    },
    run,
  }
}

test('a player who leaves between turns is removed everywhere', () => {
  const g = setup()
  g.run({ type: 'SPIN' })
  g.run({ type: 'SPIN_SETTLED' })
  g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
  g.run({ type: 'CLOSE_PROPOSALS' })
  g.run({ type: 'COMPLETE' })
  const played = g.state.playedThisRound[0]!
  const s = g.run({ type: 'REMOVE_PLAYER', playerId: played })
  expect(s.players.map((p) => p.id)).not.toContain(played)
  expect(s.playedThisRound).not.toContain(played)
  expect(s.phase).toBe('ready')
})

test('when the answerer leaves mid-turn, the turn ends without scoring', () => {
  const g = setup()
  g.run({ type: 'SPIN' })
  g.run({ type: 'SPIN_SETTLED' })
  const answerer = g.state.turn!.answererId
  const s = g.run({ type: 'REMOVE_PLAYER', playerId: answerer })
  expect(s.phase).toBe('ready')
  expect(s.turn).toBeNull()
  expect(s.players.map((p) => p.id)).not.toContain(answerer)
  expect(s.history).toEqual([])
})

test('when a proposer leaves, their proposal is withdrawn and the turn goes on', () => {
  const g = setup()
  g.run({ type: 'SPIN' })
  g.run({ type: 'SPIN_SETTLED' })
  g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
  const proposer = g.state.players.find((p) => p.id !== g.state.turn!.answererId)!.id
  g.run({ type: 'PROPOSE', playerId: proposer, dare: makeDare('x', { text: 'Danse le zouk' }) })
  const s = g.run({ type: 'REMOVE_PLAYER', playerId: proposer })
  expect(s.phase).toBe('proposing')
  expect(s.turn!.proposals).toEqual([])
})

test('if fewer than 2 players remain, the game ends', () => {
  const g = setup(['a', 'b'])
  expect(g.run({ type: 'REMOVE_PLAYER', playerId: 'b' }).phase).toBe('finished')
})

test('removing an unknown player changes nothing', () => {
  const g = setup()
  const before = g.state
  expect(g.run({ type: 'REMOVE_PLAYER', playerId: 'zz' })).toBe(before)
})

test('if the answerer does not choose in time, a kind is drawn for them', () => {
  const g = setup()
  g.run({ type: 'SPIN' })
  g.run({ type: 'SPIN_SETTLED' })
  const s = g.run({ type: 'TIMEOUT_CHOOSE' })
  expect(s.phase).toBe('proposing')
  expect(['truth', 'dare']).toContain(s.turn!.kind)
})

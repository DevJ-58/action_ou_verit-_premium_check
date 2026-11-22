import { createGame, createSeededRng, reduce } from '@/engine'
import { makePlayer } from '@/engine/testing'
import { systemDares } from '@/content/systemDares'
import { isValidGame } from './validateGame'
import { hasResumableGame } from './resumable'

const game = createGame({
  id: 'g',
  players: [makePlayer('a'), makePlayer('b')],
  settings: {
    mode: 'nearby',
    categories: ['fun'],
    source: 'both',
    rounds: 1,
    timerSeconds: 0,
    maxSkips: 3,
    picker: 'bottle',
  },
})

test('accepts real games in every phase', () => {
  const ctx = { rng: createSeededRng(2), systemDares }
  let state = game
  expect(isValidGame(state)).toBe(true)
  for (const action of [
    { type: 'SPIN' },
    { type: 'SPIN_SETTLED' },
    { type: 'CHOOSE_KIND', kind: 'dare' },
    { type: 'PICK_SYSTEM' },
  ] as const) {
    state = reduce(state, action, ctx)
    expect(isValidGame(state)).toBe(true)
  }
})

test.each([
  ['null', null],
  ['missing players', { ...game, players: undefined }],
  ['unknown phase', { ...game, phase: 'dancing' }],
  ['turn missing while choosing', { ...game, phase: 'choosing', turn: null }],
  [
    'turn pointing to a stranger',
    {
      ...game,
      phase: 'choosing',
      turn: { answererId: 'zz', askerId: 'a', kind: null, dare: null, noDareAvailable: false },
    },
  ],
  [
    'challenge without dare',
    {
      ...game,
      phase: 'challenge',
      turn: { answererId: 'a', askerId: 'b', kind: 'dare', dare: null, noDareAvailable: false },
    },
  ],
  ['missing score', { ...game, scores: {} }],
])('rejects %s', (_, value) => {
  expect(isValidGame(value)).toBe(false)
})

test('a malformed saved game is not offered for resuming', () => {
  localStorage.setItem(
    'av:game',
    JSON.stringify({ state: { game: { phase: 'choosing' } }, version: 1 }),
  )
  expect(hasResumableGame()).toBe(false)
})

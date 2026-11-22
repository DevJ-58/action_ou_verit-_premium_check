import { createGame, EMPTY_SCORE } from '@/engine'
import { makePlayer } from '@/engine/testing'
import { createStatsStore } from './statsStore'

const game = {
  ...createGame({
    id: 'g1',
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
  }),
  phase: 'finished' as const,
  scores: { a: { ...EMPTY_SCORE, done: 2, skipped: 1 }, b: { ...EMPTY_SCORE, done: 1 } },
}

test('records a finished game once per id', () => {
  const store = createStatsStore()
  store.getState().recordGame(game)
  store.getState().recordGame(game)
  expect(store.getState().statsFor('a')).toEqual({ games: 1, done: 2, skipped: 1 })
  expect(store.getState().statsFor('b')).toEqual({ games: 1, done: 1, skipped: 0 })
})

test('accumulates across games and knows nothing about unknown players', () => {
  const store = createStatsStore()
  store.getState().recordGame(game)
  store.getState().recordGame({ ...game, id: 'g2' })
  expect(store.getState().statsFor('a')).toEqual({ games: 2, done: 4, skipped: 2 })
  expect(store.getState().statsFor('zzz')).toEqual({ games: 0, done: 0, skipped: 0 })
})

test('ignores games that are not finished', () => {
  const store = createStatsStore()
  store.getState().recordGame({ ...game, phase: 'ready' })
  expect(store.getState().statsFor('a').games).toBe(0)
})

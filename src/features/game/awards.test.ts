import { createGame, EMPTY_SCORE, type GameState, type PlayerScore } from '@/engine'
import { makePlayer } from '@/engine/testing'
import { computeAwards } from './awards'

function finished(scores: Record<string, Partial<PlayerScore>>): GameState {
  const ids = Object.keys(scores)
  const game = createGame({
    id: 'g',
    players: ids.map((id) => makePlayer(id)),
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
  return {
    ...game,
    phase: 'finished',
    scores: Object.fromEntries(ids.map((id) => [id, { ...EMPTY_SCORE, ...scores[id] }])),
  }
}

test('gives each title to the best player for it', () => {
  const state = finished({
    a: { points: 5, dares: 2, truths: 1, skipped: 0 },
    b: { points: 3, dares: 0, truths: 3, skipped: 0 },
    c: { points: -1, dares: 0, truths: 0, skipped: 1 },
  })
  expect(computeAwards(state)).toEqual([
    { award: 'winner', playerId: 'a' },
    { award: 'bravest', playerId: 'a' },
    { award: 'truthKing', playerId: 'b' },
    { award: 'escapeArtist', playerId: 'c' },
  ])
})

test('on a tie, the first player in seat order wins the title', () => {
  const state = finished({ a: { points: 2, dares: 1 }, b: { points: 2, dares: 1 } })
  expect(computeAwards(state)).toContainEqual({ award: 'winner', playerId: 'a' })
  expect(computeAwards(state)).toContainEqual({ award: 'bravest', playerId: 'a' })
})

test('no escape artist when nobody skipped, no title without anyone eligible', () => {
  const state = finished({ a: { points: 1, truths: 1 }, b: {} })
  const awards = computeAwards(state).map((a) => a.award)
  expect(awards).toEqual(['winner', 'truthKing'])
})

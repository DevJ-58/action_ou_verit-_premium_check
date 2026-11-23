import { createGame, createSeededRng, reduce, type GameAction, type GameState } from '@/engine'
import { makeDare, makePlayer } from '@/engine/testing'
import { EMPTY_ACCOUNT_STATS, recordAccountGame, sanitizeStats } from './accountStats'

function finishedGame(id = 'g1'): GameState {
  const ctx = {
    rng: createSeededRng(2),
    systemDares: [makeDare('d'), makeDare('t', { kind: 'truth' })],
  }
  let g = createGame({
    id,
    settings: {
      mode: 'remote',
      categories: ['fun'],
      source: 'system',
      rounds: 1,
      timerSeconds: 0,
      maxSkips: 3,
      picker: 'bottle',
    },
    players: [makePlayer('me'), makePlayer('you')],
  })
  const run = (a: GameAction) => (g = reduce(g, a, ctx))
  for (let i = 0; i < 2; i++) {
    run({ type: 'SPIN' })
    run({ type: 'SPIN_SETTLED' })
    const mine = g.turn!.answererId === 'me'
    run({ type: 'CHOOSE_KIND', kind: mine ? 'truth' : 'dare' })
    run(mine ? { type: 'COMPLETE' } : { type: 'SKIP' })
  }
  return g
}

test('a finished game adds the player’s results and a win when they lead', () => {
  const stats = recordAccountGame(EMPTY_ACCOUNT_STATS, finishedGame(), 'me')
  expect(stats).toMatchObject({ games: 1, wins: 1, truths: 1, dares: 0, skipped: 0 })
  expect(stats.points).toBeGreaterThan(0)
  const other = recordAccountGame(EMPTY_ACCOUNT_STATS, finishedGame(), 'you')
  expect(other).toMatchObject({ games: 1, wins: 0, skipped: 1 })
})

test('the same game is never counted twice; unfinished games and absent players are ignored', () => {
  const game = finishedGame()
  const once = recordAccountGame(EMPTY_ACCOUNT_STATS, game, 'me')
  expect(recordAccountGame(once, game, 'me')).toBe(once)
  expect(recordAccountGame(EMPTY_ACCOUNT_STATS, { ...game, phase: 'ready' }, 'me')).toBe(
    EMPTY_ACCOUNT_STATS,
  )
  expect(recordAccountGame(EMPTY_ACCOUNT_STATS, game, 'ghost')).toBe(EMPTY_ACCOUNT_STATS)
})

test('saved stats of any shape are read safely', () => {
  expect(sanitizeStats(undefined)).toEqual(EMPTY_ACCOUNT_STATS)
  expect(sanitizeStats({ games: 3, wins: 'x', gameIds: ['a', 2] })).toEqual({
    ...EMPTY_ACCOUNT_STATS,
    games: 3,
    gameIds: ['a'],
  })
})

test('without a server, a room game is counted on this phone, once', async () => {
  const { act } = await import('@testing-library/react')
  const { accountStore } = await import('./accountStore')
  await act(() => accountStore.getState().signOut())
  await act(() =>
    accountStore.getState().signUp(`rg-${Date.now()}@example.com`, 'motdepasse', 'Awa'),
  )
  const id = accountStore.getState().session!.profile.id
  const game = {
    id: 'room-game',
    phase: 'finished' as const,
    scores: { [id]: { done: 1, skipped: 0, points: 2, truths: 0, dares: 1 } },
  }
  await act(() => accountStore.getState().recordRoomGame('ABCDEF', game))
  await act(() => accountStore.getState().recordRoomGame('ABCDEF', game))
  expect(accountStore.getState().session!.profile.stats).toMatchObject({
    games: 1,
    wins: 1,
    dares: 1,
  })
  await act(() => accountStore.getState().init())
  expect(accountStore.getState().session!.profile.stats).toMatchObject({ games: 1 })
})

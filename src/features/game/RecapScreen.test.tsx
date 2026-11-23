import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { createGame, EMPTY_SCORE, type GameState } from '@/engine'
import { makePlayer } from '@/engine/testing'
import { statsStore } from '@/features/players/statsStore'
import { settingsStore } from '@/features/settings/settingsStore'
import { gameStore } from './gameStore'

const finished: GameState = {
  ...createGame({
    id: 'g-recap',
    players: [makePlayer('a', { name: 'Awa' }), makePlayer('k', { name: 'Kofi' })],
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
  phase: 'finished',
  scores: {
    a: { ...EMPTY_SCORE, points: 1, done: 1, truths: 1 },
    k: { ...EMPTY_SCORE, points: 4, done: 2, dares: 2 },
  },
}

beforeEach(() => {
  act(() => {
    settingsStore.getState().confirmAge()
    statsStore.setState({ recordedGameIds: [], byPlayer: {} })
    gameStore.setState({ game: finished, error: null })
  })
})

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

test('a finished game opens the recap with the ranking and titles', async () => {
  const router = renderAt('/partie')
  expect(
    await screen.findByRole('heading', { name: /kofi remporte la partie/i }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/partie/recap')
  const ranking = screen.getByRole('list', { name: /classement/i })
  const items = within(ranking)
    .getAllByRole('listitem')
    .map((li) => li.textContent)
  expect(items[0]).toMatch(/kofi.*4/i)
  expect(screen.getByText(/le plus courageux/i)).toBeInTheDocument()
})

test('the recap records stats exactly once', async () => {
  renderAt('/partie/recap')
  await screen.findByRole('heading', { name: /remporte/i })
  expect(statsStore.getState().statsFor('k')).toEqual({ games: 1, done: 2, skipped: 0 })
})

test('“Rejouer” restarts with the same players', async () => {
  const router = renderAt('/partie/recap')
  await userEvent.click(await screen.findByRole('button', { name: /rejouer/i }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/partie'))
  expect(gameStore.getState().game!.phase).toBe('ready')
  expect(gameStore.getState().game!.players.map((p) => p.name)).toEqual(['Awa', 'Kofi'])
})

test('without a finished game the recap goes home', async () => {
  act(() => gameStore.setState({ game: null, error: null }))
  renderAt('/partie/recap')
  expect(await screen.findByRole('link', { name: /jouer sur ce téléphone/i })).toBeInTheDocument()
})

test('on one phone, the game counts in the profile of the account that played under its own nickname', async () => {
  const { accountStore } = await import('@/features/account/accountStore')
  await act(() =>
    accountStore.getState().signUp(`one-${Date.now()}@example.com`, 'motdepasse', 'kofi'),
  )
  renderAt('/partie/recap')
  await waitFor(() =>
    expect(accountStore.getState().session!.profile.stats).toMatchObject({
      games: 1,
      wins: 1,
      dares: 2,
      points: 4,
    }),
  )
  await act(() => accountStore.getState().signOut())
})

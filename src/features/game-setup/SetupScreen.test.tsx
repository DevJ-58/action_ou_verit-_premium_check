import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { gameStore } from '@/features/game/gameStore'
import { playersStore } from '@/features/players/playersStore'
import { settingsStore } from '@/features/settings/settingsStore'

function renderSetup() {
  const router = createMemoryRouter(routes, { initialEntries: ['/partie/nouvelle'] })
  render(<RouterProvider router={router} />)
  return router
}

function addPlayers(...names: string[]) {
  act(() => {
    for (const name of names) playersStore.getState().addPlayer({ name, avatar: '' })
  })
}

beforeEach(() => {
  act(() => {
    settingsStore.getState().confirmAge()
    playersStore.setState({ players: [] })
    gameStore.setState({ game: null, error: null })
  })
})

const launch = () => screen.findByRole('button', { name: /lancer la partie/i })

test('launch is disabled with fewer than 2 players', async () => {
  addPlayers('Awa')
  renderSetup()
  await userEvent.click(await screen.findByRole('button', { name: /juste pour rire/i }))
  expect(await launch()).toBeDisabled()
})

test('launch is disabled until a category is chosen', async () => {
  addPlayers('Awa', 'Kofi')
  renderSetup()
  expect(await launch()).toBeDisabled()
  await userEvent.click(screen.getByRole('button', { name: /juste pour rire/i }))
  expect(await launch()).toBeEnabled()
})

test('warns about a player whose limits exclude every chosen category, without blocking', async () => {
  addPlayers('Awa', 'Kofi')
  act(() => {
    const awa = playersStore.getState().players[0]!
    playersStore
      .getState()
      .updatePlayer(awa.id, { limits: { excludedCategories: ['fun'], maxIntensity: 4 } })
  })
  renderSetup()
  await userEvent.click(await screen.findByRole('button', { name: /juste pour rire/i }))
  expect(screen.getByText(/awa.*aucune catégorie/i)).toBeInTheDocument()
  expect(await launch()).toBeEnabled()
})

test('launching starts a game with the default settings and opens the table', async () => {
  addPlayers('Awa', 'Kofi')
  const router = renderSetup()
  await userEvent.click(await screen.findByRole('button', { name: /juste pour rire/i }))
  await userEvent.click(await launch())
  const game = gameStore.getState().game!
  expect(game.settings).toEqual({
    mode: 'nearby',
    categories: ['fun'],
    source: 'both',
    rounds: 3,
    timerSeconds: 0,
    maxSkips: 3,
    picker: 'bottle',
  })
  expect(game.players.map((p) => p.name)).toEqual(['Awa', 'Kofi'])
  expect(router.state.location.pathname).toBe('/partie')
})

test('players can be reordered around the table', async () => {
  addPlayers('Awa', 'Kofi')
  renderSetup()
  await userEvent.click(await screen.findByRole('button', { name: /descendre awa/i }))
  await userEvent.click(screen.getByRole('button', { name: /juste pour rire/i }))
  await userEvent.click(await launch())
  expect(gameStore.getState().game!.players.map((p) => p.name)).toEqual(['Kofi', 'Awa'])
})

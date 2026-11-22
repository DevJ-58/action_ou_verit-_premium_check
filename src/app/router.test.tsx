import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createGame } from '@/engine'
import { makePlayer } from '@/engine/testing'
import { gameStore } from '@/features/game/gameStore'
import { settingsStore, SETTINGS_DEFAULTS } from '@/features/settings/settingsStore'
import { routes } from './router'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  act(() => settingsStore.setState({ ...SETTINGS_DEFAULTS }))
})

test('without age confirmation, home redirects to the age gate', async () => {
  const router = renderAt('/')
  expect(await screen.findByRole('heading', { name: /réservé aux adultes/i })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/bienvenue')
})

test('confirming the age leads to home', async () => {
  renderAt('/')
  await userEvent.click(await screen.findByRole('button', { name: /j’ai 18 ans ou plus/i }))
  expect(await screen.findByRole('link', { name: /jouer sur ce téléphone/i })).toBeInTheDocument()
  expect(settingsStore.getState().ageConfirmedAt).not.toBeNull()
})

test('declaring under 18 shows an exit message and no access', async () => {
  renderAt('/')
  await userEvent.click(await screen.findByRole('button', { name: /j’ai moins de 18 ans/i }))
  expect(await screen.findByText(/réservée aux adultes/i)).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /jouer sur ce téléphone/i })).not.toBeInTheDocument()
  expect(settingsStore.getState().ageConfirmedAt).toBeNull()
})

describe('with age confirmed', () => {
  beforeEach(() => {
    act(() => settingsStore.getState().confirmAge())
  })

  test('the bottom navigation is shown on home but not during a game', async () => {
    renderAt('/')
    const nav = await screen.findByRole('navigation', { name: /navigation principale/i })
    expect(within(nav).getAllByRole('link')).toHaveLength(4)
  })

  test('the bottom navigation is hidden on the game screen', async () => {
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
    act(() => gameStore.setState({ game, error: null }))
    renderAt('/partie')
    await screen.findByRole('button', { name: /tourner la bouteille/i })
    expect(
      screen.queryByRole('navigation', { name: /navigation principale/i }),
    ).not.toBeInTheDocument()
  })

  test('switching the language in Profil translates the app', async () => {
    renderAt('/profil')
    await userEvent.click(await screen.findByRole('radio', { name: 'English' }))
    expect(await screen.findByRole('link', { name: 'Play' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })

  test('choosing the Ivoire theme in Profil applies it to the page', async () => {
    renderAt('/profil')
    await userEvent.click(await screen.findByRole('radio', { name: /ivoire/i }))
    expect(document.documentElement.dataset.theme).toBe('ivoire')
  })
})

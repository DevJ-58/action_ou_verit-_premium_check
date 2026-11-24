import { act, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { createGame } from '@/engine'
import { makePlayer } from '@/engine/testing'
import { gameStore } from '@/features/game/gameStore'
import { settingsStore } from '@/features/settings/settingsStore'

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

beforeEach(() => act(() => settingsStore.getState().confirmAge()))

function renderHome() {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />)
}

test('offers to resume a game in progress', async () => {
  act(() => gameStore.setState({ game, error: null }))
  renderHome()
  expect(await screen.findByRole('button', { name: /reprendre la partie/i })).toBeInTheDocument()
})

test('does not offer to resume when there is no game or it is finished', async () => {
  act(() => gameStore.setState({ game: { ...game, phase: 'finished' }, error: null }))
  renderHome()
  await screen.findByRole('link', { name: /jouer sur ce téléphone/i })
  expect(screen.queryByRole('button', { name: /reprendre/i })).not.toBeInTheDocument()
})

test('the “?” button starts the home guide; “Comment jouer” leads to the rules', async () => {
  const { stopTour, tourStore } = await import('@/features/guide/tourStore')
  stopTour()
  renderHome()
  const { default: userEvent } = await import('@testing-library/user-event')
  await userEvent.click(await screen.findByRole('button', { name: /guide de l’écran/i }))
  expect(tourStore.getState().active).toBe('home')
  act(() => stopTour())
  expect(screen.getByRole('link', { name: /comment jouer/i })).toHaveAttribute('href', '/regles')
  for (const target of ['play-here', 'create-room', 'join-room', 'nav', 'rules']) {
    expect(document.querySelector(`[data-tour="${target}"]`)).not.toBeNull()
  }
})

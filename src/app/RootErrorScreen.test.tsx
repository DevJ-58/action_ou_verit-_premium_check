import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { gameStore } from '@/features/game/gameStore'
import { settingsStore } from '@/features/settings/settingsStore'
import type { GameState } from '@/engine'
import { routes } from './router'

test('a crash shows a recovery screen that can reset local data', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  act(() => {
    settingsStore.getState().confirmAge()
    gameStore.setState({
      game: { phase: 'choosing', players: [] } as unknown as GameState,
      error: null,
    })
  })
  localStorage.setItem('av:players', '{"state":{"players":[]},"version":1}')
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/partie'] })} />)
  expect(
    await screen.findByRole('heading', { name: /quelque chose s’est mal passé/i }),
  ).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /réinitialiser/i }))
  await waitFor(() => expect(gameStore.getState().game).toBeNull())
  expect(localStorage.getItem('av:players')).toBeNull()
})

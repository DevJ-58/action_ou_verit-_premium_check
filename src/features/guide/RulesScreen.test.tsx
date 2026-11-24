import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { pointsFor } from '@/engine'
import { settingsStore } from '@/features/settings/settingsStore'
import { stopTour, tourStore } from './tourStore'

beforeEach(() => act(() => settingsStore.getState().confirmAge()))

function renderRules() {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/regles'] })} />)
}

test('/regles lists the five numbered steps of how to play', async () => {
  renderRules()
  expect(
    await screen.findByRole('heading', { level: 1, name: /comment jouer/i }),
  ).toBeInTheDocument()
  const list = screen.getByRole('list', { name: /étapes/i })
  const steps = within(list)
    .getAllByRole('listitem')
    .filter((item) => item.parentElement === list)
  expect(steps).toHaveLength(5)
  expect(steps[2]).toHaveTextContent(/à distance/i)
})

test('the points shown are the game’s own', async () => {
  renderRules()
  const points = await screen.findByText(/vérité réussie/i)
  expect(points).toHaveTextContent(`${pointsFor('truth', 'done')} pts`)
  expect(points).toHaveTextContent(`${pointsFor('dare', 'done')} pts`)
  expect(points).toHaveTextContent(`${pointsFor('truth', 'skipped')} pt`)
})

test('“Lancer le guide” goes home and starts its guide', async () => {
  stopTour()
  renderRules()
  await userEvent.click(await screen.findByRole('button', { name: /lancer le guide/i }))
  expect(tourStore.getState().active).toBe('home')
  act(() => stopTour())
})

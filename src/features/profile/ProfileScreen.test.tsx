import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { accountStore } from '@/features/account/accountStore'
import { settingsStore } from '@/features/settings/settingsStore'

function renderAt(path = '/profil') {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
}

beforeEach(async () => {
  act(() => settingsStore.getState().confirmAge())
  await act(() => accountStore.getState().signOut())
})

test('signed out, the profile invites to create an account and links to the settings', async () => {
  renderAt()
  expect(
    await screen.findByRole('link', { name: /créer un compte ou se connecter/i }),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /réglages/i })).toHaveAttribute('href', '/reglages')
  expect(screen.queryByRole('radiogroup', { name: /thème/i })).not.toBeInTheDocument()
})

describe('signed in', () => {
  beforeEach(async () => {
    await act(() => accountStore.getState().signUp('awa@example.com', 'motdepasse', 'Awa'))
    await act(() =>
      accountStore.getState().updateProfile({
        bio: 'Toujours partante',
        stats: { games: 4, wins: 2, truths: 5, dares: 3, skipped: 1, points: 21, gameIds: [] },
      }),
    )
  })

  test('shows who the player is and their stats, without the settings', async () => {
    renderAt()
    expect(await screen.findByRole('heading', { name: 'Awa' })).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: 'Awa' })[0]!.tagName).toBe('IMG')
    expect(screen.getByText('Toujours partante')).toBeInTheDocument()
    const stats = screen.getByRole('list', { name: /statistiques/i })
    expect(stats).toHaveTextContent(/4\s*parties/i)
    expect(stats).toHaveTextContent(/2\s*victoires/i)
    expect(stats).toHaveTextContent(/5\s*vérités/i)
    expect(stats).toHaveTextContent(/3\s*actions/i)
    expect(stats).toHaveTextContent(/21\s*points/i)
    expect(screen.queryByRole('radiogroup', { name: /avatar/i })).not.toBeInTheDocument()
  })

  test('links to the player’s dares and to the settings', async () => {
    renderAt()
    expect(await screen.findByRole('link', { name: /défis prêts à poser/i })).toHaveAttribute(
      'href',
      '/defis',
    )
    await userEvent.click(screen.getByRole('link', { name: /réglages/i }))
    expect(await screen.findByRole('heading', { name: /réglages/i })).toBeInTheDocument()
  })
})

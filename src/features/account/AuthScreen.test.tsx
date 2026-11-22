import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { settingsStore } from '@/features/settings/settingsStore'
import { accountStore } from './accountStore'
import { AuthScreen } from './AuthScreen'
import { RequireAccount } from './RequireAccount'

function renderRoutes(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/compte', element: <AuthScreen /> },
      { element: <RequireAccount />, children: [{ path: '/prive', element: <p>Zone privée</p> }] },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(async () => {
  act(() => settingsStore.getState().confirmAge())
  await act(() => accountStore.getState().signOut())
})

test('a private page sends a signed-out player to the account screen, then back', async () => {
  const router = renderRoutes('/prive')
  await screen.findByRole('heading', { name: /ton compte/i })
  expect(router.state.location.search).toContain('next=%2Fprive')
  await userEvent.click(screen.getByRole('radio', { name: /créer un compte/i }))
  await userEvent.type(screen.getByLabelText('Pseudo'), 'Awa')
  await userEvent.type(screen.getByLabelText('E-mail'), 'awa@example.com')
  await userEvent.type(screen.getByLabelText('Mot de passe'), 'motdepasse')
  await userEvent.click(screen.getByRole('button', { name: /^créer mon compte$/i }))
  expect(await screen.findByText('Zone privée')).toBeInTheDocument()
  expect(accountStore.getState().session?.profile.pseudo).toBe('Awa')
})

test('a wrong password shows a clear message', async () => {
  await act(() => accountStore.getState().signUp('kofi@example.com', 'motdepasse', 'Kofi'))
  await act(() => accountStore.getState().signOut())
  renderRoutes('/compte')
  await userEvent.type(await screen.findByLabelText('E-mail'), 'kofi@example.com')
  await userEvent.type(screen.getByLabelText('Mot de passe'), 'pasbonpasbon')
  await userEvent.click(screen.getByRole('button', { name: /^se connecter$/i }))
  expect(await screen.findByText(/e-mail ou mot de passe incorrect/i)).toBeInTheDocument()
})

test('signing up with a taken nickname format is validated before sending', async () => {
  renderRoutes('/compte')
  await userEvent.click(await screen.findByRole('radio', { name: /créer un compte/i }))
  await userEvent.type(screen.getByLabelText('E-mail'), 'x@example.com')
  await userEvent.type(screen.getByLabelText('Mot de passe'), 'motdepasse')
  await userEvent.click(screen.getByRole('button', { name: /^créer mon compte$/i }))
  expect(await screen.findByText(/choisis un pseudo/i)).toBeInTheDocument()
  await waitFor(() => expect(accountStore.getState().session).toBeNull())
})

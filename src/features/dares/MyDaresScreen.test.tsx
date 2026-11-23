import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { systemDares } from '@/content/systemDares'
import { accountStore } from '@/features/account/accountStore'
import { endTrial } from '@/features/premium/testing'
import { settingsStore } from '@/features/settings/settingsStore'

const renderDares = () =>
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/defis'] })} />)
const mine = () => accountStore.getState().session!.profile.customDares

beforeEach(async () => {
  act(() => settingsStore.getState().confirmAge())
  await act(() => accountStore.getState().signOut())
})

test('signed out, the library invites to sign in to keep dares on the account', async () => {
  renderDares()
  expect(await screen.findByRole('link', { name: /se connecter/i })).toBeInTheDocument()
})

describe('signed in', () => {
  beforeEach(async () => {
    await act(() => accountStore.getState().signUp('kofi@example.com', 'motdepasse', 'Kofi'))
  })

  test('creates a dare in advance; it is kept on the account', async () => {
    renderDares()
    await userEvent.click(await screen.findByRole('button', { name: /créer un défi/i }))
    await userEvent.type(screen.getByLabelText(/texte du défi/i), 'Chante le refrain de ton choix')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(mine().map((d) => d.text)).toEqual(['Chante le refrain de ton choix'])
    expect(mine()[0]!.authorId).toBe(accountStore.getState().session!.profile.id)
    const list = screen.getByRole('list', { name: /ma bibliothèque/i })
    expect(within(list).getByText('Chante le refrain de ton choix')).toBeInTheDocument()
  })

  test('filters the library by type and removes a dare', async () => {
    await act(() =>
      accountStore.getState().updateProfile({
        customDares: [
          { ...systemDares.find((d) => d.kind === 'truth')!, id: 'c1', authorId: 'x' },
          { ...systemDares.find((d) => d.kind === 'dare')!, id: 'c2', authorId: 'x' },
        ],
      }),
    )
    renderDares()
    const list = await screen.findByRole('list', { name: /ma bibliothèque/i })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    await userEvent.click(screen.getByRole('radio', { name: /^vérités/i }))
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    await userEvent.click(within(list).getByRole('button', { name: /supprimer/i }))
    expect(mine().map((d) => d.id)).toEqual(['c2'])
  })

  test('adds game dares to the library from a category', async () => {
    renderDares()
    await userEvent.click(await screen.findByRole('button', { name: /ajouter depuis le jeu/i }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /juste pour rire/i }))
    const first = within(dialog).getAllByRole('button', { name: /^ajouter :/i })[0]!
    await userEvent.click(first)
    expect(mine()).toHaveLength(1)
    expect(mine()[0]!.category).toBe('fun')
    expect(systemDares.some((d) => d.text === mine()[0]!.text)).toBe(true)
    expect(within(dialog).getAllByRole('button', { name: /déjà dans mes défis/i })).toHaveLength(1)
  })
})

describe('free players keep 5 own dares', () => {
  beforeEach(async () => {
    await act(() =>
      accountStore.getState().signUp(`l-${Date.now()}@example.com`, 'motdepasse', 'Lou'),
    )
    await endTrial()
    const five = systemDares.slice(0, 5).map((d, i) => ({ ...d, id: `c${i}`, authorId: 'x' }))
    await act(() => accountStore.getState().updateProfile({ customDares: five }))
  })

  test('at 5, creating or adding another one explains Premium instead', async () => {
    renderDares()
    expect(await screen.findByText('5 / 5')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /créer un défi/i }))
    expect(await screen.findByRole('dialog')).toHaveTextContent(/5 défis perso/i)
    expect(mine()).toHaveLength(5)
  })
})

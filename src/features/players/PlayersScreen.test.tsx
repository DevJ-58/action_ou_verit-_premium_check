import { act, render, screen, waitForElementToBeRemoved, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { settingsStore } from '@/features/settings/settingsStore'
import { playersStore } from './playersStore'

beforeEach(() => {
  act(() => {
    settingsStore.getState().confirmAge()
    playersStore.setState({ players: [] })
  })
})

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
}

test('adds players and refuses a duplicate nickname', async () => {
  renderAt('/joueurs')
  await userEvent.click(await screen.findByRole('button', { name: /ajouter un joueur/i }))
  await userEvent.type(screen.getByLabelText('Pseudo'), 'Awa{Enter}')
  expect(await screen.findByRole('link', { name: /awa/i })).toBeInTheDocument()
  await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))

  await userEvent.click(screen.getByRole('button', { name: /ajouter un joueur/i }))
  await userEvent.type(screen.getByLabelText('Pseudo'), 'awa{Enter}')
  expect(await screen.findByText(/déjà pris/i)).toBeInTheDocument()
  expect(playersStore.getState().players).toHaveLength(1)
})

test('a player page edits limits and creates a custom dare', async () => {
  const awa = playersStore.getState().addPlayer({ name: 'Awa', avatar: '' })
  renderAt(`/joueurs/${awa.id}`)
  await userEvent.click(await screen.findByRole('radio', { name: '2' }))
  expect(playersStore.getState().players[0]!.limits.maxIntensity).toBe(2)

  await userEvent.click(screen.getByRole('button', { name: /créer un défi/i }))
  await userEvent.type(screen.getByLabelText(/texte du défi/i), 'Danse la salsa')
  await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
  expect(await screen.findByText('Danse la salsa')).toBeInTheDocument()
  expect(playersStore.getState().players[0]!.customDares).toHaveLength(1)
})

test('deleting a player asks for confirmation first', async () => {
  const awa = playersStore.getState().addPlayer({ name: 'Awa', avatar: '' })
  renderAt(`/joueurs/${awa.id}`)
  await userEvent.click(await screen.findByRole('button', { name: /supprimer ce joueur/i }))
  expect(playersStore.getState().players).toHaveLength(1)
  const dialog = await screen.findByRole('dialog', { name: /supprimer awa/i })
  await userEvent.click(within(dialog).getByRole('button', { name: /^supprimer$/i }))
  expect(playersStore.getState().players).toHaveLength(0)
})

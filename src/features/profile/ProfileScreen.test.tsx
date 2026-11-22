import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { AVATARS } from '@/content/avatars'
import { accountStore } from '@/features/account/accountStore'
import { settingsStore } from '@/features/settings/settingsStore'

function renderProfile() {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/profil'] })} />)
}

beforeEach(async () => {
  act(() => settingsStore.getState().confirmAge())
  await act(() => accountStore.getState().signOut())
})

test('signed out, the profile invites to create an account but keeps appearance settings', async () => {
  renderProfile()
  expect(
    await screen.findByRole('link', { name: /créer un compte ou se connecter/i }),
  ).toBeInTheDocument()
  expect(screen.getByRole('radiogroup', { name: /thème/i })).toBeInTheDocument()
})

describe('signed in', () => {
  beforeEach(async () => {
    await act(() => accountStore.getState().signUp('awa@example.com', 'motdepasse', 'Awa'))
  })

  test('shows the player’s space with their 3D avatar and pseudo', async () => {
    renderProfile()
    expect(await screen.findByRole('heading', { name: 'Awa' })).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: 'Awa' })[0]!.tagName).toBe('IMG')
  })

  test('choosing an avatar in the gallery updates the profile', async () => {
    renderProfile()
    const gallery = await screen.findByRole('radiogroup', { name: /avatar/i })
    const target = AVATARS.find((a) => a.id !== accountStore.getState().session!.profile.avatarId)!
    await userEvent.click(within(gallery).getByRole('radio', { name: target.label }))
    expect(accountStore.getState().session!.profile.avatarId).toBe(target.id)
  })

  test('the bio is limited to 160 characters and saved', async () => {
    renderProfile()
    const bio = await screen.findByLabelText(/bio/i)
    await userEvent.type(bio, 'a'.repeat(170))
    await userEvent.tab()
    expect(accountStore.getState().session!.profile.bio).toHaveLength(160)
    expect(screen.getByText('160 / 160')).toBeInTheDocument()
  })

  test('dares created in the profile are the player’s own dares', async () => {
    renderProfile()
    await userEvent.click(await screen.findByRole('button', { name: /créer un défi/i }))
    await userEvent.type(screen.getByLabelText(/texte du défi/i), 'Raconte ta pire danse')
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
    expect(accountStore.getState().session!.profile.customDares.map((d) => d.text)).toEqual([
      'Raconte ta pire danse',
    ])
  })

  test('signing out returns to the signed-out profile', async () => {
    renderProfile()
    await userEvent.click(await screen.findByRole('button', { name: /se déconnecter/i }))
    expect(
      await screen.findByRole('link', { name: /créer un compte ou se connecter/i }),
    ).toBeInTheDocument()
  })
})

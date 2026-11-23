import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { AVATARS } from '@/content/avatars'
import { accountStore } from '@/features/account/accountStore'
import { endTrial } from '@/features/premium/testing'
import { settingsStore } from '@/features/settings/settingsStore'

function renderSettings() {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/reglages'] })} />)
}

beforeEach(async () => {
  act(() => settingsStore.getState().confirmAge())
  await act(() => accountStore.getState().signOut())
})

test('signed out: appearance, language, music, sounds and vibrations', async () => {
  renderSettings()
  expect(await screen.findByRole('radiogroup', { name: /thème/i })).toBeInTheDocument()
  expect(screen.getByRole('radiogroup', { name: /langue/i })).toBeInTheDocument()
  const before = settingsStore.getState().music
  await userEvent.click(screen.getByRole('switch', { name: /musique/i }))
  expect(settingsStore.getState().music).toBe(!before)
  expect(screen.getByRole('switch', { name: /^sons/i })).toBeInTheDocument()
  expect(screen.getByRole('switch', { name: /vibrations/i })).toBeInTheDocument()
  expect(screen.queryByRole('radiogroup', { name: /avatar/i })).not.toBeInTheDocument()
})

describe('signed in', () => {
  beforeEach(async () => {
    await act(() => accountStore.getState().signUp('awa@example.com', 'motdepasse', 'Awa'))
  })

  test('choosing an avatar in the gallery updates the profile', async () => {
    renderSettings()
    const gallery = await screen.findByRole('radiogroup', { name: /avatar/i })
    const target = AVATARS.find((a) => a.id !== accountStore.getState().session!.profile.avatarId)!
    await userEvent.click(within(gallery).getByRole('radio', { name: target.label }))
    expect(accountStore.getState().session!.profile.avatarId).toBe(target.id)
  })

  test('the pseudo can be changed and is validated', async () => {
    renderSettings()
    const pseudo = await screen.findByLabelText(/^pseudo/i)
    await userEvent.clear(pseudo)
    await userEvent.type(pseudo, 'Awa K.')
    await userEvent.tab()
    expect(accountStore.getState().session!.profile.pseudo).toBe('Awa K.')
    await userEvent.clear(pseudo)
    await userEvent.tab()
    expect(accountStore.getState().session!.profile.pseudo).toBe('Awa K.')
  })

  test('the bio is limited to 160 characters and saved', async () => {
    renderSettings()
    const bio = await screen.findByLabelText(/bio/i)
    await userEvent.type(bio, 'a'.repeat(170))
    await userEvent.tab()
    expect(accountStore.getState().session!.profile.bio).toHaveLength(160)
  })

  test('signing out goes back to the signed-out profile', async () => {
    renderSettings()
    await userEvent.click(await screen.findByRole('button', { name: /se déconnecter/i }))
    expect(
      await screen.findByRole('link', { name: /créer un compte ou se connecter/i }),
    ).toBeInTheDocument()
  })
})

describe('Premium looks', () => {
  beforeEach(async () => {
    await act(() =>
      accountStore.getState().signUp(`look-${Date.now()}@example.com`, 'motdepasse', 'Zoé'),
    )
  })

  test('free players see Premium avatars and themes locked', async () => {
    await endTrial()
    renderSettings()
    const gallery = await screen.findByRole('radiogroup', { name: /avatar/i })
    const before = accountStore.getState().session!.profile.avatarId
    await userEvent.click(within(gallery).getByRole('radio', { name: /dragon/i }))
    expect(accountStore.getState().session!.profile.avatarId).toBe(before)
    expect(await screen.findByRole('dialog')).toHaveTextContent(/réservé au premium/i)
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('radio', { name: /kente/i }))
    expect(settingsStore.getState().theme).not.toBe('kente')
  })

  test('Premium players can use them', async () => {
    const until = new Date(Date.now() + 3600e3).toISOString()
    act(() => accountStore.setState((s) => ({ session: { ...s.session!, premiumUntil: until } })))
    renderSettings()
    const gallery = await screen.findByRole('radiogroup', { name: /avatar/i })
    await userEvent.click(within(gallery).getByRole('radio', { name: /dragon/i }))
    expect(accountStore.getState().session!.profile.avatarId).toBe('1f409')
    await userEvent.click(screen.getByRole('radio', { name: /kente/i }))
    expect(settingsStore.getState().theme).toBe('kente')
  })
})

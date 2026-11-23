import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { accountStore } from '@/features/account/accountStore'
import { createInMemoryBus } from '@/features/room/bus'
import { resetActiveRoom, setRoomTransport } from '@/features/room/activeRoom'
import { createLocalTransport } from '@/features/room/localTransport'
import { MemberList } from '@/features/room/MemberList'
import { settingsStore } from '@/features/settings/settingsStore'
import { setInviteTransport } from './getInviteTransport'
import { setSocial } from './getSocial'
import { createLocalInvites } from './localInvites'
import { createLocalSocial } from './localSocial'
import { resetMyInvites } from './myInvites'
import { refreshSocial, socialHub } from './socialHub'

let bus: ReturnType<typeof createInMemoryBus>

beforeEach(async () => {
  localStorage.clear()
  sessionStorage.clear()
  bus = createInMemoryBus()
  setInviteTransport(createLocalInvites(bus))
  setSocial(createLocalSocial(bus))
  setRoomTransport(createLocalTransport(bus))
  resetActiveRoom()
  resetMyInvites()
  act(() => settingsStore.getState().confirmAge())
  await act(() => accountStore.getState().signOut())
})

async function player(pseudo: string) {
  await act(() => accountStore.getState().signOut())
  await act(() =>
    accountStore.getState().signUp(`${pseudo}-${Date.now()}@example.com`, 'motdepasse', pseudo),
  )
  const p = accountStore.getState().session!.profile
  return { id: p.id, pseudo: p.pseudo, avatarId: p.avatarId, limits: p.limits, customDares: [] }
}
async function switchTo(id: string) {
  sessionStorage.setItem('av:session', id)
  localStorage.setItem('av:session', id)
  await act(() => accountStore.getState().init())
  await act(() => refreshSocial())
}
const renderAt = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

test('in the waiting room, “+ Ami” sends a friend request (not a friendship yet)', async () => {
  const kofi = await player('Kofi')
  const awa = await player('Awa')
  render(<MemberList members={[awa, kofi]} hostId={awa.id} selfId={awa.id} online={new Set()} />)
  await userEvent.click(screen.getByRole('button', { name: /demander kofi en ami/i }))
  expect(await screen.findByText(/demande envoyée/i)).toBeInTheDocument()
  expect(accountStore.getState().session!.profile.friends).toEqual([])
})

test('the request pops up for the other player; accepting makes both friends', async () => {
  const kofi = await player('Kofi')
  const awa = await player('Awa')
  render(<MemberList members={[awa, kofi]} hostId={awa.id} selfId={awa.id} online={new Set()} />)
  await userEvent.click(screen.getByRole('button', { name: /demander kofi en ami/i }))
  await screen.findByText(/demande envoyée/i)

  await switchTo(kofi.id)
  renderAt('/')
  const toast = await screen.findByRole('region', { name: /demande d’ami/i })
  expect(toast).toHaveTextContent(/awa veut être ton ami/i)
  await userEvent.click(within(toast).getByRole('button', { name: /accepter/i }))
  await waitFor(() =>
    expect(accountStore.getState().session!.profile.friends.map((f) => f.pseudo)).toEqual(['Awa']),
  )
  await switchTo(awa.id)
  expect(accountStore.getState().session!.profile.friends.map((f) => f.pseudo)).toEqual(['Kofi'])
})

test('friends show who is online, and can be invited straight into a new room', async () => {
  const kofi = await player('Kofi')
  await player('Awa')
  await act(() =>
    accountStore.getState().addFriend({ id: kofi.id, pseudo: 'Kofi', avatarId: kofi.avatarId }),
  )
  act(() => socialHub.setState({ online: new Set([kofi.id]) }))
  const router = renderAt('/joueurs')
  const row = await screen.findByRole('listitem', { name: /kofi/i })
  expect(row).toHaveTextContent(/en ligne/i)
  await userEvent.click(within(row).getByRole('button', { name: /inviter kofi/i }))
  await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/salon\/[A-Z2-9]{6}$/))
  const code = router.state.location.pathname.slice(-6)
  expect(await createLocalInvites(bus).pending(kofi.id)).toMatchObject([
    { code, fromPseudo: 'Awa' },
  ])
})

test('tapping a player opens their public profile, read-only', async () => {
  const kofi = await player('Kofi')
  await act(() => accountStore.getState().updateProfile({ bio: 'Toujours partant' }))
  const awa = await player('Awa')
  renderAt('/')
  render(<MemberList members={[awa, kofi]} hostId={awa.id} selfId={awa.id} online={new Set()} />)
  await userEvent.click(screen.getByRole('button', { name: /voir le profil de kofi/i }))
  const sheet = await screen.findByRole('dialog', { name: /kofi/i })
  expect(await within(sheet).findByText('Toujours partant')).toBeInTheDocument()
  expect(within(sheet).getByRole('list', { name: /statistiques/i })).toBeInTheDocument()
  expect(within(sheet).queryByRole('textbox')).not.toBeInTheDocument()
})

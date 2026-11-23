import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { accountStore } from '@/features/account/accountStore'
import { playersStore } from '@/features/players/playersStore'
import { createInMemoryBus } from '@/features/room/bus'
import { MemberList } from '@/features/room/MemberList'
import { members } from '@/features/room/roomTestKit'
import { settingsStore } from '@/features/settings/settingsStore'
import { setInviteTransport } from './getInviteTransport'
import { resetMyInvites } from './myInvites'
import { createLocalInvites } from './localInvites'
import { InviteFriendsButton } from './InviteFriendsButton'

let bus: ReturnType<typeof createInMemoryBus>
beforeEach(async () => {
  localStorage.clear()
  bus = createInMemoryBus()
  setInviteTransport(createLocalInvites(bus))
  resetMyInvites()
  act(() => settingsStore.getState().confirmAge())
  await act(() => accountStore.getState().signOut())
  await act(() =>
    accountStore.getState().signUp(`u-${Date.now()}@example.com`, 'motdepasse', 'Awa'),
  )
})
const me = () => accountStore.getState().session!.profile

test('in the waiting room, another player can be added as a friend', async () => {
  render(<MemberList members={members} hostId="a" selfId={me().id} online={new Set()} />)
  await userEvent.click(screen.getByRole('button', { name: /ajouter kofi en ami/i }))
  expect(me().friends).toEqual([{ id: 'k', pseudo: 'Kofi', avatarId: '1f981' }])
  expect(screen.queryByRole('button', { name: /ajouter kofi en ami/i })).not.toBeInTheDocument()
  expect(screen.getAllByText(/^ami$/i).length).toBeGreaterThan(0)
})

test('friends are listed in Players, and can join the players of this phone', async () => {
  await act(() => accountStore.getState().addFriend({ id: 'k', pseudo: 'Kofi', avatarId: '1f981' }))
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/joueurs'] })} />)
  const section = await screen.findByRole('region', { name: /mes amis/i })
  expect(within(section).getByText('Kofi')).toBeInTheDocument()
  await userEvent.click(
    within(section).getByRole('button', { name: /ajouter kofi à ce téléphone/i }),
  )
  expect(playersStore.getState().players.map((p) => p.name)).toContain('Kofi')
})

test('friends not yet in the room can be invited', async () => {
  await act(() =>
    accountStore.getState().addFriend({ id: 'friend-k', pseudo: 'Kofi', avatarId: '' }),
  )
  await act(() =>
    accountStore.getState().addFriend({ id: 'friend-i', pseudo: 'Inès', avatarId: '' }),
  )
  render(<InviteFriendsButton code="ABCDEF" memberIds={[me().id, 'friend-i']} />)
  await userEvent.click(screen.getByRole('button', { name: /inviter mes amis/i }))
  expect(screen.queryByRole('button', { name: /inviter inès/i })).not.toBeInTheDocument()
  await userEvent.click(await screen.findByRole('button', { name: /inviter kofi/i }))
  expect(await screen.findByText(/invité ✓/i)).toBeInTheDocument()
  const sent = await createLocalInvites(bus).pending('friend-k')
  expect(sent).toMatchObject([{ code: 'ABCDEF', fromPseudo: 'Awa', toId: 'friend-k' }])
})

test('an invitation shows on the home screen and leads to the room', async () => {
  await createLocalInvites(bus).send({
    code: 'ABCDEF',
    fromId: 'k',
    fromPseudo: 'Kofi',
    fromAvatar: '',
    toId: me().id,
  })
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  render(<RouterProvider router={router} />)
  const banner = await screen.findByRole('region', { name: /invitation/i })
  expect(banner).toHaveTextContent(/kofi t’invite/i)
  await userEvent.click(within(banner).getByRole('button', { name: /rejoindre/i }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/salon/ABCDEF'))
})

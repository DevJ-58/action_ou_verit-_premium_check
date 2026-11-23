import { createInMemoryBus } from '@/features/room/bus'
import { createInviteStore } from './inviteStore'
import { createLocalInvites } from './localInvites'

const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0))
}
beforeEach(() => localStorage.clear())

function setup() {
  const bus = createInMemoryBus()
  return (selfId: string) => createInviteStore({ transport: createLocalInvites(bus), selfId })
}

const awaInvitesKofi = {
  code: 'ABCDEF',
  fromId: 'awa',
  fromPseudo: 'Awa',
  fromAvatar: '1f981',
  toId: 'kofi',
}

test('an invitation reaches the friend live, and only them', async () => {
  const phone = setup()
  const awa = phone('awa')
  const kofi = phone('kofi')
  const ines = phone('ines')
  await kofi.getState().connect()
  await ines.getState().connect()
  await awa.getState().send(awaInvitesKofi)
  await flush()
  expect(kofi.getState().invites).toMatchObject([{ code: 'ABCDEF', fromPseudo: 'Awa' }])
  expect(ines.getState().invites).toEqual([])
})

test('a friend who opens the app later still finds the invitation; dismissing removes it', async () => {
  const phone = setup()
  await phone('awa').getState().send(awaInvitesKofi)
  await flush()
  const kofi = phone('kofi')
  await kofi.getState().connect()
  expect(kofi.getState().invites).toHaveLength(1)
  await kofi.getState().dismiss(kofi.getState().invites[0]!)
  expect(kofi.getState().invites).toEqual([])
  const again = phone('kofi')
  await again.getState().connect()
  expect(again.getState().invites).toEqual([])
})

test('a newer invitation to the same room replaces the older one', async () => {
  const phone = setup()
  const kofi = phone('kofi')
  await kofi.getState().connect()
  const awa = phone('awa')
  await awa.getState().send(awaInvitesKofi)
  await awa.getState().send(awaInvitesKofi)
  await flush()
  expect(kofi.getState().invites).toHaveLength(1)
})

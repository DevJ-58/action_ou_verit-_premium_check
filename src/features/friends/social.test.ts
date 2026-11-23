import { act } from '@testing-library/react'
import { accountStore } from '@/features/account/accountStore'
import { createInMemoryBus } from '@/features/room/bus'
import { createLocalSocial } from './localSocial'

beforeEach(() => localStorage.clear())

/** Signs up a player and returns what others know of them. */
async function player(pseudo: string) {
  await act(() => accountStore.getState().signOut())
  await act(() =>
    accountStore.getState().signUp(`${pseudo}-${Date.now()}@example.com`, 'motdepasse', pseudo),
  )
  const p = accountStore.getState().session!.profile
  return { id: p.id, pseudo: p.pseudo, avatarId: p.avatarId }
}
const friendsOf = () => accountStore.getState().session!.profile.friends.map((f) => f.pseudo)
const service = () => createLocalSocial(createInMemoryBus())

async function switchTo(pseudo: string) {
  const accounts = JSON.parse(localStorage.getItem('av:accounts')!) as {
    id: string
    profile: { pseudo: string }
  }[]
  const target = accounts.find((a) => a.profile.pseudo === pseudo)!
  sessionStorage.setItem('av:session', target.id)
  localStorage.setItem('av:session', target.id)
  await act(() => accountStore.getState().init())
}

test('a friend request is seen by both; once accepted, each is in the other’s friends', async () => {
  const kofi = await player('Kofi')
  await player('Awa')
  const social = service()
  expect(await social.sendRequest(kofi)).toBe('sent')
  expect(await social.requests()).toMatchObject([{ toId: kofi.id, status: 'pending' }])

  await switchTo('Kofi')
  const [incoming] = await social.requests()
  expect(incoming).toMatchObject({ fromPseudo: 'Awa', toId: kofi.id, status: 'pending' })
  expect(await social.answer(incoming!.id, true)).toBe(true)
  await act(() => accountStore.getState().reloadProfile())
  expect(friendsOf()).toEqual(['Awa'])
  expect(await social.requests()).toEqual([])

  await switchTo('Awa')
  expect(friendsOf()).toEqual(['Kofi'])
  expect(await social.sendRequest(kofi)).toBe('friends')
})

test('a declined request adds nobody', async () => {
  const kofi = await player('Kofi')
  await player('Awa')
  const social = service()
  await social.sendRequest(kofi)
  await switchTo('Kofi')
  const [incoming] = await social.requests()
  await social.answer(incoming!.id, false)
  await act(() => accountStore.getState().reloadProfile())
  expect(friendsOf()).toEqual([])
  expect(await social.requests()).toEqual([])
})

test('asking someone who already asked you makes you friends at once', async () => {
  const kofi = await player('Kofi')
  const awa = await player('Awa')
  const social = service()
  await social.sendRequest(kofi)
  await switchTo('Kofi')
  expect(await social.sendRequest(awa)).toBe('friends')
  await act(() => accountStore.getState().reloadProfile())
  expect(friendsOf()).toEqual(['Awa'])
})

test('the public profile shows who the player is, never their private data', async () => {
  const kofi = await player('Kofi')
  await act(() => accountStore.getState().updateProfile({ bio: 'Toujours partant' }))
  await player('Awa')
  const profile = await service().publicProfile(kofi.id)
  expect(profile).toMatchObject({ id: kofi.id, pseudo: 'Kofi', bio: 'Toujours partant' })
  expect(profile!.stats).toMatchObject({ games: 0 })
  expect(Object.keys(profile!).sort()).toEqual(['avatarId', 'bio', 'id', 'pseudo', 'stats'])
  expect(profile!.stats).not.toHaveProperty('gameIds')
})

test('removing a friend removes them on both sides', async () => {
  const kofi = await player('Kofi')
  await player('Awa')
  const social = service()
  await social.sendRequest(kofi)
  await switchTo('Kofi')
  const [incoming] = await social.requests()
  await social.answer(incoming!.id, true)
  await switchTo('Awa')
  await social.removeFriend(kofi.id)
  await act(() => accountStore.getState().reloadProfile())
  expect(friendsOf()).toEqual([])
  await switchTo('Kofi')
  expect(friendsOf()).toEqual([])
})

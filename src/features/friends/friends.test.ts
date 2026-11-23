import { act } from '@testing-library/react'
import { accountStore } from '@/features/account/accountStore'
import { sanitizeFriends } from './friends'

const kofi = { id: 'k', pseudo: 'Kofi', avatarId: '1f981' }

beforeEach(async () => {
  await act(() => accountStore.getState().signOut())
  await act(() =>
    accountStore.getState().signUp(`f-${Date.now()}@example.com`, 'motdepasse', 'Awa'),
  )
})
const friends = () => accountStore.getState().session!.profile.friends

test('adding a friend keeps them on the account, once', async () => {
  await act(() => accountStore.getState().addFriend(kofi))
  await act(() => accountStore.getState().addFriend({ ...kofi, pseudo: 'Kofi B.' }))
  expect(friends()).toEqual([{ ...kofi, pseudo: 'Kofi B.' }])
})

test('one cannot befriend oneself; a friend can be removed', async () => {
  const me = accountStore.getState().session!.profile
  await act(() => accountStore.getState().addFriend({ id: me.id, pseudo: 'Moi', avatarId: '' }))
  expect(friends()).toEqual([])
  await act(() => accountStore.getState().addFriend(kofi))
  await act(() => accountStore.getState().removeFriend('k'))
  expect(friends()).toEqual([])
})

test('saved friends of any shape are read safely', () => {
  expect(sanitizeFriends(null)).toEqual([])
  expect(sanitizeFriends([kofi, { id: 3 }, 'x', { id: 'z', pseudo: 'Zoé' }])).toEqual([
    kofi,
    { id: 'z', pseudo: 'Zoé', avatarId: '' },
  ])
})

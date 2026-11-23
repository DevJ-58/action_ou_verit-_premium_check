import { act, renderHook } from '@testing-library/react'
import { accountStore } from '@/features/account/accountStore'
import { setSocial } from './getSocial'
import { setPresence, socialHub, useSocialBoot, SOCIAL_REFRESH_MS } from './socialHub'
import type { SocialService } from './social'

test('requests are re-read regularly, so one whose live notice was missed still shows up', async () => {
  vi.useFakeTimers()
  const pending = {
    id: 'r1',
    fromId: 'kofi',
    toId: 'me',
    fromPseudo: 'Kofi',
    fromAvatar: '',
    status: 'pending' as const,
    at: 1,
  }
  let stored: (typeof pending)[] = []
  const service = {
    requests: async () => stored,
    onChange: () => () => {},
  } as unknown as SocialService
  setSocial(service)
  setPresence({ track: () => () => {}, onOnline: () => () => {}, silence: () => {} })
  vi.spyOn(accountStore.getState(), 'reloadProfile').mockResolvedValue()
  act(() =>
    accountStore.setState({
      status: 'signedIn',
      session: {
        account: { id: 'me', email: 'me@x.com' },
        profile: {} as never,
        premiumUntil: null,
        premiumTrial: false,
      },
    }),
  )
  renderHook(() => useSocialBoot())
  await act(() => vi.advanceTimersByTimeAsync(10))
  expect(socialHub.getState().requests).toEqual([])
  stored = [pending] // arrives without any live notice
  await act(() => vi.advanceTimersByTimeAsync(SOCIAL_REFRESH_MS + 10))
  expect(socialHub.getState().requests).toEqual([pending])
  vi.useRealTimers()
  setSocial(null)
  setPresence(null)
})

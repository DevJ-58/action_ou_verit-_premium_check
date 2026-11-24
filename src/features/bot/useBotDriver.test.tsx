import { act, renderHook } from '@testing-library/react'
import { useStore } from 'zustand'
import { AXIS_ID } from '@/content/axis'
import { createSeededRng } from '@/engine'
import { createLocalChat } from '@/features/chat/localChat'
import { createChatStore } from '@/features/chat/chatStore'
import { createInMemoryBus } from '@/features/room/bus'
import { createLocalTransport } from '@/features/room/localTransport'
import { createRoomStore } from '@/features/room/roomStore'
import type { Member } from '@/features/room/types'
import { replyFor } from './replies'
import { useBotChat, useBotDriver } from './useBotDriver'

const awa: Member = {
  id: 'h',
  pseudo: 'Awa',
  avatarId: '1f981',
  limits: { excludedCategories: [], maxIntensity: 4 },
  customDares: [],
}

async function soloWithAxis() {
  const bus = createInMemoryBus()
  const store = createRoomStore({
    transport: createLocalTransport(bus),
    self: awa,
    rng: createSeededRng(5),
  })
  const code = await store.getState().createRoom()
  store.getState().setBot(true)
  const chat = createChatStore({ transport: createLocalChat(bus), code, selfId: 'h' })
  return { store, chat }
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

test('on the host’s phone, Axis greets the room and spins the bottle when nobody does', async () => {
  const { store, chat } = await soloWithAxis()
  renderHook(() => {
    const state = useStore(store)
    useBotDriver(state, chat)
    useBotChat(state.room, chat)
  })
  await act(() => vi.advanceTimersByTimeAsync(2000))
  expect(store.getState().room!.botChat).toHaveLength(1)
  expect(chat.getState().messages.at(-1)).toMatchObject({ from: AXIS_ID })
  act(() => store.getState().start({ categories: ['fun'] }))
  await act(() => vi.advanceTimersByTimeAsync(9000))
  expect(store.getState().room!.game!.phase).toBe('spinning')
})

test('a guest’s phone never plays for Axis', async () => {
  const { store, chat } = await soloWithAxis()
  const guest = { ...store.getState(), role: 'guest' as const, actAs: vi.fn(), say: vi.fn() }
  renderHook(() => useBotDriver(guest, chat))
  await act(() => vi.advanceTimersByTimeAsync(10_000))
  expect(guest.actAs).not.toHaveBeenCalled()
  expect(guest.say).not.toHaveBeenCalled()
})

test('Axis answers when someone greets him or says his name', async () => {
  expect(replyFor('Salut !', 'Awa', 'm1', 'fr')).toMatch(/Awa/)
  const { linesFor } = await import('./lines')
  const greetings = linesFor('greet', 'fr').map((l) => l.replace('{name}', 'Awa'))
  expect(greetings).toContain(replyFor('Salut Axis !', 'Awa', 'm4', 'fr'))
  expect(replyFor('axis tu triches', 'Awa', 'm2', 'fr')).toMatch(/Awa/)
  expect(replyFor('on mange quoi ce soir', 'Awa', 'm3', 'fr')).toBeNull()
})

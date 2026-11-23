import { renderHook } from '@testing-library/react'
import { createGame, type GameState } from '@/engine'
import { makePlayer } from '@/engine/testing'
import type { RoomStoreState } from '../roomStore'
import { CHOOSE_SECONDS, useHostTimers } from './useHostTimers'

const base = createGame({
  id: 'g',
  players: [makePlayer('a'), makePlayer('b'), makePlayer('c')],
  settings: {
    mode: 'remote',
    flow: 'everyone',
    proposeSeconds: 60,
    categories: ['fun'],
    source: 'both',
    rounds: 1,
    timerSeconds: 0,
    maxSkips: 3,
    picker: 'bottle',
  },
})

function hostState(game: GameState, act = vi.fn()): RoomStoreState {
  return {
    self: {
      id: 'a',
      pseudo: 'a',
      avatarId: '',
      limits: { excludedCategories: [], maxIntensity: 4 },
      customDares: [],
    },
    room: {
      code: 'ABCDEF',
      version: 1,
      hostId: 'a',
      status: 'playing',
      members: [],
      game,
      reactions: [],
    },
    role: 'host',
    online: new Set(['a', 'b', 'c']),
    act,
  } as unknown as RoomStoreState
}

const turn = {
  answererId: 'b',
  askerId: 'c',
  kind: 'dare' as const,
  dare: null,
  noDareAvailable: false,
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('proposals close at the deadline even when proposals keep arriving', () => {
  const act = vi.fn()
  const proposing = { ...base, phase: 'proposing' as const, turn: { ...turn, proposals: [] } }
  const { rerender } = renderHook(({ s }) => useHostTimers(s), {
    initialProps: { s: hostState(proposing, act) },
  })
  vi.advanceTimersByTime(30_000)
  const one = {
    ...proposing,
    turn: {
      ...proposing.turn,
      proposals: [
        {
          playerId: 'c',
          dare: {
            id: 'x',
            kind: 'dare' as const,
            category: 'fun' as const,
            intensity: 1 as const,
            modes: ['remote' as const],
            text: 'Danse',
          },
        },
      ],
    },
  }
  rerender({ s: hostState(one, act) })
  vi.advanceTimersByTime(30_500)
  expect(act).toHaveBeenCalledWith({ type: 'CLOSE_PROPOSALS' })
})

test('a kind is drawn if the answerer does not choose in time', () => {
  const act = vi.fn()
  renderHook(() => useHostTimers(hostState({ ...base, phase: 'choosing', turn }, act)))
  vi.advanceTimersByTime(CHOOSE_SECONDS * 1000 + 100)
  expect(act).toHaveBeenCalledWith({ type: 'TIMEOUT_CHOOSE' })
})

test('when nobody can write a dare, the turn is skipped after a while', () => {
  const act = vi.fn()
  renderHook(() =>
    useHostTimers(
      hostState({ ...base, phase: 'asking', turn: { ...turn, noDareAvailable: true } }, act),
    ),
  )
  vi.advanceTimersByTime(60_000)
  expect(act).toHaveBeenCalledWith({ type: 'SKIP' })
})

test('the host stops the live video at the end of its time', () => {
  vi.useFakeTimers()
  const setLive = vi.fn()
  const state = hostState(base)
  const withLive = {
    ...state,
    setLive,
    room: { ...state.room!, live: { by: 'b', turnKey: 'k', seconds: 30, startedAt: Date.now() } },
  } as RoomStoreState
  renderHook(() => useHostTimers(withLive))
  vi.advanceTimersByTime(29_000)
  expect(setLive).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1_000)
  expect(setLive).toHaveBeenCalledWith(false)
  vi.useRealTimers()
})

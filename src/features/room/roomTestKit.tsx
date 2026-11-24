import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { systemDares } from '@/content/systemDares'
import { createGame, createSeededRng, reduce, type GameAction, type GameState } from '@/engine'
import { ROOM_DEFAULTS, toPlayer } from './applyIntent'
import { RoomGameView } from './RoomGameView'
import type { RoomStoreState } from './roomStore'
import type { Member, RoomState } from './types'

// Test helpers for room game views (imported by *.test.tsx only).
export const member = (id: string, pseudo: string): Member => ({
  id,
  pseudo,
  avatarId: '1f981',
  limits: { excludedCategories: [], maxIntensity: 4 },
  customDares: [],
})
export const members = [member('a', 'Awa'), member('k', 'Kofi'), member('i', 'Inès')]

export function gameAt(actions: (g: GameState) => GameAction[]): GameState {
  const ctx = { rng: createSeededRng(11), systemDares }
  let g = createGame({
    id: 'g',
    settings: { ...ROOM_DEFAULTS, categories: ['fun'] },
    players: members.map(toPlayer),
  })
  for (const step of [{ type: 'SPIN' }, { type: 'SPIN_SETTLED' }] as GameAction[])
    g = reduce(g, step, ctx)
  for (const step of actions(g)) g = reduce(g, step, ctx)
  return g
}

export function stateFor(
  selfId: string,
  game: GameState,
  extra: Partial<RoomState> = {},
): RoomStoreState {
  const room: RoomState = {
    code: 'ABCDEF',
    version: 3,
    hostId: 'a',
    status: 'playing',
    members,
    game,
    reactions: [],
    ...extra,
  }
  return {
    self: members.find((m) => m.id === selfId)!,
    room,
    role: selfId === 'a' ? 'host' : 'guest',
    online: new Set(members.map((m) => m.id)),
    disconnect: vi.fn(),
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    start: vi.fn(),
    act: vi.fn(),
    react: vi.fn(),
    setLive: vi.fn(),
    setVoice: vi.fn(),
    setBot: vi.fn(),
    actAs: vi.fn(),
    say: vi.fn(),
    leave: vi.fn(),
  }
}

export function show(state: RoomStoreState) {
  render(
    <MemoryRouter>
      <RoomGameView state={state} onLeave={() => {}} />
    </MemoryRouter>,
  )
  return state
}

export const proposing = () => gameAt(() => [{ type: 'CHOOSE_KIND', kind: 'dare' }])
export const notAnswerer = (g: GameState) => g.players.find((p) => p.id !== g.turn!.answererId)!.id
export const inChallenge = (kind: 'truth' | 'dare' = 'dare') =>
  gameAt(() => [{ type: 'CHOOSE_KIND', kind }, { type: 'CLOSE_PROPOSALS' }])

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { systemDares } from '@/content/systemDares'
import { createGame, createSeededRng, reduce, type GameAction, type GameState } from '@/engine'
import { ROOM_DEFAULTS, toPlayer } from './applyIntent'
import { RoomGameView } from './RoomGameView'
import type { RoomStoreState } from './roomStore'
import type { Member, RoomState } from './types'

const member = (id: string, pseudo: string): Member => ({
  id,
  pseudo,
  avatarId: '1f981',
  limits: { excludedCategories: [], maxIntensity: 4 },
  customDares: [],
})
const members = [member('a', 'Awa'), member('k', 'Kofi'), member('i', 'Inès')]

function gameAt(actions: (g: GameState) => GameAction[]): GameState {
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

function stateFor(selfId: string, game: GameState, extra: Partial<RoomState> = {}): RoomStoreState {
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
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    start: vi.fn(),
    act: vi.fn(),
    react: vi.fn(),
    leave: vi.fn(),
  }
}

function show(state: RoomStoreState) {
  render(
    <MemoryRouter>
      <RoomGameView state={state} onLeave={() => {}} />
    </MemoryRouter>,
  )
  return state
}

const proposing = () => gameAt(() => [{ type: 'CHOOSE_KIND', kind: 'dare' }])
const notAnswerer = (g: GameState) => g.players.find((p) => p.id !== g.turn!.answererId)!.id

test('a proposer writes a dare and sends it as their proposal', async () => {
  const g = proposing()
  const s = show(stateFor(notAnswerer(g), g))
  await userEvent.type(screen.getByLabelText(/ton défi pour/i), 'Imite un flamant rose')
  await userEvent.click(screen.getByRole('button', { name: /proposer/i }))
  expect(s.act).toHaveBeenCalledWith({
    type: 'PROPOSE',
    playerId: s.self.id,
    dare: expect.objectContaining({
      kind: 'dare',
      text: 'Imite un flamant rose',
      modes: ['remote'],
    }),
  })
})

test('“Inspire-moi” fills the text with a game dare the proposer can edit', async () => {
  const g = proposing()
  show(stateFor(notAnswerer(g), g))
  await userEvent.click(screen.getByRole('button', { name: /inspire-moi/i }))
  const text = (screen.getByLabelText(/ton défi pour/i) as HTMLTextAreaElement).value
  expect(systemDares.some((d) => d.text === text)).toBe(true)
})

test('the answerer waits while the others propose, seeing how many are ready', () => {
  const g = proposing()
  show(stateFor(g.turn!.answererId, g))
  expect(screen.getByText(/les autres te préparent un défi/i)).toBeInTheDocument()
  expect(screen.getByText('0 / 2')).toBeInTheDocument()
})

test('the answerer turns over one face-down card', async () => {
  const g = gameAt((g0) => {
    const others = g0.players.filter((p) => p.id !== g0.turn!.answererId)
    return [
      { type: 'CHOOSE_KIND', kind: 'dare' },
      ...others.map((p): GameAction => ({
        type: 'PROPOSE',
        playerId: p.id,
        dare: {
          id: 'x',
          kind: 'dare',
          category: 'fun',
          intensity: 1,
          modes: ['remote'],
          text: `Défi de ${p.name}`,
        },
      })),
      { type: 'CLOSE_PROPOSALS' },
    ]
  })
  const s = show(stateFor(g.turn!.answererId, g))
  const cards = screen.getAllByRole('button', { name: /carte \d/i })
  expect(cards).toHaveLength(2)
  await userEvent.click(cards[1]!)
  await waitFor(() => expect(s.act).toHaveBeenCalledWith({ type: 'PICK_PROPOSAL', index: 1 }))
})

test('in the challenge, everyone sees the card and its author; the answerer can say it is done', async () => {
  const g = gameAt(() => [{ type: 'CHOOSE_KIND', kind: 'dare' }, { type: 'CLOSE_PROPOSALS' }])
  show(stateFor(notAnswerer(g), g))
  expect(screen.getByRole('article')).toHaveTextContent(g.turn!.dare!.text)
  expect(screen.queryByRole('button', { name: /c’est fait/i })).not.toBeInTheDocument()
})

test('the answerer can complete the challenge', async () => {
  const g = gameAt(() => [{ type: 'CHOOSE_KIND', kind: 'dare' }, { type: 'CLOSE_PROPOSALS' }])
  const s = show(stateFor(g.turn!.answererId, g))
  await userEvent.click(screen.getByRole('button', { name: /c’est fait/i }))
  expect(s.act).toHaveBeenCalledWith({ type: 'COMPLETE' })
})

test('reactions: tapping an emoji sends it, and others’ reactions float on screen', async () => {
  const g = proposing()
  const s = show(
    stateFor('a', g, {
      reactions: [{ id: 'r1', from: 'k', emoji: 'fire', at: Date.now() + 1000 }],
    }),
  )
  expect(screen.getByRole('img', { name: /kofi.*feu/i })).toBeInTheDocument()
  await userEvent.click(
    within(screen.getByRole('toolbar', { name: /réactions/i })).getAllByRole('button')[0]!,
  )
  expect(s.react).toHaveBeenCalled()
})

test('at the end, everyone sees the recap; the host can replay', async () => {
  const g = { ...proposing(), phase: 'finished' as const, turn: null }
  const s = show(stateFor('a', g))
  expect(
    screen.getByRole('heading', { name: /remporte la partie|classement/i }),
  ).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /rejouer/i }))
  expect(s.act).toHaveBeenCalledWith({ type: 'RESTART' })
})

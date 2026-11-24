import { AXIS_ID, axisMember } from '@/content/axis'
import { createSeededRng, type GameAction } from '@/engine'
import { applyIntent } from '@/features/room/applyIntent'
import type { Member, RoomState } from '@/features/room/types'
import { planBot, type BotMove } from './planBot'

const rng = createSeededRng(7)
const human: Member = {
  id: 'h',
  pseudo: 'Awa',
  avatarId: '1f981',
  limits: { excludedCategories: [], maxIntensity: 4 },
  customDares: [],
}

/** A started game, Awa (host) and Axis. */
function started(): RoomState {
  const lobby: RoomState = {
    code: 'ABCDEF',
    version: 1,
    hostId: 'h',
    status: 'lobby',
    members: [human, axisMember()],
    game: null,
    reactions: [],
  }
  return applyIntent(
    lobby,
    { id: 's', from: 'h', type: 'start', setup: { categories: ['fun'], rounds: 3 } },
    rng,
  )!
}

let n = 0
function act(room: RoomState, from: string, action: GameAction): RoomState {
  const next = applyIntent(room, { id: `i${n++}`, from, type: 'action', action }, rng)
  if (!next) throw new Error(`refused: ${action.type} from ${from}`)
  return next
}

const intentOf = (moves: BotMove[]) => moves.find((m) => m.intent)?.intent
const actionOf = (moves: BotMove[]) => {
  const intent = intentOf(moves)
  return intent?.type === 'action' ? intent.action : undefined
}

/** Spins until the bottle points at `who`. */
function turnOf(who: string): RoomState {
  for (let seed = 1; seed < 50; seed++) {
    let room = started()
    room = applyIntent(
      room,
      { id: `sp${seed}`, from: 'h', type: 'action', action: { type: 'SPIN' } },
      createSeededRng(seed),
    )!
    room = act(room, 'h', { type: 'SPIN_SETTLED' })
    if (room.game!.turn!.answererId === who) return room
  }
  throw new Error('bottle never pointed')
}

test('in the lobby, Axis says hello once', () => {
  const lobby = { ...started(), status: 'lobby' as const, game: null }
  const moves = planBot(lobby, AXIS_ID, 'fr')
  expect(moves).toEqual([expect.objectContaining({ key: 'hello:ABCDEF', say: expect.any(Object) })])
})

test('Axis spins the bottle if nobody does', () => {
  const moves = planBot(started(), AXIS_ID, 'fr')
  expect(actionOf(moves)).toEqual({ type: 'SPIN' })
  expect(moves[0]!.delayMs).toBeGreaterThanOrEqual(6000)
})

test('when the bottle points at him, Axis chooses, then turns a card, answers, and finishes after a verdict', () => {
  let room = turnOf(AXIS_ID)
  const choose = actionOf(planBot(room, AXIS_ID, 'fr'))
  expect(choose?.type).toBe('CHOOSE_KIND')
  room = act(room, AXIS_ID, choose!)
  expect(planBot(room, AXIS_ID, 'fr').some((m) => m.intent)).toBe(false) // the others write
  room = act(room, 'h', {
    type: 'PROPOSE',
    playerId: 'h',
    dare: {
      id: 'x',
      kind: room.game!.turn!.kind!,
      category: 'fun',
      intensity: 1,
      modes: ['remote'],
      text: 'Chante une chanson',
    },
  })
  room = act(room, 'h', { type: 'CLOSE_PROPOSALS' })
  if (room.game!.phase === 'picking') {
    const pick = actionOf(planBot(room, AXIS_ID, 'fr'))
    expect(pick?.type).toBe('PICK_PROPOSAL')
    room = act(room, AXIS_ID, pick!)
  }
  expect(room.game!.phase).toBe('challenge')
  const first = actionOf(planBot(room, AXIS_ID, 'fr'))
  if (first?.type === 'SKIP') return // he may pass his turn once in a while
  expect(first).toMatchObject({ type: 'ANSWER', playerId: AXIS_ID, text: expect.any(String) })
  room = act(room, AXIS_ID, first!)
  expect(actionOf(planBot(room, AXIS_ID, 'fr'))).toBeUndefined() // waits for a verdict
  room = act(room, 'h', { type: 'VOTE', playerId: 'h', ok: true })
  expect(actionOf(planBot(room, AXIS_ID, 'fr'))).toEqual({ type: 'COMPLETE' })
})

test('when Awa answers, Axis proposes an allowed dare of the chosen kind, then gives a verdict', () => {
  let room = turnOf('h')
  room = act(room, 'h', { type: 'CHOOSE_KIND', kind: 'dare' })
  const propose = actionOf(planBot(room, AXIS_ID, 'fr'))
  expect(propose).toMatchObject({
    type: 'PROPOSE',
    playerId: AXIS_ID,
    dare: { kind: 'dare', category: 'fun' },
  })
  room = act(room, AXIS_ID, propose!)
  expect(planBot(room, AXIS_ID, 'fr').some((m) => m.intent)).toBe(false)
  room = act(room, 'h', { type: 'CLOSE_PROPOSALS' })
  if (room.game!.phase === 'picking') room = act(room, 'h', { type: 'PICK_PROPOSAL', index: 0 })
  const slow = planBot(room, AXIS_ID, 'fr').find((m) => m.intent)!
  room = act(room, 'h', { type: 'ANSWER', playerId: 'h', text: 'Fait !' })
  const quick = planBot(room, AXIS_ID, 'fr').find((m) => m.intent)!
  expect(quick.intent).toMatchObject({
    type: 'action',
    action: { type: 'VOTE', playerId: AXIS_ID },
  })
  expect(quick.delayMs).toBeLessThan(slow.delayMs)
})

test('his choices depend on the turn only: planning again gives the same move', () => {
  const room = turnOf(AXIS_ID)
  expect(planBot(room, AXIS_ID, 'fr')).toEqual(planBot(room, AXIS_ID, 'fr'))
})

test('he never plays a move for somebody else', () => {
  const room = turnOf('h')
  expect(planBot(room, AXIS_ID, 'fr').some((m) => m.intent)).toBe(false) // Awa chooses
})

test('at the end, Axis says one last word', () => {
  const room = {
    ...started(),
    game: { ...started().game!, phase: 'finished' as const, turn: null },
  }
  const [move] = planBot(room, AXIS_ID, 'en')
  expect(move).toMatchObject({ key: `end:${room.game.id}`, say: { text: expect.any(String) } })
})

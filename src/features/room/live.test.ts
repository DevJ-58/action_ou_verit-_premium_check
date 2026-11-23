import { createSeededRng, type GameState } from '@/engine'
import { applyIntent, liveExpired } from './applyIntent'
import { inChallenge, members, proposing } from './roomTestKit'
import type { Intent, RoomState } from './types'

const rng = createSeededRng(1)
const room = (game: GameState, over: Partial<RoomState> = {}): RoomState => ({
  code: 'ABCDEF',
  version: 1,
  hostId: 'a',
  status: 'playing',
  members,
  game: { ...game, settings: { ...game.settings, liveSeconds: 60 } },
  reactions: [],
  ...over,
})
const live = (from: string, on: boolean): Intent => ({
  id: `i-${from}-${on}`,
  from,
  type: 'live',
  on,
})

test('the designated player starts a live video during the challenge, for the host’s duration', () => {
  const r = room(inChallenge())
  const answerer = r.game!.turn!.answererId
  const next = applyIntent(r, live(answerer, true), rng)!
  expect(next.live).toMatchObject({ by: answerer, seconds: 60 })
  expect(typeof next.live!.startedAt).toBe('number')
})

test('nobody else can start it, nor outside the challenge, nor when the host turned video off', () => {
  const r = room(inChallenge())
  const other = members.find((m) => m.id !== r.game!.turn!.answererId)!.id
  expect(applyIntent(r, live(other, true), rng)).toBeNull()
  const early = room(proposing())
  expect(applyIntent(early, live(early.game!.turn!.answererId, true), rng)).toBeNull()
  const off: RoomState = {
    ...r,
    game: { ...r.game!, settings: { ...r.game!.settings, liveSeconds: 0 } },
  }
  expect(applyIntent(off, live(r.game!.turn!.answererId, true), rng)).toBeNull()
})

test('the player filming or the host stops it; the end of the turn stops it too', () => {
  const r = room(inChallenge())
  const answerer = r.game!.turn!.answererId
  const on = applyIntent(r, live(answerer, true), rng)!
  expect(applyIntent(on, live(answerer, false), rng)!.live).toBeNull()
  expect(applyIntent(on, live('a', false), rng)!.live).toBeNull()
  const done = applyIntent(
    on,
    { id: 'c', from: answerer, type: 'action', action: { type: 'COMPLETE' } },
    rng,
  )!
  expect(done.live).toBeNull()
})

test('a live video is over once its time has passed', () => {
  const r = room(inChallenge())
  const on = applyIntent(r, live(r.game!.turn!.answererId, true), rng)!
  expect(liveExpired(on.live!, on.live!.startedAt + 59_000)).toBe(false)
  expect(liveExpired(on.live!, on.live!.startedAt + 60_000)).toBe(true)
})

test('replaying keeps the finished game’s result, so every phone can count it', () => {
  const g = inChallenge()
  const finished = { ...g, phase: 'finished' as const, turn: null }
  const r = room(finished)
  const replay = applyIntent(
    r,
    { id: 'rs', from: 'a', type: 'action', action: { type: 'RESTART' } },
    rng,
  )!
  expect(replay.game!.phase).toBe('ready')
  expect(replay.lastGame).toMatchObject({
    id: finished.id,
    phase: 'finished',
    scores: finished.scores,
  })
})

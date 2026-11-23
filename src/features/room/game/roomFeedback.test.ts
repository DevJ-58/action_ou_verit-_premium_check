import type { RoomState } from '../types'
import { inChallenge, members, proposing } from '../roomTestKit'
import { roomFeedback } from './roomFeedback'

const room = (game: RoomState['game'], over: Partial<RoomState> = {}): RoomState => ({
  code: 'ABCDEF',
  version: 1,
  hostId: 'a',
  status: 'playing',
  members,
  game,
  reactions: [],
  ...over,
})

test('my turn to choose rings for me only', () => {
  const g = proposing()
  const choosing = { ...g, phase: 'choosing' as const }
  const ready = { ...g, phase: 'ready' as const }
  expect(roomFeedback(room(ready), room(choosing), g.turn!.answererId)).toContain('yourTurn')
  const other = members.find((m) => m.id !== g.turn!.answererId)!.id
  expect(roomFeedback(room(ready), room(choosing), other)).not.toContain('yourTurn')
})

test('the card turning, an answer, a vote, others’ reactions and the end each have a sound', () => {
  const challenge = inChallenge('truth')
  const picking = { ...challenge, phase: 'picking' as const }
  const me = challenge.turn!.answererId
  const other = members.find((m) => m.id !== me)!.id
  expect(roomFeedback(room(picking), room(challenge), other)).toEqual(['reveal'])

  const answered = { ...challenge, turn: { ...challenge.turn!, answer: { text: 'Oui' } } }
  expect(roomFeedback(room(challenge), room(answered), other)).toEqual(['message'])
  expect(roomFeedback(room(challenge), room(answered), me)).toEqual([])

  const voted = { ...answered, turn: { ...answered.turn!, votes: { [other]: true } } }
  expect(roomFeedback(room(answered), room(voted), me)).toEqual(['vote'])

  const reaction = { id: 'r', from: other, emoji: 'fire' as const, at: 0 }
  expect(roomFeedback(room(voted), room(voted, { reactions: [reaction] }), me)).toEqual([
    'reaction',
  ])
  expect(roomFeedback(room(voted), room(voted, { reactions: [reaction] }), other)).toEqual([])

  const finished = { ...voted, phase: 'finished' as const, turn: null }
  expect(roomFeedback(room(voted), room(finished), me)).toEqual(['finish'])
})

test('the answerer hears each new proposal arrive', () => {
  const g = proposing()
  const me = g.turn!.answererId
  const proposer = members.find((m) => m.id !== me)!.id
  const dare = {
    id: 'p',
    kind: 'dare' as const,
    category: 'fun' as const,
    intensity: 1 as const,
    modes: [],
    text: 'x',
  }
  const after = { ...g, turn: { ...g.turn!, proposals: [{ playerId: proposer, dare }] } }
  expect(roomFeedback(room(g), room(after), me)).toEqual(['proposal'])
  expect(roomFeedback(room(g), room(after), proposer)).toEqual([])
})

test('no previous state (just joined) makes no sound', () => {
  expect(roomFeedback(null, room(proposing()), 'a')).toEqual([])
})

test('the others hear when someone goes live', () => {
  const g = inChallenge('dare')
  const by = g.turn!.answererId
  const other = members.find((m) => m.id !== by)!.id
  const live = { by, turnKey: 'k', seconds: 60, startedAt: 1 }
  expect(roomFeedback(room(g), room(g, { live }), other)).toEqual(['yourTurn'])
  expect(roomFeedback(room(g), room(g, { live }), by)).toEqual([])
})

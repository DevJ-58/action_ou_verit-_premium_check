import { fr } from '@/i18n/fr'
import { gameAt, inChallenge, members, notAnswerer, proposing } from '../roomTestKit'
import { turnGuide } from './turnGuide'

const names = (id: string) => members.find((m) => m.id === id)?.pseudo ?? ''
const guide = (game: Parameters<typeof turnGuide>[0], selfId: string) =>
  turnGuide(game, selfId, names, fr)

test('steps follow the turn: bottle, choice, dares, card, verdict', () => {
  const ready = { ...proposing(), phase: 'ready' as const, turn: null }
  expect(guide(ready, 'a')).toMatchObject({ step: 0, mine: true })
  const choosing = gameAt(() => [])
  const answerer = choosing.turn!.answererId
  expect(guide(choosing, answerer)).toMatchObject({
    step: 1,
    mine: true,
    text: 'À toi : choisis Vérité ou Action',
  })
  expect(guide(choosing, notAnswerer(choosing))).toMatchObject({
    step: 1,
    mine: false,
    text: `${names(answerer)} choisit Vérité ou Action…`,
  })
})

test('while dares are written, each phone knows whether it still has to propose', () => {
  const g = proposing()
  const other = notAnswerer(g)
  expect(guide(g, other)).toMatchObject({
    step: 2,
    mine: true,
    text: `À toi : pose un défi à ${names(g.turn!.answererId)}`,
  })
  const sent = {
    ...g,
    turn: {
      ...g.turn!,
      proposals: [{ playerId: other, dare: g.turn!.proposals?.[0]?.dare ?? ({} as never) }],
    },
  }
  expect(guide(sent, other)).toMatchObject({ step: 2, mine: false })
  expect(guide(sent, other).text).toMatch(/défi envoyé/i)
  expect(guide(g, g.turn!.answererId).text).toMatch(/les autres t’écrivent un défi/i)
})

test('in the challenge, the others are asked for their verdict, and the player is told when to press done', () => {
  const g = inChallenge('dare')
  const me = g.turn!.answererId
  const other = notAnswerer(g)
  expect(guide(g, other)).toMatchObject({
    step: 4,
    mine: true,
    text: 'À toi : donne ton verdict (Validé ou Pas convaincu)',
  })
  expect(guide(g, me).text).toMatch(/relève le défi/i)
  const voted = { ...g, turn: { ...g.turn!, votes: { [other]: true } } }
  expect(guide(voted, me)).toMatchObject({
    mine: true,
    text: 'Verdict reçu : appuie sur « C’est fait »',
  })
  expect(guide(voted, other)).toMatchObject({ mine: false })
})

import { createSeededRng } from '@/engine'
import { createInMemoryBus } from './bus'
import { createLocalTransport } from './localTransport'
import { createRoomStore } from './roomStore'
import type { Member } from './types'

const member = (id: string): Member => ({
  id,
  pseudo: id,
  avatarId: '1f981',
  limits: { excludedCategories: [], maxIntensity: 4 },
  customDares: [],
})
const flush = async () => {
  for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0))
}

test('a full room turn: two propose, the answerer turns a card, every phone sees it and its author', async () => {
  const bus = createInMemoryBus()
  const phones = ['a', 'b', 'c'].map((id, i) =>
    createRoomStore({
      transport: createLocalTransport(bus),
      self: member(id),
      rng: createSeededRng(i + 4),
    }),
  )
  const [host] = phones
  const code = await host!.getState().createRoom()
  for (const p of phones.slice(1)) await p.getState().joinRoom(code)
  await flush()
  await host!.getState().start({ categories: ['fun'] })
  host!.getState().act({ type: 'SPIN' })
  host!.getState().act({ type: 'SPIN_SETTLED' })
  await flush()

  const answererId = host!.getState().room!.game!.turn!.answererId
  const byId = (id: string) => phones.find((p) => p.getState().self.id === id)!
  byId(answererId).getState().act({ type: 'CHOOSE_KIND', kind: 'dare' })
  await flush()
  const proposers = phones.filter((p) => p.getState().self.id !== answererId)
  for (const p of proposers) {
    const id = p.getState().self.id
    p.getState().act({
      type: 'PROPOSE',
      playerId: id,
      dare: {
        id: 'x',
        kind: 'dare',
        category: 'fun',
        intensity: 1,
        modes: ['remote'],
        text: `Défi de ${id}`,
      },
    })
  }
  await flush()
  host!.getState().act({ type: 'CLOSE_PROPOSALS' })
  await flush()
  byId(answererId).getState().act({ type: 'PICK_PROPOSAL', index: 0 })
  await flush()

  const games = phones.map((p) => p.getState().room!.game!)
  expect(games.every((g) => g.phase === 'challenge')).toBe(true)
  const dare = games[0]!.turn!.dare!
  expect(games.every((g) => g.turn!.dare!.text === dare.text)).toBe(true)
  expect(dare.text).toBe(`Défi de ${games[0]!.turn!.askerId}`)
})

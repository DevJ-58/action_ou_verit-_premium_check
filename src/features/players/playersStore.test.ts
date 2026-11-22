import { createPlayersStore } from './playersStore'

test('addPlayer gives a unique id and default limits', () => {
  const store = createPlayersStore()
  const a = store.getState().addPlayer({ name: 'Awa', avatar: '' })
  const b = store.getState().addPlayer({ name: 'Kofi', avatar: '' })
  expect(a.id).not.toBe(b.id)
  expect(a.limits).toEqual({ excludedCategories: [], maxIntensity: 4 })
  expect(a.customDares).toEqual([])
  expect(store.getState().players.map((p) => p.name)).toEqual(['Awa', 'Kofi'])
})

test('upsertCustomDare adds then updates the same dare, authored by the player', () => {
  const store = createPlayersStore()
  const awa = store.getState().addPlayer({ name: 'Awa', avatar: '' })
  store.getState().upsertCustomDare(awa.id, {
    kind: 'dare',
    category: 'fun',
    intensity: 1,
    modes: ['nearby'],
    text: 'Chante faux',
  })
  const [created] = store.getState().players[0]!.customDares
  expect(created).toMatchObject({ text: 'Chante faux', authorId: awa.id })
  store.getState().upsertCustomDare(awa.id, { ...created!, text: 'Chante juste' })
  const dares = store.getState().players[0]!.customDares
  expect(dares).toHaveLength(1)
  expect(dares[0]).toMatchObject({ id: created!.id, text: 'Chante juste' })
})

test('removeCustomDare and removePlayer delete what they target', () => {
  const store = createPlayersStore()
  const awa = store.getState().addPlayer({ name: 'Awa', avatar: '' })
  store.getState().upsertCustomDare(awa.id, {
    kind: 'truth',
    category: 'fun',
    intensity: 1,
    modes: ['nearby', 'remote'],
    text: 'Ton pire souvenir ?',
  })
  const dareId = store.getState().players[0]!.customDares[0]!.id
  store.getState().removeCustomDare(awa.id, dareId)
  expect(store.getState().players[0]!.customDares).toEqual([])
  store.getState().removePlayer(awa.id)
  expect(store.getState().players).toEqual([])
})

test('players persist and a corrupted value falls back to an empty roster', async () => {
  const store = createPlayersStore()
  store.getState().addPlayer({ name: 'Awa', avatar: '' })
  expect(localStorage.getItem('av:players')).toContain('Awa')
  localStorage.setItem('av:players', 'not json')
  const fresh = createPlayersStore()
  await fresh.persist.rehydrate()
  expect(fresh.getState().players).toEqual([])
})

test('malformed players in a same-version save are dropped', async () => {
  localStorage.setItem(
    'av:players',
    JSON.stringify({
      state: {
        players: [
          {
            id: 'ok',
            name: 'Awa',
            avatar: '',
            limits: { excludedCategories: [], maxIntensity: 4 },
            customDares: [],
          },
          { id: 'bad', name: 42 },
          null,
        ],
      },
      version: 1,
    }),
  )
  const store = createPlayersStore()
  await store.persist.rehydrate()
  expect(store.getState().players.map((p) => p.id)).toEqual(['ok'])
})

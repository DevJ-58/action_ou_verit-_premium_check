import { GameRuleError } from './errors'
import { askerIndexFor, normalizeAngle, seatAngle } from './geometry'
import { reduce } from './reduce'
import { createSeededRng } from './rng'
import { createGame, skipsLeft, type GameAction, type GameSettings, type GameState } from './state'
import { deepFreeze, makeDare, makePlayer } from './testing'

const settings: GameSettings = {
  mode: 'nearby',
  categories: ['fun'],
  source: 'both',
  rounds: 2,
  timerSeconds: 0,
  maxSkips: 1,
  picker: 'bottle',
}

const pool = [
  makeDare('t1', { kind: 'truth' }),
  makeDare('t2', { kind: 'truth' }),
  makeDare('d1'),
  makeDare('d2'),
  makeDare('spicy', { category: 'spicy', intensity: 3 }),
]

function setup(
  over: Partial<GameSettings> = {},
  players = ['a', 'b', 'c'].map((id) => makePlayer(id)),
) {
  const rng = createSeededRng(7)
  const ctx = { rng, systemDares: pool }
  let state = createGame({ id: 'g1', settings: { ...settings, ...over }, players })
  const run = (action: GameAction) => {
    state = reduce(state, action, ctx)
    return state
  }
  return {
    get state() {
      return state
    },
    run,
    ctx,
  }
}

function expectRuleError(fn: () => unknown, code: GameRuleError['code']) {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(GameRuleError)
    expect((error as GameRuleError).code).toBe(code)
    return
  }
  throw new Error(`expected GameRuleError(${code})`)
}

describe('createGame', () => {
  test('starts ready on round 1 with zero scores', () => {
    const { state } = setup()
    expect(state.phase).toBe('ready')
    expect(state.round).toBe(1)
    expect(state.scores.a).toEqual({ done: 0, skipped: 0, points: 0, truths: 0, dares: 0 })
  })

  test('needs 2 to 12 players and at least one category', () => {
    const p = (n: number) => Array.from({ length: n }, (_, i) => makePlayer(`p${i}`))
    expectRuleError(() => createGame({ id: 'x', settings, players: p(1) }), 'notEnoughPlayers')
    expectRuleError(() => createGame({ id: 'x', settings, players: p(13) }), 'tooManyPlayers')
    expectRuleError(
      () => createGame({ id: 'x', settings: { ...settings, categories: [] }, players: p(2) }),
      'noCategory',
    )
  })
})

describe('spinning', () => {
  test('SPIN picks someone who has not played and lands the bottle on them', () => {
    const g = setup()
    const before = g.state.bottleRotation
    const s = g.run({ type: 'SPIN' })
    expect(s.phase).toBe('spinning')
    const answererIndex = s.players.findIndex((p) => p.id === s.turn!.answererId)
    expect(s.turn!.askerId).toBe(s.players[askerIndexFor(answererIndex, 3)]!.id)
    expect(normalizeAngle(s.bottleRotation)).toBeCloseTo(seatAngle(answererIndex, 3))
    const turns = (s.bottleRotation - before) / 360
    expect(turns).toBeGreaterThanOrEqual(5)
    expect(turns).toBeLessThan(8)
  })

  test('SPIN_SETTLED moves to choosing and is idempotent', () => {
    const g = setup()
    g.run({ type: 'SPIN' })
    const choosing = g.run({ type: 'SPIN_SETTLED' })
    expect(choosing.phase).toBe('choosing')
    expect(g.run({ type: 'SPIN_SETTLED' })).toBe(choosing)
  })

  test('nobody is picked twice in the same round', () => {
    const g = setup()
    const picked: string[] = []
    for (let i = 0; i < 3; i++) {
      g.run({ type: 'SPIN' })
      picked.push(g.state.turn!.answererId)
      g.run({ type: 'SPIN_SETTLED' })
      g.run({ type: 'CHOOSE_KIND', kind: 'truth' })
      g.run({ type: 'PICK_SYSTEM' })
      g.run({ type: 'COMPLETE' })
    }
    expect(new Set(picked).size).toBe(3)
  })
})

describe('choosing and asking', () => {
  test('CHOOSE_KIND goes to asking when the asker may choose', () => {
    const g = setup()
    g.run({ type: 'SPIN' })
    g.run({ type: 'SPIN_SETTLED' })
    const s = g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
    expect(s.phase).toBe('asking')
    expect(s.turn!.kind).toBe('dare')
  })

  test('with system-only source, CHOOSE_KIND draws directly', () => {
    const g = setup({ source: 'system' })
    g.run({ type: 'SPIN' })
    g.run({ type: 'SPIN_SETTLED' })
    const s = g.run({ type: 'CHOOSE_KIND', kind: 'truth' })
    expect(s.phase).toBe('challenge')
    expect(s.turn!.dare!.kind).toBe('truth')
  })

  test('PICK_SYSTEM draws a dare within the answerer limits', () => {
    const g = setup({ categories: ['fun', 'spicy'] }, [
      makePlayer('a', { limits: { excludedCategories: [], maxIntensity: 2 } }),
      makePlayer('b', { limits: { excludedCategories: [], maxIntensity: 2 } }),
    ])
    for (let i = 0; i < 2; i++) {
      g.run({ type: 'SPIN' })
      g.run({ type: 'SPIN_SETTLED' })
      g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
      const s = g.run({ type: 'PICK_SYSTEM' })
      expect(s.turn!.dare!.intensity).toBeLessThanOrEqual(2)
      g.run({ type: 'COMPLETE' })
    }
  })

  test('PICK_SYSTEM with nothing allowed stays in asking and flags it', () => {
    const g = setup({ categories: ['spicy'] }, [
      makePlayer('a', { limits: { excludedCategories: ['spicy'], maxIntensity: 4 } }),
      makePlayer('b', { limits: { excludedCategories: ['spicy'], maxIntensity: 4 } }),
    ])
    g.run({ type: 'SPIN' })
    g.run({ type: 'SPIN_SETTLED' })
    g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
    const s = g.run({ type: 'PICK_SYSTEM' })
    expect(s.phase).toBe('asking')
    expect(s.turn!.noDareAvailable).toBe(true)
  })

  test('PICK_SYSTEM is refused when only custom dares are allowed', () => {
    const g = setup({ source: 'custom' })
    g.run({ type: 'SPIN' })
    g.run({ type: 'SPIN_SETTLED' })
    g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
    expectRuleError(() => g.run({ type: 'PICK_SYSTEM' }), 'dareNotAllowed')
  })

  describe('PICK_CUSTOM', () => {
    const players = () =>
      ['a', 'b', 'c'].map((id) =>
        makePlayer(id, {
          customDares: [
            makeDare(`${id}-d`, { authorId: id }),
            makeDare(`${id}-t`, { kind: 'truth', authorId: id }),
            makeDare(`${id}-spicy`, { category: 'spicy', intensity: 3, authorId: id }),
          ],
        }),
      )

    function toAsking() {
      const g = setup({}, players())
      g.run({ type: 'SPIN' })
      g.run({ type: 'SPIN_SETTLED' })
      g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
      return g
    }

    test('accepts a dare of the asker, of the right kind, within limits', () => {
      const g = toAsking()
      const asker = g.state.turn!.askerId
      const s = g.run({ type: 'PICK_CUSTOM', dareId: `${asker}-d` })
      expect(s.phase).toBe('challenge')
      expect(s.turn!.dare!.id).toBe(`${asker}-d`)
    })

    test('refuses a dare from another player, of the wrong kind or outside the game', () => {
      const g = toAsking()
      const { askerId, answererId } = g.state.turn!
      expectRuleError(
        () => g.run({ type: 'PICK_CUSTOM', dareId: `${answererId}-d` }),
        'dareNotAllowed',
      )
      expectRuleError(
        () => g.run({ type: 'PICK_CUSTOM', dareId: `${askerId}-t` }),
        'dareNotAllowed',
      )
      expectRuleError(
        () => g.run({ type: 'PICK_CUSTOM', dareId: `${askerId}-spicy` }),
        'dareNotAllowed',
      )
    })
  })

  test('PICK_WRITTEN validates the text and builds a dare authored by the asker', () => {
    const g = setup()
    g.run({ type: 'SPIN' })
    g.run({ type: 'SPIN_SETTLED' })
    g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
    expectRuleError(() => g.run({ type: 'PICK_WRITTEN', text: '  ' }), 'writtenInvalid')
    const s = g.run({ type: 'PICK_WRITTEN', text: '  Danse sans musique  ' })
    expect(s.phase).toBe('challenge')
    expect(s.turn!.dare).toMatchObject({
      kind: 'dare',
      category: 'fun',
      intensity: 1,
      modes: ['nearby'],
      text: 'Danse sans musique',
      authorId: s.turn!.askerId,
    })
  })

  test('with no dare available, the asker may write one even in system-only games', () => {
    const g = setup({ source: 'system', categories: ['spicy'] }, [
      makePlayer('a', { limits: { excludedCategories: ['spicy'], maxIntensity: 4 } }),
      makePlayer('b', { limits: { excludedCategories: ['spicy'], maxIntensity: 4 } }),
    ])
    g.run({ type: 'SPIN' })
    g.run({ type: 'SPIN_SETTLED' })
    const asking = g.run({ type: 'CHOOSE_KIND', kind: 'truth' })
    expect(asking.phase).toBe('asking')
    expect(asking.turn!.noDareAvailable).toBe(true)
    expect(g.run({ type: 'PICK_WRITTEN', text: 'Ton pire souvenir ?' }).phase).toBe('challenge')
  })

  test('with no dare available, skipping costs nothing and ends the turn', () => {
    const g = setup({ categories: ['spicy'] }, [
      makePlayer('a', { limits: { excludedCategories: ['spicy'], maxIntensity: 4 } }),
      makePlayer('b', { limits: { excludedCategories: ['spicy'], maxIntensity: 4 } }),
    ])
    g.run({ type: 'SPIN' })
    g.run({ type: 'SPIN_SETTLED' })
    g.run({ type: 'CHOOSE_KIND', kind: 'dare' })
    g.run({ type: 'PICK_SYSTEM' })
    const answerer = g.state.turn!.answererId
    const s = g.run({ type: 'SKIP' })
    expect(s.phase).toBe('ready')
    expect(s.scores[answerer]).toEqual({ done: 0, skipped: 0, points: 0, truths: 0, dares: 0 })
    expect(s.playedThisRound).toContain(answerer)
  })
})

describe('resolving', () => {
  function toChallenge(g: ReturnType<typeof setup>, kind: 'truth' | 'dare' = 'dare') {
    g.run({ type: 'SPIN' })
    g.run({ type: 'SPIN_SETTLED' })
    g.run({ type: 'CHOOSE_KIND', kind })
    g.run({ type: 'PICK_SYSTEM' })
    return g.state.turn!
  }

  test('COMPLETE scores, records history and marks the player as played', () => {
    const g = setup()
    const turn = toChallenge(g, 'dare')
    const s = g.run({ type: 'COMPLETE' })
    expect(s.phase).toBe('ready')
    expect(s.scores[turn.answererId]).toEqual({
      done: 1,
      skipped: 0,
      points: 2,
      truths: 0,
      dares: 1,
    })
    expect(s.history).toEqual([
      {
        round: 1,
        answererId: turn.answererId,
        askerId: turn.askerId,
        dare: turn.dare,
        outcome: 'done',
      },
    ])
    expect(s.usedDareIds).toContain(turn.dare!.id)
    expect(s.playedThisRound).toEqual([turn.answererId])
  })

  test('a full round advances to the next one, the last round finishes the game', () => {
    const g = setup({ rounds: 2 }, [makePlayer('a'), makePlayer('b')])
    for (let i = 0; i < 2; i++) {
      toChallenge(g)
      g.run({ type: 'COMPLETE' })
    }
    expect(g.state.round).toBe(2)
    expect(g.state.playedThisRound).toEqual([])
    for (let i = 0; i < 2; i++) {
      toChallenge(g)
      g.run({ type: 'COMPLETE' })
    }
    expect(g.state.phase).toBe('finished')
  })

  test('SKIP costs a point and a skip, and is refused once skips run out', () => {
    const g = setup({ maxSkips: 1, rounds: 2 }, [makePlayer('a'), makePlayer('b')])
    const first = toChallenge(g)
    const s = g.run({ type: 'SKIP' })
    expect(s.scores[first.answererId]).toMatchObject({ skipped: 1, points: -1 })
    expect(skipsLeft(s, first.answererId)).toBe(0)
    expect(s.history.at(-1)!.outcome).toBe('skipped')
    // Play until the same player is in a challenge again.
    for (;;) {
      const t = toChallenge(g)
      if (t.answererId === first.answererId) break
      g.run({ type: 'COMPLETE' })
    }
    expectRuleError(() => g.run({ type: 'SKIP' }), 'noSkipsLeft')
  })

  test('RESTART replays with the same players and settings from scratch', () => {
    const g = setup({ rounds: 1 }, [makePlayer('a'), makePlayer('b')])
    for (let i = 0; i < 2; i++) {
      toChallenge(g)
      g.run({ type: 'COMPLETE' })
    }
    const finished = g.state
    const s = g.run({ type: 'RESTART' })
    expect(s.phase).toBe('ready')
    expect(s.round).toBe(1)
    expect(s.id).not.toBe(finished.id)
    expect(s.players).toEqual(finished.players)
    expect(s.settings).toEqual(finished.settings)
    expect(s.history).toEqual([])
    expect(s.scores.a!.points).toBe(0)
  })
})

describe('rules', () => {
  test('actions outside their phase are refused', () => {
    const g = setup()
    expectRuleError(() => g.run({ type: 'COMPLETE' }), 'invalidPhase')
    expectRuleError(() => g.run({ type: 'CHOOSE_KIND', kind: 'truth' }), 'invalidPhase')
    expectRuleError(() => g.run({ type: 'SPIN_SETTLED' }), 'invalidPhase')
    expectRuleError(() => g.run({ type: 'RESTART' }), 'invalidPhase')
    g.run({ type: 'SPIN' })
    expectRuleError(() => g.run({ type: 'SPIN' }), 'invalidPhase')
  })

  test('reduce never mutates its input', () => {
    const g = setup()
    const frozen: GameState = deepFreeze(structuredClone(g.state))
    expect(() => reduce(frozen, { type: 'SPIN' }, g.ctx)).not.toThrow()
  })
})

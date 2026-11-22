import { createSeededRng, type GameSettings } from '@/engine'
import { makePlayer } from '@/engine/testing'
import { createGameStore } from './gameStore'

const settings: GameSettings = {
  mode: 'nearby',
  categories: ['fun'],
  source: 'both',
  rounds: 3,
  timerSeconds: 0,
  maxSkips: 3,
  picker: 'bottle',
}

const players = [makePlayer('a'), makePlayer('b')]

test('start creates a ready game', () => {
  const store = createGameStore(() => createSeededRng(1))
  store.getState().start({ settings, players })
  expect(store.getState().game).toMatchObject({ phase: 'ready', round: 1, players })
  expect(store.getState().error).toBeNull()
})

test('an invalid action records the error code instead of throwing', () => {
  const store = createGameStore(() => createSeededRng(1))
  store.getState().start({ settings, players })
  const before = store.getState().game
  expect(() => store.getState().dispatch({ type: 'COMPLETE' })).not.toThrow()
  expect(store.getState().error).toBe('invalidPhase')
  expect(store.getState().game).toBe(before)
})

test('a valid action clears the previous error', () => {
  const store = createGameStore(() => createSeededRng(1))
  store.getState().start({ settings, players })
  store.getState().dispatch({ type: 'COMPLETE' })
  store.getState().dispatch({ type: 'SPIN' })
  expect(store.getState().error).toBeNull()
  expect(store.getState().game!.phase).toBe('spinning')
})

test('the current game persists and quit clears it', () => {
  const store = createGameStore(() => createSeededRng(1))
  store.getState().start({ settings, players })
  expect(localStorage.getItem('av:game')).toContain('"phase":"ready"')
  store.getState().quit()
  expect(store.getState().game).toBeNull()
})

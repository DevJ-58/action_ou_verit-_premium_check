import { createSettingsStore, SETTINGS_DEFAULTS } from './settingsStore'

test('defaults are French, Nuit theme, music, sound and haptics on, age not confirmed', () => {
  expect(SETTINGS_DEFAULTS).toEqual({
    language: 'fr',
    theme: 'nuit',
    sound: true,
    haptics: true,
    music: true,
    ageConfirmedAt: null,
    toursSeen: [],
  })
})

test('a corrupted persisted value falls back to defaults', async () => {
  localStorage.setItem('av:settings', '{oops')
  const store = createSettingsStore()
  await store.persist.rehydrate()
  expect(store.getState()).toMatchObject(SETTINGS_DEFAULTS)
})

test('an unknown persisted version falls back to defaults', async () => {
  localStorage.setItem(
    'av:settings',
    JSON.stringify({ state: { language: 'en', theme: 'x' }, version: 99 }),
  )
  const store = createSettingsStore()
  await store.persist.rehydrate()
  expect(store.getState()).toMatchObject(SETTINGS_DEFAULTS)
})

test('setters update state and persist it', () => {
  const store = createSettingsStore()
  store.getState().setTheme('ivoire')
  store.getState().setLanguage('en')
  store.getState().confirmAge()
  const state = store.getState()
  expect(state.theme).toBe('ivoire')
  expect(state.language).toBe('en')
  expect(state.ageConfirmedAt).not.toBeNull()
  expect(localStorage.getItem('av:settings')).toContain('"theme":"ivoire"')
})

test('unknown values in a same-version save fall back field by field', async () => {
  localStorage.setItem(
    'av:settings',
    JSON.stringify({
      state: { language: 'de', theme: null, sound: 'yes', haptics: false, ageConfirmedAt: 42 },
      version: 1,
    }),
  )
  const store = createSettingsStore()
  await store.persist.rehydrate()
  expect(store.getState()).toMatchObject({ ...SETTINGS_DEFAULTS, haptics: false })
})

test('markTourSeen keeps each name once and survives a reload; unknown names are dropped', async () => {
  const store = createSettingsStore()
  store.getState().markTourSeen('home')
  store.getState().markTourSeen('home')
  store.getState().markTourSeen('game')
  expect(store.getState().toursSeen).toEqual(['home', 'game'])
  const saved = JSON.parse(localStorage.getItem('av:settings')!)
  saved.state.toursSeen = ['home', 'nope', 3]
  localStorage.setItem('av:settings', JSON.stringify(saved))
  const again = createSettingsStore()
  await again.persist.rehydrate()
  expect(again.getState().toursSeen).toEqual(['home'])
  again.getState().resetTours()
  expect(again.getState().toursSeen).toEqual([])
})

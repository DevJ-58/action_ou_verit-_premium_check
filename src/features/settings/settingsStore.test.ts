import { createSettingsStore, SETTINGS_DEFAULTS } from './settingsStore'

test('defaults are French, Nuit theme, music, sound and haptics on, age not confirmed', () => {
  expect(SETTINGS_DEFAULTS).toEqual({
    language: 'fr',
    theme: 'nuit',
    sound: true,
    haptics: true,
    music: true,
    ageConfirmedAt: null,
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

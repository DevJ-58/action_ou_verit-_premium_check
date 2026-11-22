import { useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { safeStorage } from '@/lib/safeStorage'

export type Language = 'fr' | 'en'
export type ThemeName = 'nuit' | 'ivoire' | 'terre'

export interface SettingsValues {
  language: Language
  theme: ThemeName
  sound: boolean
  haptics: boolean
  ageConfirmedAt: string | null
}

export interface SettingsState extends SettingsValues {
  setLanguage(language: Language): void
  setTheme(theme: ThemeName): void
  setSound(sound: boolean): void
  setHaptics(haptics: boolean): void
  confirmAge(): void
}

export const SETTINGS_DEFAULTS: SettingsValues = {
  language: 'fr',
  theme: 'nuit',
  sound: true,
  haptics: true,
  ageConfirmedAt: null,
}

const SETTINGS_VERSION = 1

/** Keeps only well-formed saved values; anything else falls back to its default. */
function sanitizeSettings(raw: unknown): Partial<SettingsValues> {
  if (typeof raw !== 'object' || raw === null) return {}
  const s = raw as Record<string, unknown>
  const out: Partial<SettingsValues> = {}
  if (s.language === 'fr' || s.language === 'en') out.language = s.language
  if (s.theme === 'nuit' || s.theme === 'ivoire' || s.theme === 'terre') out.theme = s.theme
  if (typeof s.sound === 'boolean') out.sound = s.sound
  if (typeof s.haptics === 'boolean') out.haptics = s.haptics
  if (typeof s.ageConfirmedAt === 'string') out.ageConfirmedAt = s.ageConfirmedAt
  return out
}

export function createSettingsStore() {
  return createStore<SettingsState>()(
    persist(
      (set) => ({
        ...SETTINGS_DEFAULTS,
        setLanguage: (language) => set({ language }),
        setTheme: (theme) => set({ theme }),
        setSound: (sound) => set({ sound }),
        setHaptics: (haptics) => set({ haptics }),
        confirmAge: () => set({ ageConfirmedAt: new Date().toISOString() }),
      }),
      {
        name: 'av:settings',
        version: SETTINGS_VERSION,
        storage: createJSONStorage(() => safeStorage),
        partialize: ({ language, theme, sound, haptics, ageConfirmedAt }) => ({
          language,
          theme,
          sound,
          haptics,
          ageConfirmedAt,
        }),
        // Any unknown or older shape is discarded: settings are cheap to redo.
        migrate: () => ({ ...SETTINGS_DEFAULTS }) as SettingsState,
        merge: (persisted, current) => ({ ...current, ...sanitizeSettings(persisted) }),
      },
    ),
  )
}

export const settingsStore = createSettingsStore()

export function useSettings<T>(selector: (state: SettingsState) => T): T {
  return useStore(settingsStore, selector)
}

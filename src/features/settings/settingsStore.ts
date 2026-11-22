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
      },
    ),
  )
}

export const settingsStore = createSettingsStore()

export function useSettings<T>(selector: (state: SettingsState) => T): T {
  return useStore(settingsStore, selector)
}

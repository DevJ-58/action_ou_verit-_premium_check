import { useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { safeStorage } from '@/lib/safeStorage'

export type Language = 'fr' | 'en'
export type ThemeName = 'nuit' | 'ivoire' | 'terre' | 'kente' | 'indigo'

/** Themes exclusive to Premium players. */
export const PREMIUM_THEMES: readonly ThemeName[] = ['kente', 'indigo']

/** The screens that have a step-by-step guide. */
export type TourName = 'home' | 'lobby' | 'game'
export const TOUR_NAMES: readonly TourName[] = ['home', 'lobby', 'game']

export interface SettingsValues {
  language: Language
  theme: ThemeName
  sound: boolean
  haptics: boolean
  /** Background melody during games. */
  music: boolean
  ageConfirmedAt: string | null
  /** Guides already shown on this phone (they start by themselves only once). */
  toursSeen: TourName[]
}

export interface SettingsState extends SettingsValues {
  setLanguage(language: Language): void
  setTheme(theme: ThemeName): void
  setSound(sound: boolean): void
  setHaptics(haptics: boolean): void
  setMusic(music: boolean): void
  confirmAge(): void
  markTourSeen(name: TourName): void
  resetTours(): void
}

export const SETTINGS_DEFAULTS: SettingsValues = {
  language: 'fr',
  theme: 'nuit',
  sound: true,
  haptics: true,
  music: true,
  ageConfirmedAt: null,
  toursSeen: [],
}

const SETTINGS_VERSION = 1

/** Keeps only well-formed saved values; anything else falls back to its default. */
function sanitizeSettings(raw: unknown): Partial<SettingsValues> {
  if (typeof raw !== 'object' || raw === null) return {}
  const s = raw as Record<string, unknown>
  const out: Partial<SettingsValues> = {}
  if (s.language === 'fr' || s.language === 'en') out.language = s.language
  if (['nuit', 'ivoire', 'terre', 'kente', 'indigo'].includes(s.theme as string))
    out.theme = s.theme as ThemeName
  if (typeof s.sound === 'boolean') out.sound = s.sound
  if (typeof s.haptics === 'boolean') out.haptics = s.haptics
  if (typeof s.music === 'boolean') out.music = s.music
  if (typeof s.ageConfirmedAt === 'string') out.ageConfirmedAt = s.ageConfirmedAt
  if (Array.isArray(s.toursSeen)) {
    out.toursSeen = TOUR_NAMES.filter((name) => (s.toursSeen as unknown[]).includes(name))
  }
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
        setMusic: (music) => set({ music }),
        confirmAge: () => set({ ageConfirmedAt: new Date().toISOString() }),
        markTourSeen: (name) =>
          set((s) => (s.toursSeen.includes(name) ? s : { toursSeen: [...s.toursSeen, name] })),
        resetTours: () => set({ toursSeen: [] }),
      }),
      {
        name: 'av:settings',
        version: SETTINGS_VERSION,
        storage: createJSONStorage(() => safeStorage),
        partialize: ({ language, theme, sound, haptics, music, ageConfirmedAt, toursSeen }) => ({
          language,
          theme,
          sound,
          haptics,
          music,
          ageConfirmedAt,
          toursSeen,
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

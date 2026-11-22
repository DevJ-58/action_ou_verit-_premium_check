import { useSettings, type Language } from '@/features/settings/settingsStore'
import { en } from './en'
import { fr, type Dictionary } from './fr'

const dictionaries: Record<Language, Dictionary> = { fr, en }

/** The dictionary for the current language. */
export function useT(): Dictionary {
  const language = useSettings((s) => s.language)
  return dictionaries[language]
}

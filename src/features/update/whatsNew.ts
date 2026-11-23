import type { Language } from '@/features/settings/settingsStore'

/** Reads the notes of the newest entry of public/changelog.json. */
export function notesFor(raw: unknown, language: Language): string[] {
  if (typeof raw !== 'object' || raw === null) return []
  const entries = (raw as { entries?: unknown }).entries
  if (!Array.isArray(entries) || entries.length === 0) return []
  const notes = (entries[0] as Record<string, unknown>)[language]
  return Array.isArray(notes) ? notes.filter((n): n is string => typeof n === 'string') : []
}

/** The notes of the version just published, fetched fresh from the server. */
export async function fetchWhatsNew(language: Language): Promise<string[]> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}changelog.json`, { cache: 'no-store' })
    return res.ok ? notesFor(await res.json(), language) : []
  } catch {
    return []
  }
}

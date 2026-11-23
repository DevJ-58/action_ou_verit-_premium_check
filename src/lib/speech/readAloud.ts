import { settingsStore } from '@/features/settings/settingsStore'

export type ReaderVoice = 'female' | 'male'

// Words found in the names of system voices (Android, iOS, Windows, Chrome, macOS).
const FEMALE =
  /female|femme|woman|denise|eloise|amélie|amelie|audrey|aurélie|aurelie|marie|julie|léa|lea|céline|celine|virginie|hortense|sylvie|chantal|caroline|brigitte|samantha|victoria|karen|moira|tessa|zira|aria|jenny|susan|fiona/i
const MALE =
  /\bmale\b|homme|\bman\b|henri|thomas|paul|daniel|nicolas|claude|jacques|antoine|alain|guy|jean|rémi|remi|fred|alex|david|mark|george|james|guy|ryan/i

const LOCALE = { fr: 'fr-FR', en: 'en-GB' } as const

/**
 * The best system voice for a language and gender. Without a voice of that gender, any voice
 * of the language is used, pitched higher (woman) or lower (man).
 */
export function pickVoice(
  voices: readonly SpeechSynthesisVoice[],
  language: 'fr' | 'en',
  gender: ReaderVoice,
): { voice: SpeechSynthesisVoice | null; pitch: number } {
  const ofLanguage = voices.filter((v) => v.lang.toLowerCase().startsWith(language))
  const wanted = gender === 'female' ? FEMALE : MALE
  const other = gender === 'female' ? MALE : FEMALE
  const exact = ofLanguage.filter((v) => wanted.test(v.name) && !other.test(v.name))
  // Prefer the main region (fr-FR, en-GB…) and natural / online voices.
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang === LOCALE[language] ? 2 : 0) +
    (/natural|online|neural|premium|enhanced/i.test(v.name) ? 1 : 0)
  const best = [...exact].sort((a, b) => score(b) - score(a))[0]
  if (best) return { voice: best, pitch: 1 }
  const neutral = ofLanguage.find((v) => !other.test(v.name)) ?? ofLanguage[0] ?? null
  return { voice: neutral, pitch: gender === 'female' ? 1.25 : 0.75 }
}

/** Reads a text aloud with a woman's or a man's voice (silent if sounds are off). */
export function readAloud(text: string, gender: ReaderVoice): void {
  const { sound, language } = settingsStore.getState()
  if (!sound || typeof speechSynthesis === 'undefined') return
  try {
    speechSynthesis.cancel()
    const { voice, pitch } = pickVoice(speechSynthesis.getVoices(), language, gender)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = voice?.lang ?? LOCALE[language]
    if (voice) utterance.voice = voice
    utterance.pitch = pitch
    utterance.rate = 0.95
    speechSynthesis.speak(utterance)
  } catch {
    // No speech on this device: the card stays on screen anyway.
  }
}

export function stopReading(): void {
  try {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
  } catch {
    // Ignore.
  }
}

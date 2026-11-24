import { format } from '@/i18n/format'
import type { Language } from '@/features/settings/settingsStore'
import { linesFor } from './lines'
import { pickOf, seeded } from './seeded'

const MENTION = /\baxis\b/i
const GREETING = /^\s*(salut|bonjour|bonsoir|coucou|cc|slt|hello|hi|hey|yo)\b/i

/** Axis's answer to a chat message, or null when it is not for him. */
export function replyFor(text: string, name: string, seed: string, language: Language) {
  const kind = MENTION.test(text) ? 'mention' : GREETING.test(text) ? 'greet' : null
  if (!kind) return null
  return format(pickOf(linesFor(kind, language), seeded(seed)), { name })
}

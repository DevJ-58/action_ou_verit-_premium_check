import { useEffect } from 'react'
import type { GameState } from '@/engine'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { readAloud, stopReading } from '@/lib/speech/readAloud'

/** Reads the card aloud when it is turned (if the host chose a voice); stops when the turn ends. */
export function useReadDare(game: GameState | null): void {
  const t = useT()
  const turn = game?.phase === 'challenge' ? game.turn : null
  const gender = game?.settings.readAloud ?? 'female'
  const dare = turn?.dare
  const name = turn ? (game?.players.find((p) => p.id === turn.answererId)?.name ?? '') : ''
  const text =
    dare && gender !== 'off'
      ? format(t.reader.phrase, {
          kind: dare.kind === 'truth' ? t.game.truth : t.game.dare,
          name,
          text: dare.text,
        })
      : null
  useEffect(() => {
    if (!text || gender === 'off') return
    readAloud(text, gender)
    return () => stopReading()
    // Read once per card: the text only changes with the card.
  }, [text, gender])
}

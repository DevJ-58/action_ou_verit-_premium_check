import type { FeedbackName } from '@/lib/feedback'
import type { RoomState } from '../types'

/** Which sounds this phone plays when the room changes from `prev` to `next`. */
export function roomFeedback(
  prev: RoomState | null,
  next: RoomState,
  selfId: string,
): FeedbackName[] {
  const before = prev?.game
  const after = next.game
  if (!prev || !before || !after) return []
  const out: FeedbackName[] = []
  const turn = after.turn
  const mine = turn?.answererId === selfId

  if (after.phase !== before.phase) {
    if (after.phase === 'choosing' && mine) out.push('yourTurn')
    if (after.phase === 'challenge') out.push('reveal')
    if (after.phase === 'finished') out.push('finish')
  }
  if (turn && before.turn && turn.answererId === before.turn.answererId) {
    const proposals = turn.proposals?.length ?? 0
    if (mine && proposals > (before.turn.proposals?.length ?? 0)) out.push('proposal')
    if (!mine && turn.answer && turn.answer !== before.turn.answer) out.push('message')
    const votes = Object.keys(turn.votes ?? {}).length
    if (mine && votes > Object.keys(before.turn.votes ?? {}).length) out.push('vote')
  }
  if (next.live && !prev.live && next.live.by !== selfId) out.push('yourTurn')
  const seen = new Set(prev.reactions.map((r) => r.id))
  if (next.reactions.some((r) => !seen.has(r.id) && r.from !== selfId)) out.push('reaction')
  return out
}

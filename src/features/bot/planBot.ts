import type { AxisMood } from '@/content/axis'
import type { EmojiName } from '@/content/emoji'
import { systemDares } from '@/content/systemDares'
import { drawDare, skipsLeft, type GameState } from '@/engine'
import { format } from '@/i18n/format'
import type { IntentBody, RoomState } from '@/features/room/types'
import type { Language } from '@/features/settings/settingsStore'
import { linesFor, type LineKind } from './lines'
import { pickOf, seeded } from './seeded'

/** Something Axis will do after a short, human-looking pause. */
export interface BotMove {
  /** Same key = same move: it is planned once, done once. */
  key: string
  delayMs: number
  intent?: IntentBody
  say?: { text: string; mood: AxisMood }
  react?: EmojiName
}

const SPIN_WAIT_MS = 8000
const VOTE_WAIT_MS = 8000
const TRUTH_SHARE = 0.55
const SKIP_SHARE = 0.1
const CONVINCED_SHARE = 0.88

/**
 * What Axis does next in this room, as seen by the host who plays him. Pure: the same room
 * always gives the same moves (his random choices are seeded by the turn).
 */
export function planBot(room: RoomState, botId: string, language: Language): BotMove[] {
  const game = room.game
  if (room.status === 'lobby' || !game) {
    return [
      { key: `hello:${room.code}`, delayMs: 1500, say: line('hello', room.code, {}, 'happy') },
    ]
  }
  const turnKey = `${game.id}:${game.history.length}`
  const rng = (salt: string) => seeded(`${turnKey}:${salt}`)
  const nameOf = (id: string) => room.members.find((m) => m.id === id)?.pseudo ?? ''
  const action = (a: Extract<IntentBody, { type: 'action' }>['action']) =>
    ({ type: 'action', action: a }) as const
  function line(kind: LineKind, seed: string, vars: Record<string, string>, mood: AxisMood) {
    return { text: format(pickOf(linesFor(kind, language), seeded(`${seed}:${kind}`)), vars), mood }
  }

  const turn = game.turn
  const mine = turn?.answererId === botId
  const moves: BotMove[] = []
  switch (game.phase) {
    case 'ready':
      moves.push({
        key: `spin:${turnKey}`,
        delayMs: SPIN_WAIT_MS,
        intent: action({ type: 'SPIN' }),
      })
      break
    case 'choosing':
      if (mine) {
        const kind = rng('kind')() < TRUTH_SHARE ? 'truth' : 'dare'
        moves.push({
          key: `choose:${turnKey}`,
          delayMs: 2500,
          intent: action({ type: 'CHOOSE_KIND', kind }),
          say: line(kind === 'truth' ? 'chooseTruth' : 'chooseDare', turnKey, {}, 'cheeky'),
        })
      }
      break
    case 'proposing':
      if (turn && !mine && turn.kind && !turn.proposals?.some((p) => p.playerId === botId)) {
        const dare = dareFor(game, turnKey)
        if (dare) {
          moves.push({
            key: `propose:${turnKey}`,
            delayMs: 3500,
            intent: action({ type: 'PROPOSE', playerId: botId, dare }),
            say: line('propose', turnKey, { name: nameOf(turn.answererId) }, 'cheeky'),
          })
        }
      }
      break
    case 'picking':
      if (mine && turn?.proposals?.length) {
        moves.push({
          key: `pick:${turnKey}`,
          delayMs: 2500,
          intent: action({
            type: 'PICK_PROPOSAL',
            index: Math.floor(rng('pick')() * turn.proposals.length),
          }),
          say: line('pick', turnKey, {}, 'calm'),
        })
      }
      break
    case 'challenge':
      if (!turn) break
      if (mine) {
        const kind = turn.kind ?? turn.dare?.kind ?? 'truth'
        if (!turn.answer) {
          if (skipsLeft(game, botId) > 0 && rng('skip')() < SKIP_SHARE) {
            moves.push({
              key: `skip:${turnKey}`,
              delayMs: 3500,
              intent: action({ type: 'SKIP' }),
              say: line('skip', turnKey, {}, 'laugh'),
            })
          } else {
            const story = line(kind === 'truth' ? 'truthAnswer' : 'dareStory', turnKey, {}, 'happy')
            moves.push({
              key: `answer:${turnKey}`,
              delayMs: 4000,
              intent: action({ type: 'ANSWER', playerId: botId, text: story.text }),
            })
          }
        } else if (Object.keys(turn.votes ?? {}).length > 0) {
          moves.push({
            key: `done:${turnKey}`,
            delayMs: 2000,
            intent: action({ type: 'COMPLETE' }),
            say: line('done', turnKey, {}, 'happy'),
          })
        }
      } else if (turn.votes?.[botId] === undefined) {
        const ok = rng('vote')() < CONVINCED_SHARE
        moves.push({
          key: `vote:${turnKey}:${turn.answer ? 'answered' : 'waiting'}`,
          delayMs: turn.answer ? 3000 : VOTE_WAIT_MS,
          intent: action({ type: 'VOTE', playerId: botId, ok }),
          say: line(ok ? 'voteYes' : 'voteNo', turnKey, {}, ok ? 'happy' : 'doubt'),
        })
      }
      break
    case 'finished': {
      const best = Math.max(...Object.values(game.scores).map((s) => s.points))
      const won = (game.scores[botId]?.points ?? 0) === best && best > 0
      moves.push({
        key: `end:${game.id}`,
        delayMs: 2000,
        say: line(won ? 'win' : 'lose', game.id, {}, won ? 'laugh' : 'happy'),
      })
      break
    }
  }

  // A cheer when someone else just completed their turn.
  const last = game.history.at(-1)
  if (last && last.answererId !== botId && last.outcome === 'done' && seeded(turnKey)() < 0.5) {
    moves.push({ key: `cheer:${turnKey}`, delayMs: 1200, react: 'fire' })
  }
  return moves
}

/** A game dare for the player who answers, in the room's categories and their limits. */
function dareFor(game: GameState, turnKey: string) {
  const turn = game.turn!
  const answerer = game.players.find((p) => p.id === turn.answererId)
  if (!answerer || !turn.kind) return null
  return drawDare(
    systemDares,
    {
      kind: turn.kind,
      mode: game.settings.mode,
      categories: game.settings.categories,
      limits: answerer.limits,
      usedIds: new Set(game.history.map((h) => h.dare.id)),
    },
    seeded(`${turnKey}:dare`),
  )
}

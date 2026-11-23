import { drawDare, isAllowedFor, validateWrittenDare } from './dares'
import { GameRuleError } from './errors'
import { askerIndexFor, computeSpin, seatAngle } from './geometry'
import { removePlayer } from './departures'
import { closeProposals, pickProposal, propose } from './proposals'
import { pickIndex } from './rng'
import { answer, vote } from './answers'
import { endTurn } from './turnEnd'
import {
  createGame,
  skipsLeft,
  type GameAction,
  type GameState,
  type Phase,
  type Turn,
} from './state'
import type { ChallengeKind, Dare, Rng } from './types'

export interface ReduceContext {
  rng: Rng
  systemDares: readonly Dare[]
}

function expectPhase(state: GameState, ...phases: Phase[]): void {
  if (!phases.includes(state.phase)) throw new GameRuleError('invalidPhase')
}

function currentTurn(state: GameState): Turn {
  if (!state.turn) throw new GameRuleError('invalidPhase')
  return state.turn
}

function answererOf(state: GameState, turn: Turn) {
  const player = state.players.find((p) => p.id === turn.answererId)
  if (!player) throw new GameRuleError('invalidPhase')
  return player
}

function filterFor(state: GameState, turn: Turn, kind: ChallengeKind) {
  return {
    kind,
    mode: state.settings.mode,
    categories: state.settings.categories,
    limits: answererOf(state, turn).limits,
    usedIds: new Set(state.usedDareIds),
  }
}

function spin(state: GameState, rng: Rng): GameState {
  const count = state.players.length
  const waiting = state.players.filter((p) => !state.playedThisRound.includes(p.id))
  const answerer = waiting[pickIndex(waiting.length, rng)]!
  const answererIndex = state.players.indexOf(answerer)
  const extraTurns = 5 + pickIndex(3, rng)
  return {
    ...state,
    phase: 'spinning',
    bottleRotation: computeSpin(state.bottleRotation, seatAngle(answererIndex, count), extraTurns),
    turn: {
      answererId: answerer.id,
      askerId: state.players[askerIndexFor(answererIndex, count)]!.id,
      kind: null,
      dare: null,
      noDareAvailable: false,
    },
  }
}

function withSystemDare(
  state: GameState,
  turn: Turn,
  kind: ChallengeKind,
  ctx: ReduceContext,
): GameState {
  const dare = drawDare(ctx.systemDares, filterFor(state, turn, kind), ctx.rng)
  if (!dare) return { ...state, phase: 'asking', turn: { ...turn, kind, noDareAvailable: true } }
  return { ...state, phase: 'challenge', turn: { ...turn, kind, dare, noDareAvailable: false } }
}

/** Applies one action to the game. Pure: never mutates `state`. Throws GameRuleError. */
export function reduce(state: GameState, action: GameAction, ctx: ReduceContext): GameState {
  switch (action.type) {
    case 'SPIN':
      expectPhase(state, 'ready')
      return spin(state, ctx.rng)

    case 'SPIN_SETTLED':
      if (state.phase === 'choosing') return state
      expectPhase(state, 'spinning')
      return { ...state, phase: 'choosing' }

    case 'CHOOSE_KIND': {
      expectPhase(state, 'choosing')
      const turn = currentTurn(state)
      if (state.settings.flow === 'everyone') {
        return { ...state, phase: 'proposing', turn: { ...turn, kind: action.kind, proposals: [] } }
      }
      if (state.settings.source === 'system') return withSystemDare(state, turn, action.kind, ctx)
      return { ...state, phase: 'asking', turn: { ...turn, kind: action.kind } }
    }

    case 'PICK_SYSTEM': {
      expectPhase(state, 'asking')
      if (state.settings.source === 'custom') throw new GameRuleError('dareNotAllowed')
      const turn = currentTurn(state)
      return withSystemDare(state, turn, turn.kind!, ctx)
    }

    case 'PICK_CUSTOM': {
      expectPhase(state, 'asking')
      if (state.settings.source === 'system') throw new GameRuleError('dareNotAllowed')
      const turn = currentTurn(state)
      const asker = state.players.find((p) => p.id === turn.askerId)
      const dare = asker?.customDares.find((d) => d.id === action.dareId)
      if (!dare || !isAllowedFor(dare, filterFor(state, turn, turn.kind!))) {
        throw new GameRuleError('dareNotAllowed')
      }
      return { ...state, phase: 'challenge', turn: { ...turn, dare } }
    }

    case 'PICK_WRITTEN': {
      expectPhase(state, 'asking')
      const turn = currentTurn(state)
      if (state.settings.source === 'system' && !turn.noDareAvailable) {
        throw new GameRuleError('dareNotAllowed')
      }
      const result = validateWrittenDare(action.text)
      if (!result.ok) throw new GameRuleError('writtenInvalid')
      const dare: Dare = {
        id: `written-${state.id}-${state.history.length}-${turn.answererId}`,
        kind: turn.kind!,
        category: state.settings.categories[0]!,
        intensity: 1,
        modes: [state.settings.mode],
        text: result.text,
        authorId: turn.askerId,
      }
      return { ...state, phase: 'challenge', turn: { ...turn, dare } }
    }

    case 'COMPLETE':
      expectPhase(state, 'challenge')
      return endTurn(state, currentTurn(state), 'done')

    case 'SKIP': {
      expectPhase(state, 'asking', 'challenge')
      const turn = currentTurn(state)
      if (state.phase === 'asking') {
        if (!turn.noDareAvailable) throw new GameRuleError('invalidPhase')
        return endTurn(state, turn, null)
      }
      if (skipsLeft(state, turn.answererId) === 0) throw new GameRuleError('noSkipsLeft')
      return endTurn(state, turn, 'skipped')
    }

    case 'PROPOSE':
      expectPhase(state, 'proposing')
      return propose(state, currentTurn(state), action.playerId, action.dare)

    case 'CLOSE_PROPOSALS':
      expectPhase(state, 'proposing')
      return closeProposals(state, currentTurn(state), ctx)

    case 'PICK_PROPOSAL':
      expectPhase(state, 'picking')
      return pickProposal(state, currentTurn(state), action.index)

    case 'TIMEOUT_PICK': {
      expectPhase(state, 'picking')
      const turn = currentTurn(state)
      return pickProposal(state, turn, pickIndex(turn.proposals!.length, ctx.rng))
    }

    case 'ANSWER':
      expectPhase(state, 'challenge')
      return answer(state, currentTurn(state), action)

    case 'VOTE':
      expectPhase(state, 'challenge')
      return vote(state, currentTurn(state), action.playerId, action.ok)

    case 'REMOVE_PLAYER':
      return removePlayer(state, action.playerId)

    case 'TIMEOUT_CHOOSE':
      expectPhase(state, 'choosing')
      return reduce(state, { type: 'CHOOSE_KIND', kind: ctx.rng() < 0.5 ? 'truth' : 'dare' }, ctx)

    case 'RESTART': {
      expectPhase(state, 'finished')
      const suffix = Math.floor(ctx.rng() * 36 ** 6).toString(36)
      return createGame({
        id: `${state.id.split('~')[0]}~${suffix}`,
        settings: state.settings,
        players: state.players,
      })
    }

    default: {
      const unreachable: never = action
      throw new Error(`Unknown action ${JSON.stringify(unreachable)}`)
    }
  }
}

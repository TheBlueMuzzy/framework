// THE AI MODULE — THE ARENA. AI-vs-AI games for the Personality Check.  (Pure: no screen, no network, no waiting.)
//
// Bots sit in every seat and play whole games through the game's own rules door (viewFor → bot → apply, until it's
// over), each bot seeing only its own seat's view. Every seat gets its own seeded randomness from the game's seed,
// so the same seed always plays the same game. Bots are called straight away — no think-moments, no timers (the
// game's pace is for people watching; here it's always Instant), so hundreds of games run in seconds on the PC.
// The game's half (its ARENA PLUG): its rules, how to set up a game for these seats (its board choice), its bot, and
// its behaviour meters. Everything else — the loop, seating plans, the whole report — is here, the same for every game.
// Used by `npm run ai:arena` (ai-arena.mjs) and the Dev Kit's Run check (inside a Web Worker).
// Design: framework .planning/design/ai.md ("Arena + Personality Check").
import { botSeed } from './brain'
import type { GameResult } from './check'
import type { Decision, Personality, Skill } from './types'

/** The part of the Table's Rules the arena uses (a game's Rules fits as it is — table/kit/core.ts). */
export interface ArenaRules<State, Action, Setup, View> {
  setup(input: Setup): State
  apply(state: State, seat: number, action: Action, options?: { fast?: boolean }): { state: State }
  isOver(state: State): boolean
  toAct(state: State): number[]
  viewFor(state: State, seat: number): View
}

/** Who sits in one seat: a personality at a skill. */
export interface ArenaSeat {
  personality: Personality
  skill: Skill
}

/** The Table's Bot shape: view in, action out, the rng position carried along. */
export type ArenaBot<View, Action> = (view: View, seat: number, rng: number) => { action: Action; rng: number }

/** What kind of table a game is (the plug may pick a different board for the skill ladder). */
export type TableKind = 'mixed' | 'ladder'

/** The game's half of the arena. */
export interface ArenaPlug<State, Action, Setup, View> {
  /** The game's name, for the report's title. */
  name: string
  rules: ArenaRules<State, Action, Setup, View>
  /** A new game's setup for these seats — the game picks its board (or anything else) here. */
  setup(seats: ArenaSeat[], seed: number, kind: TableKind): Setup
  /** A bot for one seat. Call onDecision with each decision (asBot's onDecision fits) so its note is kept. */
  bot(seat: ArenaSeat, onDecision: (decision: Decision<Action>) => void): ArenaBot<View, Action>
  /** The behaviour meters of each seat of one finished game ("tangles caused", "word length"…), seat order. */
  meters(game: ArenaGame<State, Action>): Record<string, number>[]
  /** The seats that won (several = a shared win). */
  winners(state: State): number[]
  /** apply in fast mode? Default false: full mode, so a game log the meters read is kept. */
  fast?: boolean
  /** Stop a game after this many moves (an error: the game never ended). Default 5000. */
  maxMoves?: number
  /** Where a seat's randomness starts. Default: the AI kit's botSeed rule (a game moving its own arena up can keep
   *  its old rule, so its old numbers stay the same). */
  seatRng?: (seed: number, seat: number) => number
}

/** One finished game. */
export interface ArenaGame<State, Action> {
  seats: ArenaSeat[]
  seed: number
  kind: TableKind
  /** The game as it ended. */
  state: State
  /** Every move in order (meters may count them). */
  moves: { seat: number; action: Action }[]
  /** Every decision's note, in order, with the seat in front ("2 Strategist rolled TRAP…"). */
  notes: string[]
  /** How long each decision took, in ms (this machine — never part of the report, so the report stays the same). */
  decisionMs: number[]
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/** One whole game with bots in every seat. */
export function playArenaGame<State, Action, Setup, View>(
  plug: ArenaPlug<State, Action, Setup, View>,
  seats: ArenaSeat[],
  seed: number,
  kind: TableKind = 'mixed',
): ArenaGame<State, Action> {
  const { rules } = plug
  let state = rules.setup(plug.setup(seats, seed, kind))
  const notes: string[] = []
  const decisionMs: number[] = []
  const moves: { seat: number; action: Action }[] = []
  const bots = seats.map((s, i) => plug.bot(s, (d) => notes.push(`${i} ${d.note}`)))
  const rngs = seats.map((_, i) => (plug.seatRng ?? botSeed)(seed, i))
  const maxMoves = plug.maxMoves ?? 5000
  while (!rules.isOver(state)) {
    if (moves.length >= maxMoves) throw new Error(`An arena game did not end within ${maxMoves} moves (seed ${seed})`)
    const acting = rules.toAct(state)
    if (!acting.length) throw new Error(`Nobody may act, but the game is not over (seed ${seed}, move ${moves.length + 1})`)
    const seat = acting[0]
    const started = now()
    const picked = bots[seat](rules.viewFor(state, seat), seat, rngs[seat])
    decisionMs.push(now() - started)
    rngs[seat] = picked.rng
    state = rules.apply(state, seat, picked.action, plug.fast ? { fast: true } : undefined).state
    moves.push({ seat, action: picked.action })
  }
  return { seats, seed, kind, state, moves, notes, decisionMs }
}

/** Each finished game as rows for the Personality Check (check.ts): who sat where, their meters, their share of the
 *  win (two winners → 0.5 each). */
export function toResults<State, Action, Setup, View>(plug: ArenaPlug<State, Action, Setup, View>, games: ArenaGame<State, Action>[]): GameResult[] {
  return games.map((game) => {
    const meters = plug.meters(game)
    const winners = plug.winners(game.state)
    return {
      seats: game.seats.map((s, i) => ({
        personality: s.personality.id,
        skill: s.skill.id,
        meters: { ...meters[i] },
        won: winners.includes(i) ? 1 / winners.length : 0,
      })),
    }
  })
}

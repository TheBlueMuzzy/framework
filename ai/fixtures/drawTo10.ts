// A TEST GAME FOR THE ARENA — the Table's "Draw to 10" (table/kit/core.test.ts) with an AI plug and two tiny
// personalities that want different things, so the arena and the Personality Check are proven without a real game.
//   The game: each turn the seat to act draws the top card of a seeded deck (only they see it) or stops. Reaching 10 or
//   more = bust (out, scores 0). It ends when every seat has stopped or bust, or the deck is empty. The highest total
//   under 10 wins (ties share it; everyone bust = nobody wins).
//   Careful (main goal SAFE): stops while it still has a cushion. Greedy (main goal GREED): keeps drawing for points.
// Used by kit/arena.test.ts and, through arenaGame.ts, by the ai-arena.mjs test.
import { asBot, makeBrain } from '../kit/brain'
import type { ArenaPlug, CheckTargets } from '../kit/arena'
import { sample } from '../kit/random'
import type { GamePlug, Personality, Skill } from '../kit/types'

export interface State { deck: number[]; hands: number[][]; stopped: boolean[]; current: number }
export type Action = { type: 'draw' } | { type: 'stop' }
export interface Setup { players: number; seed: number }
export interface View { hand: number[]; others: number[]; deckLeft: number }

const FULL_DECK = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3]
const total = (hand: number[]) => hand.reduce((a, b) => a + b, 0)
function shuffled(seed: number) {
  const deck = [...FULL_DECK]
  let n = seed
  for (let i = deck.length - 1; i > 0; i--) {
    n = (n * 16807) % 2147483647
    const j = n % (i + 1)
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}
const live = (s: State, seat: number) => !s.stopped[seat] && total(s.hands[seat]) < 10
const over = (s: State) => s.deck.length === 0 || s.hands.every((_, i) => !live(s, i))
function nextSeat(s: State) {
  for (let k = 1; k <= s.hands.length; k++) {
    const seat = (s.current + k) % s.hands.length
    if (live(s, seat)) return seat
  }
  return s.current
}

export const drawTo10 = {
  setup: ({ players, seed }: Setup): State => ({ deck: shuffled(seed), hands: Array.from({ length: players }, () => []), stopped: Array(players).fill(false), current: 0 }),
  apply(s: State, seat: number, a: Action) {
    if (over(s) || seat !== s.current) throw new Error('Not your turn')
    const next: State = { deck: [...s.deck], hands: s.hands.map((h) => [...h]), stopped: [...s.stopped], current: s.current }
    if (a.type === 'draw') next.hands[seat].push(next.deck.shift()!)
    else next.stopped[seat] = true
    next.current = nextSeat(next)
    return { state: next }
  },
  isOver: over,
  toAct: (s: State) => (over(s) ? [] : [s.current]),
  viewFor: (s: State, seat: number): View => ({ hand: s.hands[seat], others: s.hands.map((h) => h.length), deckLeft: s.deck.length }),
}

/** The highest total under 10 (ties share); everyone bust = nobody. */
export function winners(s: State): number[] {
  const scores = s.hands.map((h) => (total(h) < 10 ? total(h) : -1))
  const best = Math.max(...scores)
  return best < 0 ? [] : scores.flatMap((v, i) => (v === best ? [i] : []))
}

// ─── The AI plug: what the brain cares about in this game ───
// The hidden thing is the next card: each imagined world draws one from the cards this seat hasn't seen.
interface World extends View { next: number }

const goalPlug: GamePlug<View, Action, World> = {
  goals: [
    // SAFE: a draw that stays under 6 is fine, one that goes to 6 or more is too close to 10; stopping is neutral.
    { id: 'SAFE', trait: 'caution', score: (a, ctx) => (a.type === 'stop' ? { value: 0 } : total(ctx.world.hand) + ctx.world.next >= 6 ? { value: -1, why: 'too close to 10' } : { value: 1, why: 'still safe' }) },
    // GREED: a draw is worth the card it gets; a bust only feels like losing one point (greed shrugs off the risk).
    { id: 'GREED', trait: 'greed', score: (a, ctx) => (a.type === 'stop' ? { value: 0 } : total(ctx.world.hand) + ctx.world.next < 10 ? { value: ctx.world.next, why: `+${ctx.world.next}` } : { value: -1, why: 'bust' }) },
  ],
  readings: (v) => ({ total: total(v.hand) }),
  imagine(v, _seat, rng) {
    const unseen = [...FULL_DECK]
    for (const c of v.hand) unseen.splice(unseen.indexOf(c), 1)
    const picked = sample(unseen, 1, rng)
    return { world: { ...v, next: picked.items[0] ?? 0 }, rng: picked.rng }
  },
  candidates(_world, _seat, limit, rng) {
    const s = sample<Action>([{ type: 'draw' }, { type: 'stop' }], limit, rng)
    return { actions: s.items, rng: s.rng }
  },
  key: (a) => a.type,
  describe: (a) => a.type,
}

export const careful: Personality = { id: 'Careful', traits: { caution: { min: 80, max: 95 }, greed: { min: 10, max: 25 } }, goals: ['SAFE', 'GREED'], nudge: 0.2, shifts: [], chattiness: 0 }
export const greedy: Personality = { id: 'Greedy', traits: { caution: { min: 10, max: 25 }, greed: { min: 80, max: 95 } }, goals: ['GREED', 'SAFE'], nudge: 0.2, shifts: [], chattiness: 0 }
/** Lowest first. Apprentice only ever looks at one of the two moves (so it plays at random); Expert imagines many cards. */
export const skills: Skill[] = [
  { id: 'Apprentice', candidates: 1, worlds: 1, spread: 0, topN: 2, wobble: 0.4, beliefNoise: 0 },
  { id: 'Steady', candidates: 2, worlds: 4, spread: 0.8, topN: 2, wobble: 0.1, beliefNoise: 0 },
  { id: 'Expert', candidates: 2, worlds: 16, spread: 1, topN: 1, wobble: 0, beliefNoise: 0 },
]

export const targets: CheckTargets = {
  personalities: {
    Careful: [
      { meter: 'busted', op: '<=', value: 0.05, label: 'hardly ever busts' },
      { meter: 'draws', op: 'tableWorst', label: 'draws the fewest cards' },
    ],
    Greedy: [
      { meter: 'draws', op: 'tableBest', label: 'draws the most cards' },
      { meter: 'busted', op: '>=', value: 0.15, label: 'busts in some games' },
    ],
  },
  all: [
    { check: 'tellApart', min: 0.7, label: 'the tell-apart grid recognises it at least 70% of the time' },
    { check: 'skillLadder', min: 0.5, label: 'its Expert beats its Apprentice more often than not' },
    { check: 'stops', min: 0.01, label: 'stops by itself in some games (a check of the game plug\'s own)' },
  ],
}

export const arenaPlug: ArenaPlug<State, Action, Setup, View> = {
  name: 'Draw to 10',
  rules: drawTo10,
  setup: (seats, seed) => ({ players: seats.length, seed }),
  bot: (s, onDecision) => asBot(makeBrain(goalPlug, s.personality, s.skill), (d) => onDecision(d)),
  meters: (game) =>
    game.seats.map((_, i) => ({
      draws: game.moves.filter((m) => m.seat === i && m.action.type === 'draw').length,
      held: total(game.state.hands[i]),
      busted: total(game.state.hands[i]) >= 10 ? 1 : 0,
      stopped: game.state.stopped[i] ? 1 : 0,
    })),
  winners: (s) => winners(s),
  // "What wins?": the hand's total, and how far it is from the best other hand (both read after turns 3, 5 and at the end)
  situations: (s, seat) => {
    const mine = total(s.hands[seat])
    const best = Math.max(0, ...s.hands.map((h, i) => (i === seat || total(h) >= 10 ? 0 : total(h))))
    return { total: mine, lead: mine - best, busted: mine >= 10 ? 1 : 0 }
  },
  checks: {
    stops: (results, skill) => {
      const out = new Map<string, number[]>()
      for (const g of results) for (const s of g.seats) if (!skill || s.skill === skill) out.set(s.personality, [...(out.get(s.personality) ?? []), s.meters.stopped])
      return new Map([...out].map(([p, xs]) => [p, xs.reduce((a, b) => a + b, 0) / xs.length]))
    },
  },
}

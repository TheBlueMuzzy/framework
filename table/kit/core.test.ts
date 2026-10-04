import { describe, expect, it } from 'vitest'
import { addMove, canSee, eventsFor, replay, type Rules, type TableEvent } from './core'
import { selfTest } from './selfTest'

// "Draw to 10" — a tiny example game for these tests. Each turn the seat to act draws the top card of a seeded deck
// (only they see which card) or stops. A seat that reaches 10 or more is out; the game ends when every seat has
// stopped or is out, or the deck is empty. `notes` is end-screen bookkeeping that fast mode skips.
interface State { deck: number[]; hands: number[][]; stopped: boolean[]; current: number; notes: string[] }
type Action = { type: 'draw' } | { type: 'stop' }
type Event = TableEvent & ({ type: 'drew'; card: number } | { type: 'drewHidden' } | { type: 'stopped' } | { type: 'gameOver' })
interface Setup { players: number; seed: number }
type View = { hand: number[]; others: number[]; deckLeft: number }

const total = (hand: number[]) => hand.reduce((a, b) => a + b, 0)
function shuffled(seed: number) {
  const deck = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3]
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

const drawTo10: Rules<State, Action, Event, Setup, View> = {
  setup: ({ players, seed }) => ({ deck: shuffled(seed), hands: Array.from({ length: players }, () => []), stopped: Array(players).fill(false), current: 0, notes: [] }),
  legalActions: (s, seat) => (over(s) || seat !== s.current ? [] : [{ type: 'draw' }, { type: 'stop' }]),
  check: (s, seat, a) => (over(s) ? 'The game is over' : seat !== s.current ? 'Not your turn' : a.type === 'draw' || a.type === 'stop' ? null : 'Unknown action'),
  apply(s, seat, a, options) {
    const reason = drawTo10.check(s, seat, a)
    if (reason) throw new Error(reason)
    const next: State = { deck: [...s.deck], hands: s.hands.map((h) => [...h]), stopped: [...s.stopped], current: s.current, notes: [...s.notes] }
    const events: Event[] = []
    if (a.type === 'draw') {
      const card = next.deck.shift()!
      next.hands[seat].push(card)
      events.push({ type: 'drew', card, seen: { seats: [seat] } })
      events.push({ type: 'drewHidden', seen: { seats: next.hands.map((_, i) => i).filter((i) => i !== seat) } })
    } else {
      next.stopped[seat] = true
      events.push({ type: 'stopped', seen: 'all' })
    }
    if (!options?.fast) next.notes.push(`seat ${seat} ${a.type}`)
    next.current = nextSeat(next)
    if (over(next)) events.push({ type: 'gameOver', seen: 'all' })
    return { state: next, events }
  },
  isOver: over,
  toAct: (s) => (over(s) ? [] : [s.current]),
  viewFor: (s, seat) => ({ hand: s.hands[seat], others: s.hands.map((h) => h.length), deckLeft: s.deck.length }),
}

const setups = [2, 3, 4].flatMap((players) => [1, 2, 3].map((seed) => ({ players, seed })))
const options = { seatCount: (s: State) => s.hands.length, sameGame: (a: State, b: State) => JSON.stringify({ ...a, notes: [] }) === JSON.stringify({ ...b, notes: [] }) }

describe('events: who may see them', () => {
  const events: Event[] = [
    { type: 'drew', card: 3, seen: { seats: [1] } },
    { type: 'stopped', seen: 'all' },
  ]
  it('a seat sees events for everyone and its own', () => {
    expect(canSee(events[0], 1)).toBe(true)
    expect(canSee(events[0], 0)).toBe(false)
    expect(eventsFor(events, 0).map((e) => e.type)).toEqual(['stopped'])
    expect(eventsFor(events, 1).map((e) => e.type)).toEqual(['drew', 'stopped'])
  })
})

describe('move record + replay', () => {
  it('the same setup + the same moves = the same game', () => {
    let state = drawTo10.setup({ players: 2, seed: 7 })
    let record = { setup: { players: 2, seed: 7 }, moves: [] as { seat: number; action: Action }[] }
    for (const action of [{ type: 'draw' }, { type: 'draw' }, { type: 'stop' }, { type: 'draw' }] as Action[]) {
      const seat = state.current
      state = drawTo10.apply(state, seat, action).state
      record = addMove(record, seat, action)
    }
    expect(replay(drawTo10, record).state).toEqual(state)
    expect(replay(drawTo10, record).events).toHaveLength(4)
  })

  it('addMove never edits the record it was given', () => {
    const record = { setup: { players: 2, seed: 1 }, moves: [] }
    addMove(record, 0, { type: 'draw' })
    expect(record.moves).toEqual([])
  })

  it('says which move is no longer allowed', () => {
    const record = { setup: { players: 2, seed: 1 }, moves: [{ seat: 1, action: { type: 'draw' } as Action }] }
    expect(() => replay(drawTo10, record)).toThrow('Move 1 (seat 1) is not allowed: Not your turn')
  })
})

describe('selfTest', () => {
  it('a game that keeps every promise: no problems', () => {
    expect(selfTest(drawTo10, setups, options)).toEqual([])
  })

  it('catches apply() editing the state it was given', () => {
    const broken = { ...drawTo10, apply: (s: State, seat: number, a: Action) => { const r = drawTo10.apply(s, seat, a); s.notes.push('oops'); return r } }
    expect(selfTest(broken, setups.slice(0, 1), options).join('\n')).toContain('apply() changed the state it was given')
  })

  it('catches a legal-actions list with a repeat, or with an action check() refuses', () => {
    const repeats = { ...drawTo10, legalActions: (s: State, seat: number) => [...drawTo10.legalActions(s, seat), { type: 'stop' } as Action] }
    expect(selfTest(repeats, setups.slice(0, 1), options).join('\n')).toContain('twice')
    const refused = { ...drawTo10, check: (s: State, seat: number, a: Action) => (a.type === 'stop' ? 'No stopping' : drawTo10.check(s, seat, a)) }
    expect(selfTest(refused, setups.slice(0, 1), options).join('\n')).toContain("check() says no: No stopping")
  })

  it('catches fast mode playing a different game', () => {
    const differs = { ...drawTo10, apply: (s: State, seat: number, a: Action, o?: { fast?: boolean }) => { const r = drawTo10.apply(s, seat, a, o); if (o?.fast) r.state.current = 0; return r } }
    expect(selfTest(differs, setups.slice(0, 3), { ...options }).join('\n')).toContain('fast mode plays a different game')
  })

  it('catches an event that does not say who may see it', () => {
    const unmarked = { ...drawTo10, apply: (s: State, seat: number, a: Action, o?: { fast?: boolean }) => { const r = drawTo10.apply(s, seat, a, o); return { ...r, events: [...r.events, { type: 'stopped' } as Event] } } }
    expect(selfTest(unmarked, setups.slice(0, 1), options).join('\n')).toContain("doesn't say who may see it")
  })

  it('catches a game that never ends', () => {
    const endless = { ...drawTo10, isOver: () => false, toAct: (s: State) => [s.current], legalActions: (s: State, seat: number) => (seat === s.current ? [{ type: 'stop' } as Action] : []), check: () => null, apply: (s: State) => ({ state: s, events: [] }) }
    expect(selfTest(endless, setups.slice(0, 1), { ...options, maxMoves: 50 }).join('\n')).toContain('not over after 50 moves')
  })
})

import { describe, expect, it } from 'vitest'
import { addRunMove, dailySeed, recordRun, REPLAY_WORDS, replayRun, sameResult, utcDay, type RunRecord } from './replay'
// Only the test reaches into the table module: to prove its Rules and replay() fit this file as they are
// (a game copies the two modules separately — the kit itself never imports it).
import { replay, type Rules, type TableEvent } from '../../table/kit/core'

// A tiny dice race played through the table module's Rules: randomness lives IN the state (a mulberry32 position,
// like Glyphtender's), so the same setup + the same moves = the same game.
type Race = { rng: number; scores: number[]; current: number; rolls: number[]; over: boolean }
type RaceAction = { type: 'roll' } | { type: 'pass' }
type RaceSetup = { players: number; seed: number }

function nextRandom(rng: number) {
  const next = (rng + 0x6d2b79f5) | 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: next }
}

const GOAL = 20
const race: Rules<Race, RaceAction, TableEvent, RaceSetup, Race> = {
  setup: ({ players, seed }) => ({ rng: seed, scores: Array(players).fill(0), current: 0, rolls: [], over: false }),
  legalActions: (s, seat) => (s.over || seat !== s.current ? [] : [{ type: 'roll' }, { type: 'pass' }]),
  check: (s, seat, action) => {
    if (s.over) return 'The game is over.'
    if (seat !== s.current) return 'It\'s not your turn.'
    if (action.type !== 'roll' && action.type !== 'pass') return 'That isn\'t a move in this game.'
    return null
  },
  apply(s, seat, action) {
    const problem = race.check(s, seat, action)
    if (problem) throw new Error(problem)
    let { rng } = s
    const scores = [...s.scores]
    const rolls = [...s.rolls]
    if (action.type === 'roll') {
      const r = nextRandom(rng)
      rng = r.rng
      const die = 1 + Math.floor(r.value * 6)
      scores[seat] += die
      rolls.push(die)
    }
    const over = scores[seat] >= GOAL
    return { state: { rng, scores, current: over ? seat : (seat + 1) % scores.length, rolls, over }, events: [] }
  },
  isOver: (s) => s.over,
  toAct: (s) => (s.over ? [] : [s.current]),
  viewFor: (s) => s,
}

/** A live game, played the way a game screen does: apply each move, add it to the record. The "AI" picks with
 *  Math.random — its own randomness never matters, because the moves are logged, not its thinking. */
function playLive(seed: number, rulesVersion: number | string = 3) {
  let state = race.setup({ players: 2, seed })
  let record = recordRun<RaceSetup, RaceAction>({ rulesVersion, setup: { players: 2, seed } })
  const prints: string[] = []
  while (!state.over) {
    const action: RaceAction = Math.random() < 0.8 ? { type: 'roll' } : { type: 'pass' }
    const seat = state.current
    state = race.apply(state, seat, action).state
    record = addRunMove(record, seat, action, seat === 1 ? 'bot' : 'seat')
    prints.push(JSON.stringify(state))
  }
  return { state, record, prints }
}

describe('replayRun — the same setup + the same moves = the same game', () => {
  it('rebuilds the live game exactly, at every move, not just the end', () => {
    for (const seed of [1, 42, 2026, 0x7fffffff]) {
      const live = playLive(seed)
      const seen: string[] = []
      const back = replayRun(race, live.record, { rulesVersion: 3, everyMove: (s) => seen.push(JSON.stringify(s)) })
      expect(back.ok).toBe(true)
      expect(seen).toEqual(live.prints)
      if (back.ok) expect(sameResult(live.state, back.state)).toBe(true)
    }
  })

  it('a record survives being saved as JSON (a run save, a save code) and replays the same', () => {
    const live = playLive(7)
    const stored = JSON.parse(JSON.stringify(live.record)) as RunRecord<RaceSetup, RaceAction>
    const back = replayRun(race, stored, { rulesVersion: 3 })
    expect(back.ok && sameResult(live.state, back.state)).toBe(true)
  })

  it('gives the same game as the table module\'s own replay() — its Rules fit as they are', () => {
    const live = playLive(99)
    const back = replayRun(race, live.record, { rulesVersion: 3 })
    expect(back.ok && back.state).toEqual(replay(race, live.record).state)
  })

  it('the moves so far rebuild a game in progress (Continue mid-game)', () => {
    const live = playLive(5)
    const half = recordRun({ ...live.record, moves: live.record.moves.slice(0, 4) })
    const back = replayRun(race, half, { rulesVersion: 3 })
    expect(back.ok && JSON.stringify(back.state)).toBe(live.prints[3])
  })

  it('who played a move is kept, and never changes the game', () => {
    const live = playLive(11)
    expect(live.record.moves.some((m) => m.by === 'bot')).toBe(true)
    const noBy = recordRun({ ...live.record, moves: live.record.moves.map(({ seat, action }) => ({ seat, action })) })
    const a = replayRun(race, live.record, { rulesVersion: 3 })
    const b = replayRun(race, noBy, { rulesVersion: 3 })
    expect(a.ok && b.ok && sameResult(a.state, b.state)).toBe(true)
  })

  it('records are never edited: addRunMove and recordRun hand back new ones', () => {
    const start = recordRun<RaceSetup, RaceAction>({ rulesVersion: 1, setup: { players: 2, seed: 1 } })
    const one = addRunMove(start, 0, { type: 'roll' })
    expect(start.moves).toEqual([])
    expect(one).toEqual({ rulesVersion: 1, setup: { players: 2, seed: 1 }, moves: [{ seat: 0, action: { type: 'roll' } }] })
    const setup = { players: 2, seed: 3 }
    const copy = recordRun({ rulesVersion: 1, setup })
    setup.seed = 4
    expect(copy.setup.seed).toBe(3)
  })
})

describe('sameResult', () => {
  it('compares what counts — the whole state, a fingerprint, or a saved fingerprint string', () => {
    const a = { board: [1, 2], shownAt: 10 }
    const b = { board: [1, 2], shownAt: 99 }
    expect(sameResult(a, b)).toBe(false)
    const print = (s: typeof a) => s.board.join(',')
    expect(sameResult(a, b, print)).toBe(true)
    expect(sameResult('1,2', b, print)).toBe(true) // a fingerprint saved beside the record
    expect(sameResult('1,3', b, print)).toBe(false)
  })
})

describe('refusals — plain words, never a wrong game, never a throw', () => {
  it('a record from another rules version is refused before a single move is played', () => {
    const live = playLive(8, 2)
    let played = 0
    const back = replayRun(race, live.record, { rulesVersion: 3, everyMove: () => played++ })
    expect(back).toEqual({ ok: false, reason: 'other-version', message: REPLAY_WORDS.otherVersion })
    expect(played).toBe(0)
    // a string version works the same ("1.4" ≠ "1.5")
    expect(replayRun(race, { ...live.record, rulesVersion: '1.4' }, { rulesVersion: '1.5' }).ok).toBe(false)
  })

  it('a replay that lands on a different game than the one left is refused (matches: the saved fingerprint)', () => {
    const live = playLive(12)
    const print = (s: Race) => s.rolls.join('-')
    const same = replayRun(race, live.record, { rulesVersion: 3, matches: { live: print(live.state), view: print } })
    expect(same.ok).toBe(true)
    // a setup that changed under the record (as if it read the clock): the same moves play, but it's another game
    const leaky = { ...race, setup: (input: RaceSetup) => ({ ...race.setup(input), rolls: [Date.now() % 6] }) }
    expect(replayRun(leaky, live.record, { rulesVersion: 3, matches: { live: print(live.state), view: print } }))
      .toEqual({ ok: false, reason: 'different', message: REPLAY_WORDS.different })
    expect(replayRun(race, live.record, { rulesVersion: 3, matches: { live: { ...live.state, rolls: [] } } }).ok).toBe(false) // whole state
  })

  it('a move the rules refuse says which move', () => {
    const live = playLive(9)
    const forged = recordRun({ ...live.record, moves: [live.record.moves[0], { seat: 0, action: { type: 'roll' } }] }) // seat 0 twice
    const back = replayRun(race, forged, { rulesVersion: 3 })
    expect(back).toEqual({ ok: false, reason: 'move-refused', message: REPLAY_WORDS.moveRefused, move: 2 })
    const unknown = recordRun({ ...live.record, moves: [{ seat: 0, action: { type: 'cheat' } as unknown as RaceAction }] })
    expect(replayRun(race, unknown, { rulesVersion: 3 })).toMatchObject({ ok: false, reason: 'move-refused', move: 1 })
  })

  it('anything that isn\'t a record is damaged — and the words can be the game\'s own', () => {
    for (const bad of [null, 'GAME-1z-xyz', { rulesVersion: 3 }, { rulesVersion: 3, setup: {}, moves: [{ action: 1 }] }, { setup: {}, moves: [] }]) {
      expect(replayRun(race, bad as never, { rulesVersion: 3 })).toMatchObject({ ok: false, reason: 'damaged' })
    }
    const throwsInSetup = { ...race, setup: () => { throw new Error('no board called that') } }
    expect(replayRun(throwsInSetup, recordRun({ rulesVersion: 3, setup: { players: 2, seed: 1 } }), { rulesVersion: 3 }).ok).toBe(false)
    expect(replayRun(race, recordRun({ rulesVersion: 1, setup: { players: 2, seed: 1 } }), { rulesVersion: 3, words: { otherVersion: 'Old game!' } }))
      .toMatchObject({ message: 'Old game!' })
  })
})

describe('dailySeed — everyone gets the same game each day', () => {
  it('the same all day (UTC), whatever the hour', () => {
    const morning = dailySeed('glyphtender', Date.UTC(2026, 9, 20, 0, 0, 1))
    const night = dailySeed('glyphtender', Date.UTC(2026, 9, 20, 23, 59, 59))
    expect(night).toBe(morning)
    expect(dailySeed('glyphtender', '2026-10-20')).toBe(morning)
  })

  it('the same on every device: a fixed number (no clock but the date, no device, no Math.random)', () => {
    // Pinned: if this ever changes, every player's daily game (and every daily leaderboard) changes with it
    expect(dailySeed('glyphtender', '2026-10-20')).toBe(dailySeed('glyphtender', new Date('2026-10-20T12:00:00Z')))
    expect(dailySeed('glyphtender', '2026-10-20')).toBe(4283455274)
    // a phone in Tokyo and a laptop in Los Angeles at the same moment are on the same UTC day
    const moment = Date.UTC(2026, 9, 20, 15, 0, 0)
    expect(utcDay(new Date(moment))).toBe('2026-10-20')
  })

  it('a different game each day, and for each game', () => {
    const seeds = new Set<number>()
    for (let d = 1; d <= 365; d++) seeds.add(dailySeed('glyphtender', Date.UTC(2026, 0, d, 12)))
    expect(seeds.size).toBe(365)
    expect(dailySeed('goops', '2026-10-20')).not.toBe(dailySeed('glyphtender', '2026-10-20'))
  })

  it('is a whole number a seeded generator takes (0 … 2^32 − 1)', () => {
    for (let d = 1; d <= 50; d++) {
      const seed = dailySeed('x', Date.UTC(2027, 0, d))
      expect(Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32).toBe(true)
    }
  })

  it('two players on the daily seed start the very same game', () => {
    const seed = dailySeed('dice-race', '2026-10-20')
    const a = replayRun(race, recordRun({ rulesVersion: 1, setup: { players: 2, seed }, moves: [{ seat: 0, action: { type: 'roll' } }] }), { rulesVersion: 1 })
    const b = replayRun(race, recordRun({ rulesVersion: 1, setup: { players: 2, seed }, moves: [{ seat: 0, action: { type: 'roll' } }] }), { rulesVersion: 1 })
    expect(a.ok && b.ok && sameResult(a.state, b.state)).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import type { GameResult } from './check'
import { edge, margin, sentence, terciles, whatWins } from './wins'

// Two-player games where seat 0 has `a` and seat 1 has `b` of a situation, and `winner` won (or null = a shared win)
const game = (a: number, b: number, winner: 0 | 1 | null, moment = 'turn 5', extra: Record<string, [number, number]> = {}): GameResult => ({
  seats: [0, 1].map((i) => ({
    personality: i ? 'B' : 'A',
    skill: 'Mid',
    meters: {},
    won: winner === null ? 0.5 : winner === i ? 1 : 0,
    situations: { [moment]: { lead: i ? b : a, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v[i]])) } },
  })),
})

describe('terciles', () => {
  it('splits into thirds by size', () => {
    expect(terciles([9, 1, 5, 3, 7, 2, 8, 4, 6])).toEqual([{ low: 1, high: 3 }, { low: 4, high: 6 }, { low: 7, high: 9 }])
  })
  it('never splits equal numbers: a yes/no number makes two groups, one number repeated makes one', () => {
    expect(terciles([0, 0, 0, 0, 0, 0, 0, 1, 1, 1])).toEqual([{ low: 0, high: 0 }, { low: 1, high: 1 }])
    expect(terciles([4, 4, 4, 4])).toEqual([{ low: 4, high: 4 }])
    expect(terciles([1, 1, 1, 1, 2, 3])).toEqual([{ low: 1, high: 1 }, { low: 2, high: 2 }, { low: 3, high: 3 }])
    expect(terciles([])).toEqual([])
  })
})

describe('the edge', () => {
  it('the winner had more in every pair → 1; less → 0; ties count half', () => {
    expect(edge([[{ won: 1, value: 5 }, { won: 0, value: 2 }]])).toEqual({ edge: 1, pairs: 1 })
    expect(edge([[{ won: 1, value: 1 }, { won: 0, value: 2 }]])).toEqual({ edge: 0, pairs: 1 })
    expect(edge([[{ won: 1, value: 3 }, { won: 0, value: 3 }]])).toEqual({ edge: 0.5, pairs: 1 })
  })
  it('only pairs inside one game; a shared win is two winners; nobody won = no pairs', () => {
    expect(edge([[{ won: 0.5, value: 4 }, { won: 0.5, value: 1 }, { won: 0, value: 2 }]])).toEqual({ edge: 0.5, pairs: 2 })
    expect(edge([[{ won: 0, value: 4 }, { won: 0, value: 1 }]])).toEqual({ edge: 0.5, pairs: 0 })
  })
  it('the margin: ±1/√n', () => {
    expect(margin(100)).toBe(0.1)
    expect(margin(0)).toBe(1)
  })
})

describe('what wins', () => {
  // 60 games: the bigger lead always wins (a perfect predictor); "noise" says nothing (same in winners and losers)
  const perfect = Array.from({ length: 60 }, (_, g) => game(g % 10, (g * 7) % 10 === g % 10 ? (g % 10) + 1 : (g * 7) % 10, (g * 7) % 10 === g % 10 || (g * 7) % 10 > g % 10 ? 1 : 0, 'turn 5', { noise: [g % 2, g % 2] }))

  it('a situation that perfectly predicts: edge 100%, the top group wins far more than the bottom', () => {
    const r = whatWins(perfect)
    const lead = r.all.find((s) => s.situation === 'lead')!
    expect(lead).toMatchObject({ edge: 1, strength: 1, pairs: 60, moment: 'turn 5' })
    expect(lead.leftOut).toBeUndefined()
    expect(lead.groups[lead.groups.length - 1].winRate).toBeGreaterThan(lead.groups[0].winRate)
    expect(r.top[0]).toMatch(/^Players with lead \d+ or more after turn 5 win \d+% \(of \d+ games, ±\d+%\) — vs \d+% with \d+ or less$/)
    expect(r.baseRate).toBe(0.5)
    expect(r.seats).toBe(120)
  })

  it('one that doesn\'t: the same for winner and loser → edge 50%, strength 0, ranked below', () => {
    const r = whatWins(perfect)
    const noise = r.all.find((s) => s.situation === 'noise')!
    expect(noise).toMatchObject({ edge: 0.5, strength: 0 })
    expect(r.all[0].situation).toBe('lead')
  })

  it('fewer is better: the edge goes under 50% and the sentence names the low end', () => {
    const r = whatWins(perfect.map((g) => ({ seats: g.seats.map((s) => ({ ...s, situations: { 'turn 3': { tiles: -s.situations!['turn 5'].lead } } })) })))
    expect(r.all[0]).toMatchObject({ situation: 'tiles', edge: 0, strength: 1 })
    expect(r.top[0]).toMatch(/^Players with tiles -?\d+ or less after turn 3 win/)
  })

  it('a number that decides the winner at the end is the win itself (the score): named apart, not a sentence', () => {
    const atEnd = perfect.map((g) => ({ seats: g.seats.map((s) => ({ ...s, situations: { ...s.situations, end: { lead: s.situations!['turn 5'].lead } } })) }))
    const r = whatWins(atEnd)
    expect(r.theWin).toEqual(['lead'])
    expect(r.all.find((s) => s.moment === 'end')).toMatchObject({ isTheWin: true, strength: 1 })
    expect(r.top[0]).toMatch(/after turn 5/) // its strongest moment that isn't the win itself
    expect(whatWins(atEnd, { isTheWin: 1.01 }).theWin).toEqual([]) // the bar is a setting
  })

  it('tiny samples: left out and said so, never hidden', () => {
    const r = whatWins(perfect.slice(0, 10))
    expect(r.top).toEqual([])
    expect(r.leftOut[0]).toMatch(/^lead after turn 5: too few games \(10 winner-vs-loser pairs, needs 30\)$/)
    expect(r.all.every((s) => s.leftOut)).toBe(true)
    const always = whatWins(Array.from({ length: 40 }, () => game(3, 3, 0)))
    expect(always.leftOut).toEqual(['lead after turn 5: always 3 — nothing to compare'])
  })

  it('one sentence per situation (its strongest moment), at most `top`, only at the skill asked for', () => {
    const twice = perfect.map((g) => ({ seats: g.seats.map((s) => ({ ...s, situations: { ...s.situations, end: { lead: s.won } } })) }))
    const r = whatWins(twice, { top: 1 })
    expect(r.top).toHaveLength(1)
    expect(r.all.filter((s) => s.situation === 'lead')).toHaveLength(2)
    expect(whatWins(perfect, { skill: 'Other' }).seats).toBe(0)
  })

  it('a middle group that wins best says so (a total that\'s high but not bust)', () => {
    const s = { situation: 'total', moment: 'end', edge: 0.6, pairs: 90, strength: 0.2, groups: [{ low: 0, high: 4, games: 40, winRate: 0.2 }, { low: 5, high: 8, games: 40, winRate: 0.7 }, { low: 9, high: 15, games: 40, winRate: 0.1 }] }
    expect(sentence(s)).toBe('Players with total 5 to 8 at the end win 70% (of 40 games, ±16%) — vs 10% with 9 or more')
  })

  it('a group too small for the sentence is skipped; old results without situations give nothing', () => {
    const s = { situation: 'x', moment: 'turn 3', edge: 0.8, pairs: 90, strength: 0.6, groups: [{ low: 0, high: 1, games: 50, winRate: 0.2 }, { low: 2, high: 3, games: 50, winRate: 0.6 }, { low: 4, high: 9, games: 5, winRate: 1 }] }
    expect(sentence(s)).toBe('Players with x 2 to 3 after turn 3 win 60% (of 50 games, ±14%) — vs 20% with 1 or less')
    expect(whatWins([{ seats: [{ personality: 'A', skill: 'Mid', meters: {}, won: 1 }] }])).toMatchObject({ top: [], all: [], seats: 0 })
  })
})

describe('review fixes', () => {
  it('a smaller first run of equal numbers stays its own group (not swallowed by a big middle run)', () => {
    // a count that's 0 for a fifth, 1 for most, 2 for a tenth: three groups, so 0 vs 1 can still be compared
    const values = [...Array(20).fill(0), ...Array(70).fill(1), ...Array(10).fill(2)]
    expect(terciles(values)).toEqual([{ low: 0, high: 0 }, { low: 1, high: 1 }, { low: 2, high: 2 }])
  })
})

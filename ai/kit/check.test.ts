import { describe, expect, it } from 'vitest'
import { checkFeelTargets, skillLadder, tellApart, winRates, type GameResult, type SeatResult } from './check'
import { nextRandom } from './random'

// Made-up arena results: Bullies tangle a lot and spell short; Scholars spell long and rarely tangle.
let rng = 1
const noise = (size: number) => {
  const r = nextRandom(rng)
  rng = r.rng
  return (r.value * 2 - 1) * size
}
const seat = (personality: string, won: number, skill = 'mid'): SeatResult => ({
  personality,
  skill,
  won,
  meters: personality === 'Bully' ? { tangles: 1.4 + noise(0.4), wordLength: 3.1 + noise(0.3) } : { tangles: 0.2 + noise(0.2), wordLength: 4.6 + noise(0.4) },
})
const games: GameResult[] = Array.from({ length: 100 }, (_, i) => ({ seats: [seat('Bully', i % 5 < 2 ? 1 : 0), seat('Scholar', i % 5 < 2 ? 0 : 1)] }))

describe('the Personality Check', () => {
  it('feel targets: threshold and table targets go green or red with what was measured', () => {
    const out = checkFeelTargets(games, {
      Bully: [
        { meter: 'tangles', op: '>=', value: 1, label: 'tangles a lot' },
        { meter: 'tangles', op: 'tableBest', label: 'tangles most' },
        { meter: 'wordLength', op: '>=', value: 4, label: 'spells long (it does not)' },
      ],
      Scholar: [{ meter: 'wordLength', op: 'tableBest', label: 'longest words' }],
    })
    expect(out.Bully.map((t) => t.pass)).toEqual([true, true, false])
    expect(out.Bully[1].rival?.personality).toBe('Scholar')
    expect(out.Scholar[0].pass).toBe(true)
    expect(out.Bully[0].measured).toBeGreaterThan(1.2)
  })

  it('tell-apart: clearly different behaviour is told apart; identical behaviour is a coin toss', () => {
    const t = tellApart(games, ['tangles', 'wordLength'])
    expect(t.overall).toBeGreaterThan(0.95)
    expect(t.grid.Bully.Bully + t.grid.Bully.Scholar).toBe(100)
    rng = 5
    const twins: GameResult[] = Array.from({ length: 200 }, () => ({
      seats: ['A', 'B'].map((p) => ({ personality: p, skill: 'mid', won: 0, meters: { x: noise(1), y: noise(1) } })),
    }))
    const same = tellApart(twins, ['x', 'y'])
    expect(same.overall).toBeGreaterThan(0.3)
    expect(same.overall).toBeLessThan(0.7)
  })

  it('wins: overall share and head-to-head', () => {
    const w = winRates(games)
    expect(w.overall).toEqual({ Bully: 0.4, Scholar: 0.6 })
    expect(w.headToHead.Bully.Scholar).toBe(0.4)
    expect(w.headToHead.Scholar.Bully).toBe(0.6)
  })

  it('skill ladder: the higher skill’s share of wins when one personality meets itself at two skills', () => {
    const ladder: GameResult[] = Array.from({ length: 20 }, (_, i) => ({ seats: [seat('Bully', i < 15 ? 1 : 0, 'high'), seat('Bully', i < 15 ? 0 : 1, 'low')] }))
    expect(skillLadder(ladder, ['low', 'high'])).toEqual({ Bully: 0.75 })
  })
})

describe('balanced-style targets', () => {
  it('nearAverage and neverExtreme', () => {
    const three: GameResult[] = Array.from({ length: 30 }, () => ({
      seats: [
        { personality: 'Hi', skill: 'mid', won: 1, meters: { a: 9, b: 1 } },
        { personality: 'Mid', skill: 'mid', won: 0.5, meters: { a: 5, b: 5 } },
        { personality: 'Lo', skill: 'mid', won: 0, meters: { a: 1, b: 9 } },
      ],
    }))
    const out = checkFeelTargets(three, {
      Mid: [{ meter: '*', op: 'neverExtreme', label: 'never extreme' }, { meter: 'a', op: 'nearAverage', value: 0.5, label: 'near average' }],
      Hi: [{ meter: '*', op: 'neverExtreme', label: 'never extreme' }, { meter: 'a', op: 'nearAverage', value: 0.5, label: 'near average' }],
    })
    expect(out.Mid.map((t) => t.pass)).toEqual([true, true])
    expect(out.Hi.map((t) => t.pass)).toEqual([false, false])
    expect(out.Hi[0].extremes).toEqual(['a', 'b'])
    // A personality that didn't play can't pass (it was never measured).
    expect(checkFeelTargets(three, { Absent: [{ meter: '*', op: 'neverExtreme', label: 'never extreme' }] }).Absent[0].pass).toBe(false)
  })
})

describe('rock-paper-scissors edges', () => {
  it("'beats' passes when its share of the wins against that rival reaches the value", () => {
    const out = checkFeelTargets(games, {
      Scholar: [{ meter: 'won', op: 'beats', against: 'Bully', value: 0.55, label: 'beats the Bully' }],
      Bully: [{ meter: 'won', op: 'beats', against: 'Scholar', value: 0.55, label: 'beats the Scholar' }],
    })
    expect([out.Scholar[0].pass, out.Scholar[0].measured]).toEqual([true, 0.6])
    expect([out.Bully[0].pass, out.Bully[0].measured]).toEqual([false, 0.4])
  })
})

describe('the report page', () => {
  it('is one self-contained page with every section', async () => {
    const { reportHtml } = await import('./report')
    const html = reportHtml({
      title: 'Personality Check',
      subtitle: '100 games',
      feel: checkFeelTargets(games, { Bully: [{ meter: 'tangles', op: '>=', value: 1, label: 'tangles <a lot>' }] }),
      all: [{ label: 'skill ladder holds', pass: true, detail: '75%' }],
      tell: tellApart(games, ['tangles', 'wordLength']),
      wins: winRates(games),
      ladder: {},
      notes: ['Bully rolled TRAP'],
    })
    expect(html).toMatch(/^<!doctype html>/)
    expect(html).toContain('tangles &lt;a lot&gt;')
    expect(html).not.toMatch(/<script|src=|href=/)
    for (const s of ['For all of them', 'feel like itself', 'tell them apart', 'win sometimes', 'How they think']) expect(html).toContain(s)
  })
})

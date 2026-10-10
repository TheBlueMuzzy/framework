import { describe, expect, it } from 'vitest'
import { believe, believedLead } from './beliefs'

describe('fuzzy beliefs', () => {
  it('watching every turn: exact and fully confident', () => {
    expect(believe([4, 0, 6, 3], 0.5, 9)).toEqual({ estimate: 13, confidence: 1 })
  })

  it('not watching: confidence decays and the estimate drifts away from what it saw', () => {
    const history = [5, ...Array(20).fill(null)]
    const b = believe(history, 0.5, 9)
    expect(b.confidence).toBeCloseTo(0.1, 5) // 1 → floor after 18 quiet turns
    const drifted = [1, 2, 3, 4, 5].map((k) => believe(history, 0.5, k).estimate)
    expect(drifted.some((e) => e !== 5)).toBe(true)
  })

  it('a less skilled bot drifts further', () => {
    const history = [10, ...Array(15).fill(null)]
    const spread = (noise: number) => {
      const es = Array.from({ length: 200 }, (_, k) => believe(history, noise, k + 1).estimate - 10)
      return Math.sqrt(es.reduce((s, e) => s + e * e, 0) / es.length)
    }
    expect(spread(1)).toBeGreaterThan(spread(0) * 1.8)
  })

  it('seeing something again halves the drift and lifts confidence', () => {
    const quiet = [5, ...Array(10).fill(null)]
    const before = believe(quiet, 1, 4)
    const after = believe([...quiet, 0], 1, 4)
    expect(after.confidence).toBeGreaterThan(before.confidence)
    expect(Math.abs(after.estimate - 5)).toBeLessThanOrEqual(Math.abs(before.estimate - 5) / 2 + 0.1)
  })

  it('same history + same key → same belief (a rejoin believes the same thing)', () => {
    const h = [3, null, null, 7, null]
    expect(believe(h, 0.4, 77)).toEqual(believe(h, 0.4, 77))
  })

  it('believed lead: my score minus the highest rival estimate', () => {
    expect(believedLead(20, [{ estimate: 12, confidence: 1 }, { estimate: 25.5, confidence: 0.3 }])).toBe(-5.5)
    expect(believedLead(20, [])).toBe(0)
  })
})

import { describe, expect, it } from 'vitest'
import { nudgeClock, nudgeUsedUp } from './nudge'

describe('nudge clock', () => {
  const o = { glowAt: 10, textAt: 20 }
  it('quiet → glow at glowAt → text at textAt', () => {
    expect(nudgeClock(0, o)).toEqual({ stage: 'none', next: 10 })
    expect(nudgeClock(12, o)).toEqual({ stage: 'glow', next: 8 })
    expect(nudgeClock(20, o)).toEqual({ stage: 'text', next: null })
  })
  it('no glow stage: straight to the words', () => {
    expect(nudgeClock(5, { glowAt: null, textAt: 30 })).toEqual({ stage: 'none', next: 25 })
    expect(nudgeClock(31, { glowAt: null, textAt: 30 }).stage).toBe('text')
  })
  it('a kind is used up after `repeat` showings', () => {
    const counts = new Map([['move', 3]])
    expect(nudgeUsedUp(counts, 'move', 3)).toBe(true)
    expect(nudgeUsedUp(counts, 'plant', 3)).toBe(false)
  })
})

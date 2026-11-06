import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { nudgeClock, nudgeUsedUp, useNudge, type NudgeOptions } from './nudge'

afterEach(() => { vi.useRealTimers() })

// 0.43.1 (F201): the starter's tutorial — after its words had shown once, Replay tutorial came back to the same kind
// and running, and the OLD spell's 'text' showed at once: a pause (running false) must start a new spell at 'none'
describe('useNudge', () => {
  it('a pause ends the spell: running again starts from none, even with the same kind', () => {
    vi.useFakeTimers()
    const base = { kind: 'move', glowAt: null, textAt: 2, repeat: 3 }
    const { result, rerender } = renderHook((o: NudgeOptions) => useNudge(o), { initialProps: { ...base, running: true } })
    act(() => { vi.advanceTimersByTime(2100) })
    expect(result.current.stage).toBe('text')
    rerender({ ...base, running: false })
    expect(result.current.stage).toBe('none')
    rerender({ ...base, running: true })
    expect(result.current.stage).toBe('none')
    act(() => { vi.advanceTimersByTime(2100) })
    expect(result.current.stage).toBe('text')
  })
})

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

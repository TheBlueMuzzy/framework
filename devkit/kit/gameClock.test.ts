// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clockPause, looksClock, rulesClock, rulesClockInUse, setClockPause } from './gameClock'

const fake = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'] })

afterEach(() => {
  setClockPause(null)
  rulesClock.scale = 1
  vi.useRealTimers()
})

describe('gameClock — the rules clock and the looks clock', () => {
  it('both run at normal speed with nothing paused', () => {
    fake()
    const r0 = rulesClock.now(), l0 = looksClock.now()
    vi.advanceTimersByTime(500)
    expect(rulesClock.now() - r0).toBeCloseTo(500, 0)
    expect(looksClock.now() - l0).toBeCloseTo(500, 0)
    expect(rulesClock.rate).toBe(1)
    expect(rulesClockInUse()).toBe(true)
  })
  it('half pause stops the rules clock and its timers; the looks clock runs on', () => {
    fake()
    const fired = vi.fn()
    rulesClock.after(300, fired)
    const r0 = rulesClock.now(), l0 = looksClock.now()
    setClockPause('half')
    expect(clockPause()).toBe('half')
    expect(rulesClock.rate).toBe(0)
    vi.advanceTimersByTime(1000)
    expect(fired).not.toHaveBeenCalled()
    expect(rulesClock.now() - r0).toBeCloseTo(0, 0)
    expect(looksClock.now() - l0).toBeCloseTo(1000, 0)
    setClockPause(null)
    vi.advanceTimersByTime(299)
    expect(fired).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2)
    expect(fired).toHaveBeenCalledTimes(1)
  })
  it('full pause stops both clocks, and their timers wait', () => {
    fake()
    const look = vi.fn()
    looksClock.after(100, look)
    const l0 = looksClock.now()
    setClockPause('full')
    vi.advanceTimersByTime(1000)
    expect(look).not.toHaveBeenCalled()
    expect(looksClock.now() - l0).toBeCloseTo(0, 0)
    setClockPause(null)
    vi.advanceTimersByTime(101)
    expect(look).toHaveBeenCalledTimes(1)
  })
  it("the game's own scale slows the rules clock (and 0 stops it); the Dev Kit's pause wins over it", () => {
    fake()
    rulesClock.scale = 0.25
    const fired = vi.fn()
    rulesClock.after(100, fired)
    vi.advanceTimersByTime(399)
    expect(fired).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2)
    expect(fired).toHaveBeenCalledTimes(1)
    setClockPause('half')
    expect(rulesClock.rate).toBe(0)
    expect(rulesClock.scale).toBe(0.25) // the Dev Kit never changes the game's own scale
  })
  it('every() repeats on rules time; cancel stops it', () => {
    fake()
    const tick = vi.fn()
    const stop = rulesClock.every(100, tick)
    vi.advanceTimersByTime(350)
    expect(tick).toHaveBeenCalledTimes(3)
    stop()
    vi.advanceTimersByTime(500)
    expect(tick).toHaveBeenCalledTimes(3)
  })
})

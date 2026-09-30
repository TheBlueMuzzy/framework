import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Timers } from './timers'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('timers table', () => {
  it('runs a timer once, then forgets it', () => {
    const timers = new Timers()
    const done = vi.fn()
    timers.start('turn', 1000, done)
    expect(timers.isRunning('turn')).toBe(true)
    vi.advanceTimersByTime(999)
    expect(done).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(done).toHaveBeenCalledOnce()
    expect(timers.isRunning('turn')).toBe(false)
  })

  it('starting a name that is running replaces it (never two of one kind)', () => {
    const timers = new Timers()
    const first = vi.fn()
    const second = vi.fn()
    timers.start('turn', 1000, first)
    vi.advanceTimersByTime(500)
    timers.start('turn', 1000, second)
    vi.advanceTimersByTime(1000)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
  })

  it('says how long is left', () => {
    const timers = new Timers()
    timers.start('turn', 30_000, () => {})
    vi.advanceTimersByTime(10_000)
    expect(timers.msLeft('turn')).toBe(20_000)
    expect(timers.msLeft('nothing')).toBe(0)
  })

  it('stop, and stopAll with or without a name prefix', () => {
    const timers = new Timers()
    const fired = vi.fn()
    timers.start('turn', 10, fired)
    timers.start('room:empty', 10, fired)
    timers.start('room:bot', 10, fired)
    timers.stop('turn')
    timers.stopAll('room:')
    expect(timers.names()).toEqual([])
    timers.start('a', 10, fired)
    timers.start('b', 10, fired)
    timers.stopAll()
    vi.advanceTimersByTime(100)
    expect(fired).not.toHaveBeenCalled()
  })

  it('a timer that crashes is logged, not thrown into the room', () => {
    const log = vi.fn()
    const timers = new Timers(log)
    timers.start('turn', 10, () => { throw new Error('oops') })
    expect(() => vi.advanceTimersByTime(10)).not.toThrow()
    expect(log).toHaveBeenCalledWith('timer "turn" failed: oops')
  })
})

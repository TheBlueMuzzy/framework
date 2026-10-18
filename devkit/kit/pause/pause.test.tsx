import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { registerDevKitGame, type DevKitGame } from '../devkitGame'
import { clockPause, rulesClock } from '../gameClock'
import { sendTuning } from '../tuning/liveTuning'
import { devkitRaf, installFreeze, isFrozen } from './freeze'
import { cyclePause, setDevPause } from './pause'
import { PauseBadgeClosed, PauseButtons } from './PauseButtons'

const nextFrame = () => new Promise<void>((done) => devkitRaf(() => done()))

const game = (extra: Partial<DevKitGame> = {}): DevKitGame => ({
  name: 'Test', version: '1', getState: () => ({}), setState: () => {}, canRestore: () => true, ...extra,
})

beforeAll(() => installFreeze())
afterEach(() => {
  act(() => setDevPause(null))
  registerDevKitGame(null)
  cleanup()
  vi.restoreAllMocks()
})

describe('Full pause — the generic freeze', () => {
  it('holds the page\'s animation frames and releases them on resume', async () => {
    const frames = vi.fn()
    const loop = () => { frames(); requestAnimationFrame(loop) }
    requestAnimationFrame(loop)
    await nextFrame(); await nextFrame()
    expect(frames).toHaveBeenCalled()
    setDevPause('full')
    expect(isFrozen()).toBe(true)
    const count = frames.mock.calls.length
    await nextFrame(); await nextFrame(); await nextFrame()
    expect(frames.mock.calls.length).toBeLessThanOrEqual(count + 1) // (one already on its way may have been re-held)
    const held = frames.mock.calls.length
    await nextFrame(); await nextFrame()
    expect(frames.mock.calls.length).toBe(held)
    setDevPause(null)
    await nextFrame(); await nextFrame()
    expect(frames.mock.calls.length).toBeGreaterThan(held)
  })
  it('a cancelled frame stays cancelled while frozen', async () => {
    setDevPause('full')
    const cb = vi.fn()
    const id = requestAnimationFrame(cb)
    cancelAnimationFrame(id)
    setDevPause(null)
    await nextFrame(); await nextFrame()
    expect(cb).not.toHaveBeenCalled()
  })
  it('pauses the game\'s CSS / Web animations but not the Dev Kit\'s, and plays them again', () => {
    const gameEl = document.createElement('div')
    const kitEl = document.createElement('div')
    kitEl.className = 'devkit'
    document.body.append(gameEl, kitEl)
    const anim = (target: Element) => ({ playState: 'running', effect: { target }, pause: vi.fn(function (this: { playState: string }) { this.playState = 'paused' }), play: vi.fn() })
    const a = anim(gameEl), b = anim(kitEl)
    ;(document as unknown as { getAnimations: () => unknown[] }).getAnimations = () => [a, b]
    setDevPause('full')
    expect(a.pause).toHaveBeenCalled()
    expect(b.pause).not.toHaveBeenCalled()
    setDevPause(null)
    expect(a.play).toHaveBeenCalled()
  })
  it('a live edit while frozen draws ONE frame, with no time passing', async () => {
    const times: number[] = []
    const loop = (t: number) => { times.push(t); requestAnimationFrame(loop) }
    requestAnimationFrame(loop)
    await nextFrame(); await nextFrame()
    setDevPause('full')
    await nextFrame(); await nextFrame()
    const before = times.length
    const lastTime = times[times.length - 1]
    sendTuning('tank', { speed: 2 })
    await Promise.resolve(); await Promise.resolve()
    expect(times.length).toBe(before + 1)
    expect(times[times.length - 1]).toBe(lastTime)
  })
})

describe('the adapter and the clocks', () => {
  it('calls the game\'s pause() with each mode and stops the rules clock for both', () => {
    const pause = vi.fn()
    registerDevKitGame(game({ pause, pauseModes: ['full', 'half'] }))
    setDevPause('half')
    expect(pause).toHaveBeenLastCalledWith('half')
    expect(rulesClock.rate).toBe(0)
    expect(isFrozen()).toBe(false) // half pause: the looks keep running
    setDevPause('full')
    expect(pause).toHaveBeenLastCalledWith('full')
    expect(isFrozen()).toBe(true)
    setDevPause(null)
    expect(pause).toHaveBeenLastCalledWith(null)
    expect(rulesClock.rate).toBe(1)
  })
  it('an online game (canPause / canRestore false) can\'t be paused', () => {
    registerDevKitGame(game({ canRestore: () => false }))
    setDevPause('full')
    expect(clockPause()).toBe(null)
    registerDevKitGame(game({ canRestore: () => false, canPause: () => true }))
    setDevPause('full')
    expect(clockPause()).toBe('full')
  })
  it('P cycles off → full → half → off (half only when the game can)', () => {
    registerDevKitGame(game({ pauseModes: ['full', 'half'] }))
    cyclePause(); expect(clockPause()).toBe('full')
    cyclePause(); expect(clockPause()).toBe('half')
    cyclePause(); expect(clockPause()).toBe(null)
  })
})

describe('the buttons and badges', () => {
  it('shows ⏸ and ◐ for a game that can half-pause; pressing the lit one resumes', () => {
    registerDevKitGame(game({ pauseModes: ['full', 'half'] }))
    render(<PauseButtons />)
    fireEvent.click(screen.getByRole('button', { name: 'Half pause' }))
    expect(clockPause()).toBe('half')
    fireEvent.click(screen.getByRole('button', { name: 'Full pause' })) // the other button switches
    expect(clockPause()).toBe('full')
    fireEvent.click(screen.getByRole('button', { name: /Resume/ }))
    expect(clockPause()).toBe(null)
  })
  it('greys both out with the reason in an online game', () => {
    registerDevKitGame(game({ canRestore: () => false, pauseModes: ['full', 'half'] }))
    render(<PauseButtons />)
    const full = screen.getByRole('button', { name: 'Full pause' })
    expect(full.getAttribute('aria-disabled')).toBe('true')
    expect(full.title).toMatch(/online game/)
    fireEvent.click(full)
    expect(clockPause()).toBe(null)
  })
  it('with the panel closed, a badge stays while paused; tapping it resumes', () => {
    render(<PauseBadgeClosed panelOpen={false} />)
    expect(screen.queryByRole('button', { name: /tap to resume/ })).toBeNull()
    act(() => setDevPause('full'))
    fireEvent.click(document.querySelector('.devkit-pause-badge[data-mode="full"]')!) // (jsdom has no popovers: it counts as hidden)
    expect(clockPause()).toBe(null)
  })
})

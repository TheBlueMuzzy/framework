// Runs in the framework (not copied into games): the adapter registry.
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { describeMoment, getDevKitGame, registerDevKitGame, useDevKitGame, type DevKitGame } from './devkitGame'

const fakeGame = (name: string, extra: Partial<DevKitGame> = {}): DevKitGame => ({
  name,
  version: '1.2.3',
  getState: () => ({ turn: 1 }),
  setState: () => {},
  canRestore: () => true,
  ...extra,
})

afterEach(() => registerDevKitGame(null))

describe('registerDevKitGame', () => {
  it('starts with no game; register makes it the game; again replaces it; null unplugs it', () => {
    expect(getDevKitGame()).toBeNull()
    const a = fakeGame('A')
    registerDevKitGame(a)
    expect(getDevKitGame()).toBe(a)
    const b = fakeGame('B')
    registerDevKitGame(b)
    expect(getDevKitGame()).toBe(b)
    registerDevKitGame(null)
    expect(getDevKitGame()).toBeNull()
  })

  it('useDevKitGame re-renders when a game registers after the Dev Kit is showing', () => {
    const { result } = renderHook(() => useDevKitGame())
    expect(result.current).toBeNull()
    act(() => registerDevKitGame(fakeGame('Late')))
    expect(result.current?.name).toBe('Late')
  })
})

describe('describeMoment', () => {
  it("uses the game's describe(), or nothing — and never throws", () => {
    expect(describeMoment(fakeGame('A'), {})).toBe('')
    expect(describeMoment(fakeGame('A', { describe: (s) => `turn ${(s as { turn: number }).turn}` }), { turn: 4 })).toBe('turn 4')
    const broken = fakeGame('A', { describe: () => { throw new Error('boom') } })
    expect(describeMoment(broken, {})).toBe('')
  })
})

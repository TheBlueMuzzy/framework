// Flow logic: the countdown's timing, and results sorting with shared places.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { Countdown, rankPlayers } from './flow'

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('Countdown', () => {
  it('shows 3, 2, 1, Go! a second apart, then calls onDone once', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<Countdown onDone={onDone} />)
    const shown = () => screen.getByRole('timer').textContent
    const aSecondLater = () => act(() => { vi.advanceTimersByTime(1000) })
    expect(shown()).toBe('3')
    aSecondLater()
    expect(shown()).toBe('2')
    aSecondLater()
    aSecondLater()
    expect(shown()).toBe('Go!')
    expect(onDone).not.toHaveBeenCalled()
    aSecondLater()
    aSecondLater()
    expect(onDone).toHaveBeenCalledOnce()
  })
})

describe('rankPlayers', () => {
  const players = [
    { id: 'a', name: 'Ada', score: 12 }, { id: 'b', name: 'Bo', score: 30 },
    { id: 'c', name: 'Cy', score: 30 }, { id: 'd', name: 'Di', score: 5 },
  ]
  it('puts the best score first, and equal scores share a place', () => {
    expect(rankPlayers(players).map((p) => `${p.place} ${p.name}`)).toEqual(['1 Bo', '1 Cy', '3 Ada', '4 Di'])
  })
  it('lowestWins flips it (golf-style)', () => {
    expect(rankPlayers(players, true).map((p) => `${p.place} ${p.name}`)).toEqual(['1 Di', '2 Ada', '3 Bo', '3 Cy'])
  })
})

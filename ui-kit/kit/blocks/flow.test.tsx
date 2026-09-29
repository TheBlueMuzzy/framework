// Flow logic: the countdown's timing, and results sorting with shared places.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Countdown, rankPlayers, Results } from './flow'

afterEach(() => { cleanup(); vi.useRealTimers(); document.documentElement.removeAttribute('data-reduce-motion') })

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

describe('rankPlayers with colours', () => {
  it('keeps each player’s colour (and anything else) through the ranking', () => {
    const ranked = rankPlayers([
      { id: 'a', name: 'Ada', score: 3, color: '#e8553d' }, { id: 'b', name: 'Bo', score: 9, color: '#2f8fd8' },
    ])
    expect(ranked.map((p) => `${p.place} ${p.name} ${p.color}`)).toEqual(['1 Bo #2f8fd8', '2 Ada #e8553d'])
  })
})

describe('Results', () => {
  const players = [{ id: 'a', name: 'Ada', score: 12 }, { id: 'b', name: 'Bo', score: 30 }, { id: 'c', name: 'Cy', score: 5 }]
  const delays = (container: HTMLElement) =>
    [...container.querySelectorAll<HTMLElement>('.kit-result-row')].map((row) => row.style.getPropertyValue('--kit-i'))

  it('dim: dims the game behind it like a dialog; off by default', () => {
    const { container, rerender } = render(<Results players={players} />)
    expect(container.querySelector('.kit-screen')?.hasAttribute('data-dialog')).toBe(false)
    rerender(<Results players={players} dim />)
    expect(container.querySelector('.kit-screen')?.hasAttribute('data-dialog')).toBe(true)
  })

  it('rows arrive one after another', () => {
    const { container } = render(<Results players={players} />)
    expect(delays(container)).toEqual(['0', '1', '2'])
  })
  it('with reduce motion on, every row arrives at once', () => {
    document.documentElement.setAttribute('data-reduce-motion', '')
    const { container } = render(<Results players={players} />)
    expect(delays(container)).toEqual(['0', '0', '0'])
  })
  it('shows the title, message, a winner badge on 1st only, and its buttons', () => {
    const onRematch = vi.fn(), onQuit = vi.fn()
    render(<Results players={players} title="Bo wins!" message="By 18 points" onRematch={onRematch} onQuit={onQuit} />)
    expect(screen.getByText('Bo wins!')).toBeTruthy()
    expect(screen.getByText('By 18 points')).toBeTruthy()
    expect(screen.getAllByLabelText('Winner')).toHaveLength(1)
    fireEvent.click(screen.getByText('Rematch'))
    fireEvent.click(screen.getByText('Quit'))
    expect(onRematch).toHaveBeenCalledOnce()
    expect(onQuit).toHaveBeenCalledOnce()
  })
  it('old use still works: the default title, no buttons', () => {
    const { container } = render(<Results players={players} />)
    expect(screen.getByText('Results')).toBeTruthy()
    expect(container.querySelector('button')).toBeNull()
  })
})

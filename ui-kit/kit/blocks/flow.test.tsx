// Flow logic: the countdown's timing, results sorting with shared places, and the stats rows' reveal (0.31.0).
// The reveal's real look (rows unseen then seen in order, the card's size never changing) is in statListLook.test.tsx.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Countdown, GameOver, rankPlayers, Results, StatList, Victory } from './flow'

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

// REVEAL (0.31.0, Goops' payslip): the stats rows arrive one after another with the Results rows' entrance.
describe('StatList reveal', () => {
  const stats = [
    { label: 'Wage', value: '$120' }, { label: 'Rent', value: '−$40', tone: 'danger' as const },
    { label: 'Debt', value: '$300', tone: 'danger' as const }, { label: 'Net pay', value: '$80', tone: 'success' as const },
  ]
  const rows = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('.kit-stat-row')]
  const last = (container: HTMLElement) => rows(container).at(-1)!

  it('rows wait one after another, in order: row i waits i × reveal ms (the Results stagger, a game-set step)', () => {
    const { container } = render(<StatList stats={stats} reveal={350} />)
    expect(rows(container).map((r) => r.hasAttribute('data-reveal'))).toEqual([true, true, true, true])
    expect(rows(container).map((r) => r.style.getPropertyValue('--kit-i'))).toEqual(['0', '1', '2', '3'])
    expect(rows(container).map((r) => r.style.getPropertyValue('--kit-step'))).toEqual(['350ms', '350ms', '350ms', '350ms'])
    expect(rows(container).map((r) => r.textContent)).toEqual(['Wage$120', 'Rent▼−$40', 'Debt▼$300', 'Net pay▲$80'])
  })

  it('onRevealed fires once, when the last row is in — not for an earlier row, nor a part inside a row', () => {
    const onRevealed = vi.fn()
    const { container } = render(<StatList stats={stats} reveal={350} onRevealed={onRevealed} />)
    expect(onRevealed).not.toHaveBeenCalled()
    fireEvent.animationEnd(rows(container)[0])
    fireEvent.animationEnd(rows(container)[2])
    fireEvent.animationEnd(last(container).querySelector('.kit-badge')!) // bubbles up from inside the row
    expect(onRevealed).not.toHaveBeenCalled()
    fireEvent.animationEnd(last(container))
    fireEvent.animationEnd(last(container))
    expect(onRevealed).toHaveBeenCalledOnce()
  })

  it('the latest onRevealed is the one called (a re-render does not restart the reveal)', () => {
    const first = vi.fn(), second = vi.fn()
    const { container, rerender } = render(<StatList stats={stats} reveal={350} onRevealed={first} />)
    rerender(<StatList stats={stats} reveal={350} onRevealed={second} />)
    fireEvent.animationEnd(last(container))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
  })

  it('new stats mid-reveal (review fix): it waits for the NEW last row — not the old one, nor a removed one', () => {
    const onRevealed = vi.fn()
    const { container, rerender } = render(<StatList stats={stats.slice(0, 3)} reveal={350} onRevealed={onRevealed} />)
    const oldLast = last(container)
    rerender(<StatList stats={stats} reveal={350} onRevealed={onRevealed} />) // a row added at the end (0.32.0: a new reveal)
    fireEvent.animationEnd(oldLast)
    expect(onRevealed).not.toHaveBeenCalled() // no longer the last row
    rerender(<StatList stats={[...stats.slice(0, 3), { label: 'Take home', value: '$80' }]} reveal={350} onRevealed={onRevealed} />) // last row swapped
    fireEvent.animationEnd(last(container))
    expect(onRevealed).toHaveBeenCalledOnce()
  })

  it('a last row that has nothing left to play (a style with no entrance, or a cancelled one) does not hold it forever', () => {
    const onRevealed = vi.fn()
    const proto = HTMLElement.prototype as { getAnimations?: () => Animation[] }
    proto.getAnimations = () => [] // (jsdom has no animations: say the style plays none)
    try {
      render(<StatList stats={stats} reveal={350} onRevealed={onRevealed} />)
      expect(onRevealed).toHaveBeenCalledOnce()
    } finally { delete proto.getAnimations }
    cleanup()

    const cancelled = vi.fn()
    const again = render(<StatList stats={stats} reveal={350} onRevealed={cancelled} />)
    fireEvent(last(again.container), new Event('animationcancel'))
    expect(cancelled).toHaveBeenCalledOnce()
  })

  it('reduce motion: every row is there at once, and onRevealed fires once straight away', () => {
    document.documentElement.setAttribute('data-reduce-motion', '')
    const onRevealed = vi.fn()
    const { container, rerender } = render(<StatList stats={stats} reveal={350} onRevealed={onRevealed} />)
    expect(rows(container).some((r) => r.hasAttribute('data-reveal') || r.style.length > 0)).toBe(false)
    expect(onRevealed).toHaveBeenCalledOnce()
    rerender(<StatList stats={stats} reveal={350} onRevealed={onRevealed} />)
    expect(onRevealed).toHaveBeenCalledOnce()
  })

  it('no rows: nothing drawn, onRevealed fires once straight away', () => {
    const onRevealed = vi.fn()
    const { container } = render(<StatList stats={[]} reveal={350} onRevealed={onRevealed} />)
    expect(container.querySelector('.kit-stats')).toBeNull()
    expect(onRevealed).toHaveBeenCalledOnce()
  })

  it('no reveal = today: plain rows, no waiting, no style; onRevealed (if given) fires at once', () => {
    const onRevealed = vi.fn()
    const { container } = render(<StatList stats={stats.slice(0, 1)} onRevealed={onRevealed} />)
    expect(rows(container)[0].hasAttribute('data-reveal')).toBe(false)
    expect(rows(container)[0].getAttribute('style')).toBeNull()
    expect(container.querySelector('.kit-listrow')?.textContent).toBe('Wage$120')
    expect(onRevealed).toHaveBeenCalledOnce()
  })

  it('tone: a ▼ / ▲ tag in the danger / success Badge, read out in words — never colour alone; no tone, no tag', () => {
    const { container } = render(<StatList stats={stats} words={{ danger: 'Deducted' }} />)
    expect(rows(container).map((r) => r.dataset.tone ?? '')).toEqual(['', 'danger', 'danger', 'success'])
    expect(rows(container).map((r) => r.querySelector('.kit-badge')?.getAttribute('data-variant') ?? '')).toEqual(['', 'danger', 'danger', 'success'])
    expect(screen.getAllByLabelText('Deducted')).toHaveLength(2)
    expect(screen.getAllByLabelText('Gain')).toHaveLength(1)
  })
})

describe('Victory / GameOver reveal', () => {
  const stats = [{ label: 'Points', value: 212 }, { label: 'Time', value: '6:42' }]
  it('Victory passes reveal + onRevealed to its StatList', () => {
    const onRevealed = vi.fn()
    const { container } = render(<Victory stats={stats} reveal={200} onRevealed={onRevealed} onContinue={() => {}} />)
    const rows = [...container.querySelectorAll<HTMLElement>('.kit-end-info .kit-stat-row')]
    expect(rows.map((r) => r.style.getPropertyValue('--kit-i'))).toEqual(['0', '1'])
    fireEvent.animationEnd(rows[1])
    expect(onRevealed).toHaveBeenCalledOnce()
  })
  it('GameOver too; and without reveal its rows are plain (old use unchanged)', () => {
    const onRevealed = vi.fn()
    const { container, rerender } = render(<GameOver stats={stats} reveal={200} onRevealed={onRevealed} />)
    expect(container.querySelectorAll('.kit-stat-row[data-reveal]')).toHaveLength(2)
    rerender(<GameOver stats={stats} />)
    expect(container.querySelectorAll('.kit-stat-row[data-reveal]')).toHaveLength(0)
    expect([...container.querySelectorAll('.kit-listrow')].map((r) => r.textContent)).toEqual(['Points212', 'Time6:42'])
  })
})

// LONG LISTS (0.31.0, Goops' payslip: 692 px of rows in a 605 px frame): the stats scroll in their own ScrollArea —
// the title, message and buttons are outside it, so they stay put. The real layout (buttons in sight at a phone's
// size, a short list's card unchanged) is in statListLook.test.tsx; here, what's where and the follow-the-reveal rules.
describe('Victory / GameOver: the stats scroll, nothing else does', () => {
  const stats = [{ label: 'Points', value: 212 }, { label: 'Time', value: '6:42' }, { label: 'Fines', value: '−$40', tone: 'danger' as const }]
  it('the rows sit in a ScrollArea named after the title; the title, message and buttons are outside it', () => {
    const { container } = render(<Victory message="Shift over." stats={stats} onContinue={() => {}} onQuit={() => {}} />)
    const box = container.querySelector<HTMLElement>('.kit-end-info .kit-scroll')! // (Results' pattern: named like its screen)
    expect(box.getAttribute('aria-label')).toBe('Victory!')
    expect(box.querySelectorAll('.kit-stat-row')).toHaveLength(3)
    for (const text of ['Victory!', 'Shift over.', 'Continue', 'Quit']) expect(box.contains(screen.getByText(text))).toBe(false)
    expect(container.querySelectorAll('.kit-scroll')).toHaveLength(1)
  })
  it('GameOver the same; no stats = no scroll box (and onRevealed still fires at once)', () => {
    const onRevealed = vi.fn()
    const { container, rerender } = render(<GameOver stats={stats} onRetry={() => {}} />)
    const box = container.querySelector('.kit-end-info .kit-scroll')!
    expect([box.getAttribute('aria-label'), box.querySelectorAll('.kit-stat-row').length]).toEqual(['Game over', 3])
    rerender(<GameOver onRetry={() => {}} reveal={200} onRevealed={onRevealed} />)
    expect(container.querySelector('.kit-scroll')).toBeNull()
    expect(onRevealed).toHaveBeenCalledOnce()
  })
})

describe('the reveal follows the newest row in its ScrollArea', () => {
  const stats = Array.from({ length: 6 }, (_, i) => ({ label: `Row ${i + 1}`, value: i }))
  // jsdom has no layout: give the box a 100 px window and each row 50 px, row i at i × 50 px
  const setUp = (props: { reveal?: number } = { reveal: 200 }) => {
    const view = render(<Victory stats={stats} onContinue={() => {}} {...props} />)
    const box = view.container.querySelector<HTMLElement>('.kit-scroll')!
    const rows = [...view.container.querySelectorAll<HTMLElement>('.kit-stat-row')]
    Object.defineProperty(box, 'clientHeight', { value: 100 })
    rows.forEach((row, i) => {
      Object.defineProperty(row, 'offsetTop', { value: i * 50 })
      Object.defineProperty(row, 'offsetHeight', { value: 50 })
    })
    const list = view.container.querySelector<HTMLElement>('.kit-stats')!
    list.getBoundingClientRect = () => ({ top: -box.scrollTop }) as DOMRect // the list moves up as the box scrolls
    const scrollTo = vi.fn((to: ScrollToOptions) => { box.scrollTop = to.top ?? 0 })
    box.scrollTo = scrollTo as unknown as typeof box.scrollTo
    return { box, rows, scrollTo }
  }

  it('as a row starts its entrance below the window, the box scrolls (smoothly) to bring it into view', () => {
    const { rows, scrollTo } = setUp()
    fireEvent.animationStart(rows[0]) // in view already: no scroll
    fireEvent.animationStart(rows[1])
    expect(scrollTo).not.toHaveBeenCalled()
    fireEvent.animationStart(rows[2]) // bottom at 150 px in a 100 px window → scroll to 50
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 50, behavior: 'smooth' })
    fireEvent.animationStart(rows[4])
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 150, behavior: 'smooth' })
  })

  it('only a row\'s own entrance counts, not a part animating inside it', () => {
    const { rows, scrollTo } = setUp()
    rows[5].querySelector('.kit-listrow')!.dispatchEvent(new Event('animationstart', { bubbles: true }))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it.each(['wheel', 'touchstart', 'pointerdown', 'keydown'])('a player who scrolls it themselves (%s) takes over: it stops following', (intent) => {
    const { box, rows, scrollTo } = setUp()
    fireEvent.animationStart(rows[2])
    expect(scrollTo).toHaveBeenCalledOnce()
    box.dispatchEvent(new Event(intent, { bubbles: true }))
    fireEvent.animationStart(rows[3])
    fireEvent.animationStart(rows[5])
    expect(scrollTo).toHaveBeenCalledOnce()
  })

  it('no reveal (or reduce motion): nothing to follow — the scroll is left alone', () => {
    const { rows, scrollTo } = setUp({})
    fireEvent.animationStart(rows[5])
    expect(scrollTo).not.toHaveBeenCalled()
  })
})

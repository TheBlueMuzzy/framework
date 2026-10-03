// The Carousel's clock: moves on by itself, a tap moves on AND holds it for pauseSeconds, then it carries on.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Carousel } from '.'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.useRealTimers() })

const shown = () => document.querySelector('.kit-carousel-item[data-current]')?.textContent
const wait = (seconds: number) => act(() => { vi.advanceTimersByTime(seconds * 1000) })
const three = (props: Partial<Parameters<typeof Carousel>[0]> = {}) =>
  render(<Carousel label="Highlights" autoSeconds={4} pauseSeconds={3} {...props}><b>One</b><b>Two</b><b>Three</b></Carousel>)

describe('Carousel', () => {
  it('shows one item, and moves on by itself every autoSeconds (wrapping round)', () => {
    three()
    expect(shown()).toBe('One')
    wait(3.9)
    expect(shown()).toBe('One')
    wait(0.1)
    expect(shown()).toBe('Two')
    wait(4)
    wait(4)
    expect(shown()).toBe('One') // round again
  })

  it('a tap on the item moves on and holds the auto-advance for pauseSeconds, then it carries on', () => {
    three()
    wait(2)
    const view = document.querySelector('.kit-carousel-view')!
    fireEvent.pointerDown(view, { clientX: 100, clientY: 10 })
    fireEvent.pointerUp(view, { clientX: 101, clientY: 10 })
    expect(shown()).toBe('Two')
    wait(6.9) // 3 s held + the usual 4 s
    expect(shown()).toBe('Two')
    wait(0.1)
    expect(shown()).toBe('Three')
    wait(4) // and back to the usual pace
    expect(shown()).toBe('One')
  })

  it('◀ ▶, ← → and a sideways swipe go either way (and also hold it)', () => {
    three()
    fireEvent.click(screen.getByLabelText('Previous highlights'))
    expect(shown()).toBe('Three')
    fireEvent.click(screen.getByLabelText('Next highlights'))
    expect(shown()).toBe('One')
    fireEvent.keyDown(screen.getByRole('region', { name: 'Highlights' }), { key: 'ArrowRight' })
    expect(shown()).toBe('Two')
    const view = document.querySelector('.kit-carousel-view')!
    fireEvent.pointerDown(view, { clientX: 200, clientY: 10 })
    fireEvent.pointerUp(view, { clientX: 120, clientY: 15 }) // swipe left → next
    expect(shown()).toBe('Three')
    wait(6.9)
    expect(shown()).toBe('Three')
  })

  it('a swipe on it never reaches the page it sits on (that may turn pages on a swipe)', () => {
    const page = vi.fn()
    render(<div onPointerUp={page}><Carousel label="Tips"><b>A</b><b>B</b></Carousel></div>)
    const view = document.querySelector('.kit-carousel-view')!
    fireEvent.pointerDown(view, { clientX: 200, clientY: 10 })
    fireEvent.pointerUp(view, { clientX: 100, clientY: 10 })
    expect(page).not.toHaveBeenCalled()
  })

  it('page dots show where you are; off-screen items are hidden from screen readers', () => {
    three()
    expect(document.querySelectorAll('.kit-carousel-dot')).toHaveLength(3)
    expect(document.querySelector('.kit-carousel-dot[data-state="on"]')).toBe(document.querySelectorAll('.kit-carousel-dot')[0])
    expect(document.querySelectorAll('.kit-carousel-item[aria-hidden="true"]')).toHaveLength(2)
  })

  it('one item: no arrows, no dots, no moving; none: nothing at all', () => {
    render(<Carousel label="Highlights"><b>Only</b></Carousel>)
    expect(screen.queryByLabelText('Next highlights')).toBeNull()
    expect(document.querySelectorAll('.kit-carousel-dot')).toHaveLength(0)
    wait(10)
    expect(shown()).toBe('Only')
    cleanup()
    const { container } = render(<Carousel label="Highlights">{[]}</Carousel>)
    expect(container.innerHTML).toBe('')
  })

  it('index / onIndexChange: says which item shows (to mark it elsewhere), and can be set', () => {
    const changed = vi.fn()
    const { rerender } = three({ index: 1, onIndexChange: changed })
    expect(shown()).toBe('Two')
    wait(4)
    expect(changed).toHaveBeenLastCalledWith(2)
    rerender(<Carousel label="Highlights" index={2} onIndexChange={changed}><b>One</b><b>Two</b><b>Three</b></Carousel>)
    expect(shown()).toBe('Three')
  })
})

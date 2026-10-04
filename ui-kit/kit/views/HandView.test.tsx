// HandView: draws N places with the game's attributes, empty places with renderEmpty, the states, and the
// shrink → grow stages (staggered animations, skipped with reduce motion).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { HandView, type HandPlace } from './HandView'
import { rackLayout } from './rackLayout'

afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute('data-reduce-motion')
  delete (Element.prototype as { animate?: unknown }).animate // (jsdom has no Web Animations; one test lends it a stand-in)
})

// 4 places of 50 px with 10 px gaps, in one row: 230 px wide
const layout = rackLayout({ room: 1000, tileWanted: 50, places: 4, tileMin: 44, gap: 10 })
const empty = () => <rect className="slot" />
const art = (place: HandPlace<string>) => <circle className="art" data-letter={place.piece} />
// a, b, an empty place (GAP), d
const rack: HandPlace<string>[] = [
  { key: 'a', piece: 'A', attrs: { 'data-tray-pos': 0, 'data-hand': 'a' } },
  { key: 'b', piece: 'B', attrs: { 'data-tray-pos': 1, 'data-hand': 'b' } },
  { key: 'empty-2', attrs: { 'data-tray-pos': 2 } },
  { key: 'd', piece: 'D', attrs: { 'data-tray-pos': 3, 'data-hand': 'd' } },
]
const draw = (props: Partial<Parameters<typeof HandView<string>>[0]> = {}) =>
  render(<HandView layout={layout} boxWidth={230} places={rack} renderEmpty={empty} renderPiece={art} className="game-tray" label="Seeds" {...props} />)
const places = (container: HTMLElement) => [...container.querySelectorAll('svg > g')]

describe('HandView (rack)', () => {
  it('draws one group per place with the game’s attributes, and keeps the game’s class on the svg', () => {
    const { container } = draw()
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('class')).toBe('kit-hand game-tray')
    expect(svg.getAttribute('aria-label')).toBe('Seeds')
    // 230 wide; 50 tall + a tenth of a place of headroom above
    expect(svg.getAttribute('width')).toBe('230')
    expect(svg.getAttribute('viewBox')).toBe('0 -5 230 55')
    expect(places(container).map((g) => g.getAttribute('data-tray-pos'))).toEqual(['0', '1', '2', '3'])
    expect(places(container).map((g) => g.getAttribute('data-hand'))).toEqual(['a', 'b', null, 'd'])
    expect(container.querySelector('[data-tray-pos="2"]')!.closest('[data-tray-pos]')).not.toBeNull() // input can find the empty place
  })

  it('every place gets renderEmpty under it; an empty place (GAP) gets only that', () => {
    const { container } = draw()
    expect(container.querySelectorAll('.slot')).toHaveLength(4)
    expect(container.querySelectorAll('.art')).toHaveLength(3)
    expect(container.querySelector('[data-tray-pos="2"] .art')).toBeNull()
  })

  it('passes each place’s centre and size to the render props', () => {
    const spots: number[][] = []
    draw({ renderEmpty: (spot) => { spots.push([spot.index, spot.x, spot.y, spot.tile]); return null } })
    expect(spots).toEqual([[0, 25, 25, 50], [1, 85, 25, 50], [2, 145, 25, 50], [3, 205, 25, 50]])
  })

  it('held lifts and marks the place; aimed and waiting fade it', () => {
    const { container } = draw({ places: [{ ...rack[0], held: true }, { ...rack[1], aimed: true }, rack[2], { ...rack[3], waiting: true }] })
    const [held, aimed, , waiting] = places(container)
    expect(held.getAttribute('data-held')).toBe('true')
    expect(held.getAttribute('transform')).toBe('translate(0 -4)') // 0.08 of a 50 px place
    expect(aimed.getAttribute('opacity')).toBe('0.8')
    expect(waiting.getAttribute('opacity')).toBe('0.55')
    expect(places(container)[2].getAttribute('transform')).toBeNull()
  })

  it('hidden: only empty looks, no attributes and no pieces (nobody sees the next player’s hand)', () => {
    const { container } = draw({ hidden: true })
    expect(container.querySelectorAll('.slot')).toHaveLength(4)
    expect(container.querySelectorAll('.art, [data-tray-pos], [data-hand]')).toHaveLength(0)
  })

  it('stages: the svg says the stage; staged pieces sit in data-refresh-slot groups; "gone" shows only the empty look', () => {
    const staged = [{ ...rack[0], staged: true }, rack[1], rack[2], { ...rack[3], staged: true }]
    const { container, rerender } = draw({ places: staged, stage: 'out' })
    expect(container.querySelector('svg')!.getAttribute('data-refresh-stage')).toBe('out')
    expect([...container.querySelectorAll('[data-refresh-slot]')].map((g) => g.getAttribute('data-refresh-slot'))).toEqual(['0', '3'])
    expect(container.querySelector('[data-refresh-slot="0"] .art')).not.toBeNull()
    rerender(<HandView layout={layout} boxWidth={230} places={staged} renderEmpty={empty} renderPiece={art} stage="gone" />)
    expect(container.querySelectorAll('[data-refresh-slot]')).toHaveLength(0)
    expect(container.querySelectorAll('.art')).toHaveLength(1) // only b: a and d have shrunk away
    rerender(<HandView layout={layout} boxWidth={230} places={rack} renderEmpty={empty} renderPiece={art} />)
    expect(container.querySelector('svg')!.hasAttribute('data-refresh-stage')).toBe(false)
  })

  it('animates the staged pieces one after another with the game’s timings', () => {
    const animate = vi.fn()
    Object.defineProperty(Element.prototype, 'animate', { value: animate, configurable: true })
    const staged = [{ ...rack[0], staged: true }, { ...rack[1], staged: true }, rack[2], rack[3]]
    const motion = { shrinkTime: 0.3, growTime: 0.4, stagger: 0.1, overshoot: 0.2 }
    draw({ places: staged, stage: 'in', motion })
    expect(animate).toHaveBeenCalledTimes(2)
    expect(animate.mock.calls[1][1]).toMatchObject({ duration: 400, delay: 100, easing: 'ease-out', fill: 'backwards' })
    expect(animate.mock.calls[0][0][1]).toMatchObject({ transform: 'scale(1.2)', offset: 0.7 })
    cleanup(); animate.mockClear()
    document.documentElement.setAttribute('data-reduce-motion', '')
    draw({ places: staged, stage: 'out', motion })
    expect(animate).not.toHaveBeenCalled() // reduce motion: it just happens
  })
})

// Spotlight (0.43.0, F199): the dim = the screen minus its holes, as rectangles that never overlap (two overlapping
// holes stay ONE undimmed area); the component lights every target (element, selector, screen box), outlines each
// (or one round them all), lets taps through its holes and passThrough targets, and stops the rest at the dim.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { Spotlight } from './spotlight'
import { clipBox, growBox, holePath, joinBoxes, outsidePath, outsideRects } from './spotlightMath'
import type { CalloutBox } from './callout'

afterEach(cleanup)

const area = (bs: CalloutBox[]) => bs.reduce((s, b) => s + (b.right - b.left) * (b.bottom - b.top), 0)
const covers = (bs: CalloutBox[], x: number, y: number) => bs.some((b) => x > b.left && x < b.right && y > b.top && y < b.bottom)

describe('the spotlight dim (maths)', () => {
  it('no holes: the whole screen', () => {
    expect(outsideRects([], 100, 50)).toEqual([{ left: 0, top: 0, right: 100, bottom: 50 }])
  })
  it('one hole: everything but the hole', () => {
    const rs = outsideRects([{ left: 10, top: 10, right: 30, bottom: 20 }], 100, 50)
    expect(area(rs)).toBe(100 * 50 - 20 * 10)
    expect(covers(rs, 20, 15)).toBe(false)
    expect(covers(rs, 5, 5)).toBe(true)
  })
  it('two holes apart: both undimmed, the ground between them dimmed', () => {
    const rs = outsideRects([{ left: 10, top: 10, right: 20, bottom: 20 }, { left: 60, top: 30, right: 80, bottom: 40 }], 100, 50)
    expect(covers(rs, 15, 15)).toBe(false)
    expect(covers(rs, 70, 35)).toBe(false)
    expect(covers(rs, 40, 25)).toBe(true)
    expect(area(rs)).toBe(100 * 50 - 100 - 200)
  })
  it('two overlapping holes (a panel and the part inside it): their union stays undimmed, nothing counted twice', () => {
    const panel = { left: 50, top: 10, right: 90, bottom: 40 }, part = { left: 40, top: 20, right: 60, bottom: 30 }
    const rs = outsideRects([panel, part], 100, 50)
    expect(covers(rs, 55, 25)).toBe(false)
    expect(covers(rs, 45, 25)).toBe(false)
    expect(covers(rs, 70, 35)).toBe(false)
    expect(area(rs)).toBe(100 * 50 - (40 * 30 + 10 * 10))
    for (const a of rs) for (const b of rs) if (a !== b) expect(a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom).toBe(false)
  })
  it('holes off the screen are clipped; all covered → nothing to draw', () => {
    expect(area(outsideRects([{ left: -10, top: -10, right: 20, bottom: 60 }], 100, 50))).toBe(80 * 50)
    expect(outsidePath([{ left: -1, top: -1, right: 101, bottom: 51 }], 100, 50)).toBe('inset(50%)')
    expect(outsidePath([], 10, 10)).toBe('path("M0 0H10V10H0Z")')
  })
  it('grow, clip (null when nothing is left), join', () => {
    expect(growBox({ left: 10, top: 10, right: 20, bottom: 20 }, 4)).toEqual({ left: 6, top: 6, right: 24, bottom: 24 })
    expect(clipBox({ left: -5, top: 5, right: 20, bottom: 60 }, { left: 0, top: 0, right: 100, bottom: 50 })).toEqual({ left: 0, top: 5, right: 20, bottom: 50 })
    expect(clipBox({ left: 200, top: 5, right: 220, bottom: 20 }, { left: 0, top: 0, right: 100, bottom: 50 })).toBeNull()
    expect(joinBoxes([{ left: 10, top: 10, right: 20, bottom: 20 }, { left: 60, top: 30, right: 80, bottom: 40 }])).toEqual({ left: 10, top: 10, right: 80, bottom: 40 })
    expect(joinBoxes([])).toBeNull()
  })
  it('a hole is shaped like the style\'s controls: rounded (at most a pill) or bevelled', () => {
    const b = { left: 0, top: 0, right: 40, bottom: 20 }
    expect(holePath(b, 4)).toBe('M4 0H36A4 4 0 0 1 40 4V16A4 4 0 0 1 36 20H4A4 4 0 0 1 0 16V4A4 4 0 0 1 4 0Z')
    expect(holePath(b, 999)).toContain('A10 10') // Cartoon's 999px: a pill, never more than half the short side
    expect(holePath(b, 4, true)).toBe('M4 0H36L40 4V16L36 20H4L0 16V4L4 0Z')
  })
})

// (jsdom: no layout, so the targets here are screen boxes, and selectors of elements with a size given by a stub)
const layerOf = () => document.querySelector<HTMLElement>('.kit-spot-layer')!

describe('Spotlight', () => {
  it('lights each target: one hole and one outline each, the outline round the hole (grown by the gap)', async () => {
    render(<Spotlight targets={[{ left: 10, top: 10, right: 50, bottom: 30 }, { left: 100, top: 200, right: 140, bottom: 240 }]} />)
    const layer = layerOf()
    expect(layer.hasAttribute('data-ready')).toBe(true)
    const rings = layer.querySelectorAll<HTMLElement>('.kit-spot-ring')
    expect(rings).toHaveLength(2)
    expect(rings[1].hasAttribute('data-gone')).toBe(false)
    expect(rings[1].style.getPropertyValue('--kit-spot-x')).toBe('100px') // (jsdom has no gap-s: 0 room)
    expect(rings[1].style.getPropertyValue('--kit-spot-w')).toBe('40px')
    // the dim's mask has one hole per target, at the target (jsdom: no corner radius)
    const holes = layer.querySelectorAll('.kit-spot-hole')
    expect(holes).toHaveLength(2)
    expect(holes[1].getAttribute('d')).toBe('M100 200H140A0 0 0 0 1 140 200V240A0 0 0 0 1 140 240H100A0 0 0 0 1 100 240V200A0 0 0 0 1 100 200Z')
  })

  it('looks a selector up every frame: a target that appears later gets its hole then', async () => {
    render(<Spotlight targets={['#late', { left: 10, top: 10, right: 50, bottom: 30 }]} />)
    const rings = layerOf().querySelectorAll('.kit-spot-ring')
    expect(rings[0].hasAttribute('data-gone')).toBe(true) // not there yet: no hole, no outline
    expect(rings[1].hasAttribute('data-gone')).toBe(false)
    const late = document.createElement('button')
    late.id = 'late'
    late.getBoundingClientRect = () => ({ left: 300, top: 40, right: 360, bottom: 84, width: 60, height: 44, x: 300, y: 40, toJSON: () => ({}) })
    document.body.append(late)
    await vi.waitFor(() => expect(rings[0].hasAttribute('data-gone')).toBe(false))
    expect((rings[0] as HTMLElement).style.getPropertyValue('--kit-spot-x')).toBe('300px')
    late.remove()
  })

  it('outline "joined" draws one round them all; "none" draws none; nothing found → not shown', async () => {
    const { unmount } = render(<Spotlight outline="joined" targets={[{ left: 10, top: 10, right: 50, bottom: 30 }, { left: 100, top: 200, right: 140, bottom: 240 }]} />)
    const rings = layerOf().querySelectorAll<HTMLElement>('.kit-spot-ring')
    expect(rings).toHaveLength(1)
    expect(rings[0].style.getPropertyValue('--kit-spot-w')).toBe('130px')
    expect(rings[0].style.getPropertyValue('--kit-spot-h')).toBe('230px')
    unmount()
    render(<Spotlight outline="none" targets="#nothing-here" />)
    expect(layerOf().querySelectorAll('.kit-spot-ring')).toHaveLength(0)
    expect(layerOf().hasAttribute('data-ready')).toBe(false)
  })

  it('a tap on the dim stops there and calls onOutsideTap; passThrough targets are left out of the tap block', async () => {
    const onOutsideTap = vi.fn()
    render(<Spotlight targets={{ left: 10, top: 10, right: 50, bottom: 30 }} passThrough={[{ left: 0, top: 500, right: 1024, bottom: 768 }]} onOutsideTap={onOutsideTap} />)
    const block = layerOf().querySelector<HTMLElement>('.kit-spot-block')!
    fireEvent.click(block)
    expect(onOutsideTap).toHaveBeenCalledOnce()
    // the dim you see still covers the passThrough part (no hole there); the tap block doesn't (taps go through to it)
    expect(layerOf().querySelectorAll('.kit-spot-hole')).toHaveLength(1)
    const tapBlock = block.style.getPropertyValue('clip-path')
    expect(tapBlock).toContain('V500')
    expect(tapBlock).not.toContain('V768')
  })

  it('an outline running off the window stops at its edge (the line still on screen)', async () => {
    render(<Spotlight targets={{ left: -20, top: 10, right: 40, bottom: 30 }} />)
    const ring = layerOf().querySelector<HTMLElement>('.kit-spot-ring')!
    expect(parseFloat(ring.style.getPropertyValue('--kit-spot-x'))).toBeGreaterThanOrEqual(0)
  })
})


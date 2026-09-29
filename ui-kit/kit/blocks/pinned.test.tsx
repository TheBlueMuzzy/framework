// PinnedBox: the scale that fits a piece to its box in the game world, and that it waits to be measured.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { PinnedBox, pinScale, REM_PIXELS } from './pinned'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('pinScale', () => {
  // A chip drawn 200 × 50 page pixels; the table shows 100 pixels per world unit
  const chip = { width: 200, height: 50, pixelsPerUnit: 100 }

  it('fit: grows or shrinks to the tighter side of the box', () => {
    expect(pinScale({ ...chip, fit: [4, 2] })).toBe(2) // 400 px wide room / 200 = 2 (height would allow 4)
    expect(pinScale({ ...chip, fit: [1, 2] })).toBe(0.5) // 100 px wide room: half size
  })

  it('rem: the same size for every piece with the same rem, but fit still shrinks one that would spill', () => {
    expect(pinScale({ ...chip, rem: 0.32 })).toBeCloseTo((0.32 * 100) / REM_PIXELS) // 2
    expect(pinScale({ ...chip, rem: 0.32, fit: [1, 2] })).toBe(0.5)
  })

  it('no fit or rem: natural size; not drawn yet (no size): null', () => {
    expect(pinScale(chip)).toBe(1)
    expect(pinScale({ ...chip, width: 0 })).toBeNull()
  })
})

describe('PinnedBox', () => {
  it('wears kit-scope, names its anchor and pin, and stays hidden until it has been measured', () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    const { container } = render(<PinnedBox pixelsPerUnit={100} fit={[3, 1]} anchor="center" name="me"><span>Muzzy</span></PinnedBox>)
    const box = container.querySelector<HTMLElement>('.kit-pinned')!
    expect(box.classList.contains('kit-scope')).toBe(true)
    expect(box.dataset.anchor).toBe('center')
    expect(box.dataset.pin).toBe('me')
    expect(box.dataset.ready).toBeUndefined() // jsdom draws nothing, so there's no size to fit yet
  })
})

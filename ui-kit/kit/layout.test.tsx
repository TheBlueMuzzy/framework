// <Screen scroll>: the centre opens in the middle, then only grows / shrinks downward; placed again only when the
// screen's size changes. jsdom has no layout, so the page's measurements are stood in for: the screen is SCREEN_H tall
// and the centre would sit at CENTRED_TOP if centred, at START_TOP at the top of its row.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { Screen } from './layout'

let screenH = 800
let centredTop = 300
const START_TOP = 16

beforeEach(() => {
  screenH = 800
  centredTop = 300
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
    return this.style.alignSelf === 'center' ? centredTop : START_TOP
  })
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => screenH)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 400)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const centreOf = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-slot="center"]')!

describe('<Screen scroll> opens centred, then grows down', () => {
  it('on open: a top margin that puts it in the middle (measured before paint)', () => {
    const { container } = render(<Screen scroll><p>rows</p></Screen>)
    expect(centreOf(container).style.marginBlockStart).toBe(`${300 - START_TOP}px`)
    expect(centreOf(container).style.alignSelf).toBe('') // (back to the CSS: top of its row)
  })

  it('more rows (content changes) keep the top where it was', () => {
    const { container, rerender } = render(<Screen scroll><p>1</p></Screen>)
    centredTop = 250 // (taller content would now centre higher…)
    rerender(<Screen scroll><p>1</p><p>2</p><p>3</p></Screen>)
    act(() => { window.dispatchEvent(new Event('resize')) }) // (…and a resize event with the SAME size changes nothing)
    expect(centreOf(container).style.marginBlockStart).toBe(`${300 - START_TOP}px`)
  })

  it('the window changes size (rotate, resize): placed in the middle again', () => {
    const { container } = render(<Screen scroll><p>rows</p></Screen>)
    screenH = 500
    centredTop = 120
    act(() => { window.dispatchEvent(new Event('resize')) })
    expect(centreOf(container).style.marginBlockStart).toBe(`${120 - START_TOP}px`)
  })

  it('taller than the window when it opens: no margin, it starts at the top', () => {
    centredTop = START_TOP
    const { container } = render(<Screen scroll><p>lots</p></Screen>)
    expect(centreOf(container).style.marginBlockStart).toBe('0px')
  })

  it('a Screen without scroll is left to the CSS (centred by place-self)', () => {
    const { container } = render(<Screen><p>menu</p></Screen>)
    expect(centreOf(container).style.marginBlockStart).toBe('')
  })
})

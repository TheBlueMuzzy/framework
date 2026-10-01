// The carousel in a page with no real layout (jsdom): the items' places and the window's width are faked.
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Carousel } from './Carousel'

let viewWidth = 130
const real = {
  offsetLeft: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetLeft')!,
  offsetWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!,
  clientWidth: Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')!,
}
beforeAll(() => {
  // Five 60-px items, 4 px apart (item i starts at 64 × i); the window is viewWidth wide
  Object.defineProperty(HTMLElement.prototype, 'offsetLeft', { configurable: true, get() { return 64 * Number(this.dataset.i ?? 0) } })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return this.dataset.i === undefined ? 0 : 60 } })
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get() { return this.classList.contains('dk-carousel-view') ? viewWidth : 0 } })
})
afterAll(() => Object.entries(real).forEach(([key, d]) => Object.defineProperty(key === 'clientWidth' ? Element.prototype : HTMLElement.prototype, key, d)))
afterEach(() => { cleanup(); viewWidth = 130 })

const items = (n = 5) => Array.from({ length: n }, (_, i) => <button key={i} data-i={i} role="tab">item {i}</button>)
const dots = () => screen.queryAllByRole('button', { name: /page \d of/ })
const current = () => dots().findIndex((d) => d.getAttribute('aria-current') === 'true')
const slide = () => (document.querySelector('.dk-carousel-track') as HTMLElement).style.transform

describe('Carousel', () => {
  it('everything fits: just the row — no arrows, no dots', () => {
    viewWidth = 400
    render(<Carousel label="Tools">{items()}</Carousel>)
    expect(screen.queryByRole('button', { name: 'Next tools' })).toBeNull()
    expect(dots()).toHaveLength(0)
  })

  it('too many: ◀ ▶ step a page at a time, the dots follow (and jump)', () => {
    render(<Carousel label="Tools" role="tablist">{items()}</Carousel>)
    expect(screen.getByRole('tablist', { name: 'Tools' }).children).toHaveLength(5)
    expect(dots()).toHaveLength(3) // 2 + 2 + 1 items
    expect(current()).toBe(0)
    expect((screen.getByRole('button', { name: 'Previous tools' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Next tools' }))
    expect(current()).toBe(1)
    expect(slide()).toBe('translateX(-128px)')
    fireEvent.click(dots()[2])
    expect(current()).toBe(2)
    expect(slide()).toBe('translateX(-186px)') // the last page stops at the row's end
    expect((screen.getByRole('button', { name: 'Next tools' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps the active item in view, and turns to an item that gets keyboard focus', () => {
    const { rerender } = render(<Carousel label="Tools" active={4}>{items()}</Carousel>)
    expect(current()).toBe(2)
    rerender(<Carousel label="Tools" active={0}>{items()}</Carousel>)
    expect(current()).toBe(0)
    fireEvent.focus(screen.getByText('item 3'))
    expect(current()).toBe(1)
  })
})

import { describe, expect, it } from 'vitest'
import { carouselPages, pageOf, type ItemBox } from './carouselPages'

// Five 60-px items with 4-px gaps: 0–60, 64–124, 128–188, 192–252, 256–316
const row: ItemBox[] = [0, 64, 128, 192, 256].map((left) => ({ left, width: 60 }))

describe('carouselPages', () => {
  it('one page when everything fits', () => {
    expect(carouselPages(row, 320)).toEqual([{ first: 0, offset: 0, width: 320 }])
    expect(carouselPages([], 100)).toEqual([{ first: 0, offset: 0, width: 100 }])
  })

  it('whole items per page, and the width they take (the rest of the window is clipped)', () => {
    // 130 px window: 2 whole items a page → items 0–1, 2–3, then 4
    expect(carouselPages(row, 130)).toEqual([
      { first: 0, offset: 0, width: 124 }, { first: 2, offset: 128, width: 124 }, { first: 4, offset: 256, width: 60 },
    ])
    // 200 px: 0–2, then 3–4
    expect(carouselPages(row, 200)).toEqual([{ first: 0, offset: 0, width: 188 }, { first: 3, offset: 192, width: 124 }])
  })

  it('an item wider than the window gets a page of its own', () => {
    const wide: ItemBox[] = [{ left: 0, width: 50 }, { left: 54, width: 300 }, { left: 358, width: 50 }]
    expect(carouselPages(wide, 100).map((p) => p.first)).toEqual([0, 1, 2])
  })
})

describe('pageOf', () => {
  it('finds the page an item is on', () => {
    const pages = carouselPages(row, 130)
    expect([0, 1, 2, 3, 4].map((i) => pageOf(pages, i))).toEqual([0, 0, 1, 1, 2])
  })
})

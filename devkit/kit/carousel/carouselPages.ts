// THE CAROUSEL'S PAGES — plain maths, no browser: given where each item sits in the row and how wide the window
// onto it is, which items make up each page and how far the row slides to show it.
// A page = as many whole items as fit, starting from the first one not yet shown. The last page slides only as far
// as the row's end (no empty space after it), so it may show a few items of the page before it too.

/** One item in the row: its left edge and width, in px from the row's start. */
export type ItemBox = { left: number; width: number }
/** One page: its first item, and how far (px) the row slides left to show it. */
export type CarouselPage = { first: number; offset: number }

export function carouselPages(items: ItemBox[], view: number): CarouselPage[] {
  if (items.length === 0 || view <= 0) return [{ first: 0, offset: 0 }]
  const end = Math.max(...items.map((it) => it.left + it.width))
  if (end <= view + 0.5) return [{ first: 0, offset: 0 }] // everything fits: one page
  const pages: CarouselPage[] = []
  let first = 0
  while (first < items.length) {
    const start = items[first].left
    pages.push({ first, offset: Math.min(start, end - view) })
    // the next page starts at the first item that doesn't fit whole on this one (always at least one item further)
    let next = first + 1
    while (next < items.length && items[next].left + items[next].width - start <= view + 0.5) next++
    if (start >= end - view) break // this page already reaches the row's end
    first = next
  }
  return pages
}

/** Which page shows this item (the first page it fits on whole; else the page it starts on). */
export function pageOf(pages: CarouselPage[], items: ItemBox[], index: number, view: number): number {
  const it = items[index]
  if (!it) return 0
  const whole = pages.findIndex((p) => it.left >= p.offset - 0.5 && it.left + it.width <= p.offset + view + 0.5)
  if (whole >= 0) return whole
  let at = 0
  pages.forEach((p, i) => { if (p.first <= index) at = i })
  return at
}

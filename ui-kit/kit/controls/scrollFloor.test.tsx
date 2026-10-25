// @vitest-environment node
// F145 (0.35.1): a ScrollArea straight in a card gives up height only down to --kit-scroll-min (4rem) — at 200% text
// on a phone the Room's player list was squeezed to a 16 px sliver under the big words. Past that the card scrolls as
// one. A short list is never held taller than itself. Measured in a real browser with the kit's CSS; ScrollArea's own
// measuring (--kit-scroll-contents) is stood in for by hand, as the page here is static markup.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Panel } from '../layout'
import { ScrollArea } from './ScrollArea'

let browser: Browser, page: Page
beforeAll(async () => {
  browser = await openBrowser()
  page = await browser.newPage({ viewport: { width: 390, height: 844 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

// A card 300 px tall: a tall block of words above a list of `rows` rows (each 2rem)
const card = (rows: number) => `<div style="display: flex; flex-direction: column; block-size: 300px">${renderToStaticMarkup(
  <Panel gap="m"><div style={{ blockSize: '260px', flexShrink: 0 }}>Big words</div>
    <ScrollArea label="Players">{Array.from({ length: rows }, (_, i) => <div key={i} style={{ blockSize: '2rem' }}>Row {i}</div>)}</ScrollArea>
  </Panel>)}</div>`
const measure = () => page.evaluate(() => {
  const list = document.querySelector<HTMLElement>('.kit-scroll')!
  const kids = [...list.children].map((c) => c.getBoundingClientRect())
  const s = getComputedStyle(list)
  list.style.setProperty('--kit-scroll-contents', `${kids.at(-1)!.bottom - kids[0].top + parseFloat(s.paddingTop) + parseFloat(s.paddingBottom)}px`)
  return { list: list.getBoundingClientRect().height, rem: parseFloat(getComputedStyle(document.documentElement).fontSize) }
})

describe('A ScrollArea in a card keeps a floor', () => {
  it('a long list keeps 4rem, at 100% and 200% text', async () => {
    for (const size of ['100%', '200%']) {
      await showInStyle(page, 'clean', card(6))
      await page.evaluate((s) => { document.documentElement.style.fontSize = s }, size)
      const { list, rem } = await measure()
      expect(list, size).toBeCloseTo(4 * rem, 0)
    }
  })

  it('a short list is never held taller than its rows', async () => {
    await showInStyle(page, 'clean', card(1))
    const { list, rem } = await measure()
    expect(list).toBeLessThan(4 * rem)
    expect(list).toBeGreaterThanOrEqual(2 * rem) // its one row, whole
  })
})

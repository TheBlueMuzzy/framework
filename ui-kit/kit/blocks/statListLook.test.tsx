// @vitest-environment node
// StatList's reveal in a real browser, in all 5 styles (0.31.0, Goops' payslip): the rows are unseen, then seen one
// after another in order (the Results rows' entrance, each row `reveal` ms after the one above), and the card is its
// final size from the start — the same box before, during and after the reveal, and the same as with no reveal at all.
// The clock is the page's own animations, stopped at set moments (the Dev Kit's full pause stops them the same way).
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { Panel } from '../layout'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { GameOver, StatList, Victory, type Stat } from './flow'

let browser: Browser, page: Page
beforeAll(async () => {
  browser = await openBrowser()
  page = await browser.newPage({ viewport: { width: 390, height: 844 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

const STEP = 200
const stats: Stat[] = [
  { label: 'Wage', value: '$120' }, { label: 'Rent', value: '−$40', tone: 'danger' },
  { label: 'Debt', value: '$300', tone: 'danger' }, { label: 'Net pay', value: '$80', tone: 'success' },
]
const card = (reveal?: number) => renderToStaticMarkup(
  <Panel depth={2} gap="m" className="kit-modal"><StatList stats={stats} reveal={reveal} /></Panel>)

// Lets the entrances run (showInStyle turns them off), then stops every one at `at` ms — the page's clock, paused.
const startEntrances = (p: Page) => p.evaluate(() => document.querySelectorAll('head style')[1].remove())
const stopAt = (p: Page, at: number) => p.evaluate((ms) => {
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms }
}, at)
const look = (p: Page) => p.evaluate(() => ({
  card: (() => { const el = document.querySelector<HTMLElement>('.kit-panel')!; return `${el.offsetWidth}×${el.offsetHeight}` })(),
  opacity: [...document.querySelectorAll('.kit-stat-row')].map((el) => Number(getComputedStyle(el).opacity)),
}))

describe.each(Object.keys(presets))('StatList reveal in %s', (preset) => {
  it('rows unseen, then seen in order; the card the same size throughout — and as with no reveal', async () => {
    await showInStyle(page, preset, card())
    const plain = (await look(page)).card
    expect(Number(plain.split('×')[1])).toBeGreaterThan(100) // really laid out

    await showInStyle(page, preset, card(STEP))
    await startEntrances(page)
    const timing = await page.evaluate(() => [...document.querySelectorAll('.kit-stat-row')].map((el) => {
      const [a] = el.getAnimations()
      return { name: (a as CSSAnimation).animationName, delay: Math.round(Number(a.effect!.getTiming().delay)), duration: Number(a.effect!.getTiming().duration) }
    }))
    // the Results rows' entrance (the style's --enter), one step apart, in order
    expect(timing.map((t) => t.name)).toEqual(Array(4).fill(String(presets[preset].enter)))
    expect(timing.map((t) => t.delay)).toEqual([0, STEP, 2 * STEP, 3 * STEP])
    const entrance = timing[0].duration

    await stopAt(page, 0) // before: nothing seen yet
    const before = await look(page)
    await stopAt(page, STEP * 1.5) // mid: the first two rows on their way in, the last two still waiting
    const mid = await look(page)
    await stopAt(page, 3 * STEP + entrance) // after: every row in
    const after = await look(page)

    expect(before.opacity).toEqual([0, 0, 0, 0])
    expect(mid.opacity.slice(2)).toEqual([0, 0])
    expect(after.opacity).toEqual([1, 1, 1, 1])
    expect([before.card, mid.card, after.card]).toEqual([plain, plain, plain])
  })
})

// LONG LISTS (0.31.0, Goops' payslip: 692 px of rows in a 605 px frame at 390×844): Victory / GameOver's stats scroll in
// their own ScrollArea, so the title and the buttons are always in sight without scrolling the page or the card — at
// a phone's size, on its side and on a desktop. A list that fits: the card exactly as it was without the ScrollArea.
// (The scroll following the reveal needs React running: flow.test.tsx's rules + the gallery proof run.)
const longStats: Stat[] = [
  { label: 'Gross pay', value: '$140' },
  { label: 'Fine: unauthorised goop contact (Vat Hygiene Compliance Division)', value: '−$25', tone: 'danger' },
  { label: 'Fine: excess breathing surcharge (Breathable Air Holdings Ltd)', value: '−$12', tone: 'danger' },
  { label: 'Fine: uniform wear recovery (Consolidated Garment Services)', value: '−$8', tone: 'danger' },
  { label: 'Rent: company dormitory, block C', value: '−$35', tone: 'danger' },
  { label: 'Debt to the company', value: '$1,240', tone: 'danger' },
  { label: 'Goop cleared', value: '84%' },
  { label: 'Best streak', value: '12', tone: 'success' },
  { label: 'Net pay', value: '$60', tone: 'success' },
]
const endLook = (p: Page) => p.evaluate(() => {
  const inView = (el: Element) => { const b = el.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth }
  const card = document.querySelector<HTMLElement>('.kit-end')!
  const box = document.querySelector<HTMLElement>('.kit-end .kit-scroll')!
  return {
    seen: [document.querySelector('.kit-end-title')!, ...document.querySelectorAll('.kit-end .kit-button')].every(inView),
    pageScrolls: document.scrollingElement!.scrollHeight > innerHeight + 1,
    cardScrolls: card.scrollHeight > card.clientHeight + 1,
    listScrolls: box.scrollHeight > box.clientHeight + 1,
  }
})

describe.each(Object.keys(presets))('Victory / GameOver with a long list in %s', (preset) => {
  it.each([[390, 844], [360, 780], [844, 390], [768, 343], [1100, 800]])('%i×%i: title + buttons in sight, only the list scrolls', async (width, height) => {
    await page.setViewportSize({ width, height })
    for (const markup of [
      renderToStaticMarkup(<Victory message="The vat is clean. Shift over." stats={longStats} onContinue={() => {}} onQuit={() => {}} />),
      renderToStaticMarkup(<GameOver message="The vat overflowed." stats={longStats} onRetry={() => {}} onQuit={() => {}} />),
    ]) {
      await showInStyle(page, preset, markup)
      expect(await endLook(page)).toEqual({ seen: true, pageScrolls: false, cardScrolls: false, listScrolls: true })
    }
  })

  it('a short list that fits: the card the same size as with no ScrollArea round the rows (unchanged)', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await showInStyle(page, preset, renderToStaticMarkup(<Victory message="The vat is clean." stats={stats} onContinue={() => {}} />))
    const withBox = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>('.kit-end')!
      const box = card.querySelector<HTMLElement>('.kit-scroll')!
      return { card: `${card.offsetWidth}×${card.offsetHeight}`, scrolls: box.scrollHeight > box.clientHeight + 1 }
    })
    const without = await page.evaluate(() => { // the old structure: the rows straight in the report
      const box = document.querySelector<HTMLElement>('.kit-end .kit-scroll')!
      box.replaceWith(...box.childNodes)
      const card = document.querySelector<HTMLElement>('.kit-end')!
      return `${card.offsetWidth}×${card.offsetHeight}`
    })
    expect(withBox).toEqual({ card: without, scrolls: false })
  })
})

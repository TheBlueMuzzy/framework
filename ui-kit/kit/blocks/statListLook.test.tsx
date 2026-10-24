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
import { StatList, type Stat } from './flow'

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

// @vitest-environment node
// F136 (0.33.3): Mode select spreads its cards over the row — 2 modes on a desktop panel fill it instead of leaving an
// empty column; 3 modes and a phone look as before. Measured in a real browser with the kit's CSS.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Grid } from '../layout'
import { Card } from '../controls'

let browser: Browser, page: Page
beforeAll(async () => {
  browser = await openBrowser()
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

// The grid as ModeSelect draws it, in a box as wide as its panel on a desktop (526 px) or a phone (308 px)
const modes = (count: number, width: number) => `<div style="inline-size: ${width}px">${renderToStaticMarkup(
  <Grid gap="m" min="s" fill>{['Solo', 'Party', 'Online'].slice(0, count).map((name) => <Card key={name} title={name}>x</Card>)}</Grid>)}</div>`
const measure = () => page.evaluate(() => {
  const grid = document.querySelector('.kit-grid')!
  return { cards: [...grid.querySelectorAll('.kit-card')].map((c) => Math.round(c.getBoundingClientRect().right)), right: Math.round(grid.getBoundingClientRect().right) }
})

describe('Mode select fills its row', () => {
  it('2 modes on a desktop panel: the second card ends at the row\'s end (no empty column)', async () => {
    await showInStyle(page, 'clean', modes(2, 526))
    const { cards, right } = await measure()
    expect(cards).toHaveLength(2)
    expect(cards[1]).toBe(right)
  })

  it('3 modes on a desktop panel: three across, the last at the row\'s end — as before', async () => {
    await showInStyle(page, 'clean', modes(3, 526))
    const { cards, right } = await measure()
    expect(new Set(cards).size).toBe(3)
    expect(cards[2]).toBe(right)
  })

  it('a phone: 2 per row, as before', async () => {
    await showInStyle(page, 'clean', modes(3, 308))
    const { cards, right } = await measure()
    expect(cards[1]).toBe(right) // the second card ends the first row
    expect(cards[2]).toBeLessThan(right) // the third starts the next row
  })
})

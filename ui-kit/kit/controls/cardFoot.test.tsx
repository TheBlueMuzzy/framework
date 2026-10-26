// @vitest-environment node
// F149 (0.35.5): a card in a Screen's centre that has to scroll (the last resort on a short screen) keeps its last row
// of buttons in sight at its bottom, with the card's room below it — Safari's text-wrap: pretty wrapped the Lobby room's
// words onto one line more and "I'M READY" sat cut on the card's bottom edge. The row is painted with the card's colour
// only while the card can scroll; a card that fits looks as before.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Button } from './Button'

let browser: Browser, page: Page
beforeAll(async () => {
  browser = await openBrowser()
  page = await browser.newPage({ viewport: { width: 390, height: 844 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

const card = (screenHeight: number) => `<div class="kit-screen" style="block-size: ${screenHeight}px; inset: auto; inline-size: 300px">
  <div data-slot="center"><div class="kit-panel" data-gap="m" style="gap: 8px">
    <p class="kit-text" style="block-size: 300px">Many words</p>
    <div class="kit-row" data-gap="s">${renderToStaticMarkup(<><Button variant="ghost">Leave</Button><Button>I'm ready</Button></>)}</div>
  </div></div></div>`

// (two frames: a scroll timeline takes the card's new scroll state on the next frame)
// (the look page turns every animation off; the paint IS one — a scroll-driven one, no time involved — so it goes)
const read = () => page.evaluate(async () => {
  for (const style of document.querySelectorAll('style')) if (style.textContent!.startsWith('*, *::before')) style.remove()
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  const panel = document.querySelector('.kit-panel')!, row = panel.querySelector('.kit-row')!
  const p = panel.getBoundingClientRect(), s = getComputedStyle(panel)
  const room = p.bottom - parseFloat(s.borderBottomWidth) - row.getBoundingClientRect().bottom
  return { scrolls: panel.scrollHeight > panel.clientHeight + 1, room: Math.round(room), painted: getComputedStyle(row).backgroundColor !== 'rgba(0, 0, 0, 0)' }
})

describe.each(['clean', 'pixel'])('a card that scrolls in %s', (preset) => {
  it('keeps its last row of buttons in sight, the card’s padding below it, painted', async () => {
    await showInStyle(page, preset, card(240))
    const t = await read()
    expect(t.scrolls).toBe(true)
    expect(t.painted).toBe(true)
    // the card's own room under its buttons (its padding), not 0 or cut off below the edge
    expect(t.room).toBeGreaterThanOrEqual(8)
  })

  it('a card that fits is as before: its row not painted', async () => {
    await showInStyle(page, preset, card(800))
    const t = await read()
    expect(t.scrolls).toBe(false)
    expect(t.painted).toBe(false)
  })
})

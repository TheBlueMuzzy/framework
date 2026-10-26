// @vitest-environment node
// F149 (0.35.5): an icon button is its own size whatever font draws its symbol. WebKit (every iPhone) draws ⚙ as a
// colour emoji 1.37 em wide where Chromium on Windows draws a 0.84 em text gear — the 44 px button grew to 55–61 px.
// Emoji fonts differ by machine (GitHub's Linux has none of Windows' or Apple's), so a wide symbol is stood in for by
// three kit-font letters ("WWW", wider than any emoji); a narrow one by "+". The kit's own fonts, inlined: no disk, no
// system font.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Button, fitGlyph } from './Button'

let browser: Browser, page: Page
beforeAll(async () => {
  browser = await openBrowser()
  page = await browser.newPage({ viewport: { width: 390, height: 844 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

const buttons = renderToStaticMarkup(<>
  <Button variant="secondary" icon aria-label="Narrow">+</Button>
  <Button variant="secondary" icon aria-label="Wide">WWW</Button>
  <Button variant="secondary" icon size={64} aria-label="Wide and big">WWW</Button>
</>)

// Each button's size, its symbol's font size, and the room between the symbol and the inside of its border (the
// smallest of its two sides) — before and after fitGlyph (what Button's useGlyphFit runs in a browser)
const measure = (textSize: string) => page.evaluate(`(() => {
  document.documentElement.style.fontSize = '${textSize}'
  const read = () => [...document.querySelectorAll('.kit-button')].map((b) => {
    const g = b.querySelector('.kit-button-glyph'), s = getComputedStyle(b), box = b.getBoundingClientRect(), r = g.getBoundingClientRect()
    const room = Math.min(r.left - box.left - parseFloat(s.borderLeftWidth), box.right - parseFloat(s.borderRightWidth) - r.right)
    return { size: Math.round(box.width) + '×' + Math.round(box.height), font: parseFloat(getComputedStyle(g).fontSize), room }
  })
  const before = read()
  document.querySelectorAll('.kit-button-glyph').forEach((g) => (${fitGlyph.toString()})(g))
  return { before, after: read() }
})()`) as Promise<{ before: { size: string; font: number; room: number }[]; after: { size: string; font: number; room: number }[] }>

describe.each(Object.keys(presets))('icon buttons in %s', (preset) => {
  it.each(['100%', '200%'])('at %s text: 44 px (or its size) whatever the symbol; a wide symbol is drawn smaller, with room each side', async (textSize) => {
    await showInStyle(page, preset, buttons)
    const { before, after } = await measure(textSize)
    // the box never follows the symbol — before the fit too
    for (const b of [before, after]) expect(b.map((x) => x.size)).toEqual(['44×44', '44×44', '64×64'])
    // a narrow symbol fits already: its size doesn't change
    expect(after[0].font).toBe(before[0].font)
    // a wide one shrinks until it's inside the border with room (the page check's 1.5 px)
    expect(after[1].font).toBeLessThan(before[1].font)
    for (const b of after) expect(b.room).toBeGreaterThanOrEqual(1.5)
  })
})

// A Bar's / Counter's typed symbol and a stat row's ▼ / ▲ tag: a box of their own size, whatever their symbol's width
it('a HUD symbol is 1.375 em wide, narrow symbol or wide; a ▼ / ▲ tag never wider than 0.875 em', async () => {
  const slot = (s: string) => `<span class="kit-hud-icon" data-symbol="true" style="font-size: 20px">${s}</span>`
  const tag = (s: string) => `<span class="kit-tone-mark" role="img" aria-label="Loss" style="font-size: 20px">${s}</span>`
  await showInStyle(page, 'clean', `<div class="kit-hud-chip">${slot('+')}${slot('WWW')}</div>${tag('.')}${tag('WW')}`)
  const widths = await page.$$eval('.kit-hud-icon, .kit-tone-mark', (els) => els.map((el) => el.getBoundingClientRect().width))
  expect(widths.slice(0, 2)).toEqual([27.5, 27.5])
  expect(widths[2]).toBeLessThan(17.5) // a narrow one keeps its own width (Pixel's own ▼)
  expect(widths[3]).toBe(17.5)
})

// @vitest-environment node
// The PAUSED pill vs the game's HUD (0.21.0): badgeOverHud in a real browser (Playwright's own Chromium) on small hand-made
// pages with the real devkit.css, and judgeBadge's verdict.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BADGE_SPOTS, badgeOverHud, judgeBadge } from './badgeClear.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const devkitCss = readFileSync(join(here, '..', 'devkit.css'), 'utf8')

let browser, page
beforeAll(async () => {
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  page = await browser.newPage({ viewport: { width: 390, height: 844 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

const pill = (spot) => `<button class="devkit-pause-badge" data-mode="full"${spot ? ` data-spot="${spot}"` : ''}>⏸ PAUSED</button>`
const overOn = async (html, spots = BADGE_SPOTS) => {
  await page.setContent(`<!doctype html><style>${devkitCss} body{margin:0;font:16px sans-serif}</style>${html}`)
  return page.evaluate(badgeOverHud, { spots })
}

describe('badgeOverHud', () => {
  // Goops at 390×844: "CRACKS 0/10" centred in the top row, under the old top-centre pill
  const hud = `
    <div style="pointer-events:none;position:fixed;top:6px;left:0;right:0;text-align:center;font-size:20px">CRACKS 0/10</div>
    <button style="position:fixed;top:4px;right:8px;width:44px;height:44px" aria-label="Pause">❚❚</button>
    <div style="pointer-events:none;position:fixed;bottom:10px;left:0;right:0;text-align:center">INTEGRITY</div>`

  it('lists the HUD words under the pill at top (even pointer-events: none ones) and none at the middle of the left edge', async () => {
    const seen = await overOn(hud + pill('top'))
    expect(seen.current).toBe('top')
    expect(seen.over.top).toEqual(['CRACKS 0/10'])
    expect(seen.over.left).toEqual([])
    expect(seen.over.bottom).toEqual(['INTEGRITY'])
    expect(seen.over['top-right']).toContain('Pause') // a control, by its name
  })

  it('puts the pill back where it was, and a pill with no data-spot is "left"', async () => {
    const seen = await overOn(hud + pill(null))
    expect(seen.current).toBe('left')
    expect(await page.evaluate(() => document.querySelector('.devkit-pause-badge').hasAttribute('data-spot'))).toBe(true)
    expect(await page.evaluate(() => document.querySelector('.devkit-pause-badge').getAttribute('data-spot'))).toBe('left')
  })

  it('words hidden under something that paints (a dialog over the HUD) or on a hidden layer do not count', async () => {
    const seen = await overOn(`
      <div style="position:fixed;top:6px;left:0;right:0;text-align:center">Score 120</div>
      <div style="position:fixed;top:0;left:0;right:0;height:80px;background:#222"></div>
      <div style="visibility:hidden;position:fixed;bottom:10px;left:0;right:0;text-align:center">Hidden words</div>
      ${pill('top')}`, ['top', 'bottom'])
    expect(seen.over).toEqual({ top: [], bottom: [] })
  })

  it('a meter (a health bar) counts, by its name', async () => {
    const seen = await overOn(`<div role="progressbar" aria-label="Integrity" style="position:fixed;bottom:6px;left:20px;right:20px;height:24px;background:#3a3"></div>${pill('bottom')}`, ['bottom', 'top'])
    expect(seen.over).toEqual({ bottom: ['Integrity'], top: [] })
  })

  it('the Dev Kit\'s own parts never count', async () => {
    const seen = await overOn(`<div class="devkit-corner" style="position:fixed;top:6px;left:0;right:0;text-align:center">Dev Kit</div>${pill('top')}`, ['top'])
    expect(seen.over.top).toEqual([])
  })

  it('no pill on the page → missing', async () => {
    expect(await overOn('<p>game</p>')).toEqual({ missing: true })
  })
})

describe('judgeBadge', () => {
  const run = (size, over, current = 'top') => ({ size, current, over: Object.fromEntries(BADGE_SPOTS.map((s) => [s, over[s] ?? []])) })

  it('warns naming the size and the words, and lists the spots clear at EVERY size', () => {
    const v = judgeBadge([run('390×844', { top: ['CRACKS 0/10'], right: ['Shop'] }), run('360×780', { top: ['CRACKS 0/10'], left: ['Lives'] })])
    expect(v.ok).toBe(false)
    expect(v.problems).toEqual(['390×844: at "top" it covers "CRACKS 0/10"', '360×780: at "top" it covers "CRACKS 0/10"'])
    expect(v.clear).toEqual(['bottom', 'bottom-left', 'bottom-right', 'top-left', 'top-right'])
  })

  it('passes when the current spot is clear everywhere', () => {
    expect(judgeBadge([run('390×844', { top: ['x'] }, 'left')]).ok).toBe(true)
  })
})

describe('BADGE_SPOTS', () => {
  it('is the same list as badgeSpot.ts and devkit.css', () => {
    const ts = readFileSync(join(here, 'badgeSpot.ts'), 'utf8').match(/BADGE_SPOTS = \[([^\]]*)\]/)[1]
    expect(ts.split(',').map((s) => s.trim().replace(/'/g, ''))).toEqual(BADGE_SPOTS)
    for (const spot of BADGE_SPOTS) expect(devkitCss).toContain(`.devkit-pause-badge[data-spot='${spot}']`)
  })
})

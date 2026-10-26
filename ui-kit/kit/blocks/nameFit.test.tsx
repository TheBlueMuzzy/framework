// @vitest-environment node
// Names are never cut short (0.33.0, F119), in a real browser, in all 5 styles: Results cut "Sherman Meredith" to
// "Sherman Mere…" and "Muzzy" (beside its ★ and You badges) to "Muz…" on a phone; the Lobby room cut its "Share this
// code with your friends" line. Now a name wraps (its badges move under it) and the page check finds nothing cut off.
// And on a phone on its side the Lobby room's Leave / I'm ready no longer slide up over the waiting line.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Results } from './flow'
import { Lobby } from './online'

// The page check (uiProblems.mjs has no types; loaded by a plain path so TypeScript doesn't look for them)
type FindProblems = (options: { screenWidth: number; checkFocus: boolean }) => string[]
const uiProblems = '../uiProblems.mjs'
let findProblems: FindProblems
let browser: Browser
beforeAll(async () => {
  findProblems = ((await import(/* @vite-ignore */ uiProblems)) as { findProblems: FindProblems }).findProblems
  browser = await openBrowser()
}, 60_000)
afterAll(async () => { await browser?.close() })

const noop = () => {}
const people = [
  { id: 'me', name: 'Muzzy', score: 212 }, { id: 'a', name: 'Ada', score: 212 }, { id: 's', name: 'Sam', score: 187 },
  { id: 'sm', name: 'Sherman Meredith', score: 140 }, { id: 'l', name: 'Lin', score: 96 },
]
const results = renderToStaticMarkup(<Results players={people} meId="me" onContinue={noop} />)
const room = renderToStaticMarkup(<Lobby roomCode="QX2T" meId="me" hostId="sm" onCreate={noop} onJoin={noop} onStart={noop} onLeave={noop}
  onReady={noop} players={[{ id: 'sm', name: 'Sherman Meredith' }, { id: 'me', name: 'Muzzy' }, { id: 'a', name: 'Ada', ready: true }, { id: 'l', name: 'Lin' }]} />)

// The page check's cut-off and overlap lines, and every name's words: shown whole (not wider than its box)
async function check(width: number, height: number, preset: string, markup: string) {
  const page = await browser.newPage({ viewport: { width, height } })
  await showInStyle(page, preset, markup)
  const problems = (await page.evaluate(findProblems, { screenWidth: width, checkFocus: false })).filter((p: string) => /^(clipped|overlap)/.test(p))
  const cut = await page.$$eval('.kit-result-name .kit-text', (els) => els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent))
  await page.close()
  return { problems, cut }
}

describe.each(Object.keys(presets))('names in %s', (preset) => {
  it('Results on a phone: every name whole, nothing cut off', async () => {
    expect(await check(390, 844, preset, results)).toEqual({ problems: [], cut: [] })
  })
  it('the Lobby room on a phone: the share line whole', async () => {
    expect(await check(390, 844, preset, room)).toEqual({ problems: [], cut: [] })
  })
  // 667×375: a small phone on its side; 844×335: a big one under a bar (the gallery's) — Leave sat on the waiting line
  // 844×260 (F149): short enough that the card scrolls on every machine — its Leave / I'm ready row stays at its bottom
  // (kit.css) and the waiting line scrolls under it: words a scroll uncovers are not an overlap (uiProblems.mjs)
  it.each([[667, 375], [844, 335], [844, 260]])('the Lobby room on a phone on its side (%i×%i): nothing cut off or overlapping', async (width, height) => {
    expect(await check(width, height, preset, room)).toEqual({ problems: [], cut: [] })
  })
})

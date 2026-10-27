// @vitest-environment node
// HUD pieces keep room for longer words (0.37.0, F156: a translated game's words are ~40% longer), in a real browser,
// in all the styles. A bar with its name beside it (Bar width="s" showLabel) in a corner that gives way: the bar gets
// shorter, then moves under its name — it used to stick out of its plate, and "Time left" / "Score" covered its name.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Bar, ConnectionDot, Counter, Hud, HudText, Score, TimerRing } from './hud'
import { Row, Stack } from '../layout'
import { pseudo } from './words'

let browser: Browser
beforeAll(async () => { browser = await openBrowser() }, 60_000)
afterAll(async () => { await browser?.close() })

// The bar's plate in a box `width` px wide: does everything stay inside the plate, and the plate inside the box?
const longName = pseudo('Energy') // "[Éñéŕĝýéñ]": Energy in the fake long language (the gallery's HUD)
async function barIn(page: Page, preset: string, width: number, label: string) {
  const markup = renderToStaticMarkup(<div id="box" style={{ inlineSize: width }}><Bar label={label} value={40} variant="accent" width="s" showLabel /></div>)
  await showInStyle(page, preset, markup)
  return page.evaluate(() => {
    const box = document.querySelector('#box')!.getBoundingClientRect()
    const plate = document.querySelector('.kit-hud-chip')!.getBoundingClientRect()
    const bar = document.querySelector('.kit-progress')!.getBoundingClientRect()
    const name = document.querySelector('.kit-bar-label')!.getBoundingClientRect()
    return {
      inPlate: bar.right <= plate.right + 0.5 && name.right <= plate.right + 0.5,
      inBox: plate.right <= box.right + 0.5,
      under: bar.top >= name.bottom - 0.5, // the bar moved under its name
      barWidth: Math.round(bar.width),
    }
  })
}

// The gallery HUD's top row on a phone on its side at 200% text, in the long fake language: the vitals corner (two bars
// with a width, one named) beside the status (round · timer · score) and a wide right corner (coins, settings, the
// connection's sentence). The corner gives way to the middle — its bars get shorter, its name stays whole — and keeps
// that much room. Before (0.35.4, F147), past the text cap it could shrink to nothing: the bars stuck out over the
// middle and the timer and the score covered "Energy" (hud-*-phone-landscape-text-200 in the fake language).
type FindProblems = (options: { screenWidth: number; checkFocus: boolean }) => string[]
const uiProblems = '../uiProblems.mjs' // (no types; a plain path so TypeScript doesn't look for them)
const topRow = renderToStaticMarkup(
  <div style={{ position: 'fixed', inset: 0 }}>
    <Hud vitals={<Stack gap="xs"><Bar label={pseudo('Health')} icon="❤" value={70} variant="danger" width="m" /><Bar label={longName} value={40} variant="accent" width="s" showLabel /></Stack>}
      status={<Row gap="s"><HudText>{pseudo('Round 1')}</HudText><TimerRing seconds={20} total={20} label={pseudo('Time left')} /><Score value={120} compact words={{ score: pseudo('Score') }} /></Row>}
      currency={<Row gap="s"><Counter label={pseudo('Coins')} icon="🪙" value={250} /><ConnectionDot status="weak" words={{ weak: pseudo('Weak connection') }} /></Row>}
      onPause={() => {}} />
  </div>)

describe.each(Object.keys(presets))('a HUD on a phone on its side at double text size, in %s', (preset) => {
  it('the vitals corner gives way to the middle but keeps its bars and their name: nothing covers them', async () => {
    const findProblems = ((await import(/* @vite-ignore */ uiProblems)) as { findProblems: FindProblems }).findProblems
    const page = await browser.newPage({ viewport: { width: 844, height: 390 } })
    await showInStyle(page, preset, topRow)
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    const overlaps = (await page.evaluate(findProblems, { screenWidth: 844, checkFocus: false })).filter((p: string) => p.startsWith('overlap'))
    const inCorner = await page.evaluate(() => {
      const corner = document.querySelector('[data-slot="top-left"]')!.getBoundingClientRect()
      return [...document.querySelectorAll('[data-slot="top-left"] :is(.kit-progress, .kit-bar-label)')]
        .every((piece) => piece.getBoundingClientRect().right <= corner.right + 0.5)
    })
    await page.close()
    expect({ overlaps, inCorner }).toEqual({ overlaps: [], inCorner: true })
  })
})

describe.each(Object.keys(presets))('a bar with its name beside it, in %s', (preset) => {
  it('squeezed: the bar moves under its long name, both inside the plate, the plate inside its corner', async () => {
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } })
    const squeezed = await barIn(page, preset, 120, longName)
    await page.close()
    expect(squeezed).toMatchObject({ inPlate: true, inBox: true, under: true })
  })
  it('with room: the name and the full-length bar side by side, as before', async () => {
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } })
    const roomy = await barIn(page, preset, 360, 'Energy')
    const rem = await page.evaluate(() => {
      const probe = document.createElement('span')
      probe.style.cssText = 'position: absolute; inline-size: calc(4 * var(--hud-rem, 1rem))'
      document.querySelector('.kit-scope')!.append(probe)
      return Math.round(probe.getBoundingClientRect().width)
    })
    await page.close()
    expect(roomy).toEqual({ inPlate: true, inBox: true, under: false, barWidth: rem })
  })
  it('a little squeezed: the bar gets shorter beside its name first (it only moves under when even 2rem won\'t fit)', async () => {
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } })
    await barIn(page, preset, 360, 'Energy')
    const plate = await page.evaluate(() => document.querySelector('.kit-hud-chip')!.getBoundingClientRect().width)
    const full = await barIn(page, preset, 360, 'Energy')
    const shorter = await barIn(page, preset, Math.floor(plate) - 16, 'Energy')
    await page.close()
    expect(shorter).toMatchObject({ inPlate: true, inBox: true, under: false })
    expect(shorter.barWidth).toBeLessThan(full.barWidth)
  })
})

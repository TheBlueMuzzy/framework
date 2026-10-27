// @vitest-environment node
// HUD pieces keep room for longer words (0.37.0, F156: a translated game's words are ~40% longer), in a real browser,
// in all the styles. A bar with its name beside it (Bar width="s" showLabel) in a corner that gives way: the bar gets
// shorter, then moves under its name — it used to stick out of its plate, and "Time left" / "Score" covered its name.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Bar, Counter, Hud, HudText } from './hud'
import { Stack } from '../layout'
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

// A whole HUD's top row on a phone on its side: the vitals corner (two bars with a width, one named) beside a long status
// in the middle. The corner gives way — its bars get shorter, never under 2rem, its name whole — so the middle keeps its
// words on one line (before, a bar's plate was its full length at least: the corner never gave way and the middle
// wrapped onto more lines, pushing the turn banner onto the bottom row).
const longStatus = pseudo('Round 1 of 9')
const hud = renderToStaticMarkup(
  <div style={{ position: 'fixed', inset: 0 }}>
    <Hud vitals={<Stack gap="xs"><Bar label="Health" icon="❤" value={70} variant="danger" width="m" /><Bar label={longName} value={40} variant="accent" width="s" showLabel /></Stack>}
      status={<HudText>{longStatus}</HudText>} currency={<Counter label="Coins" icon="🪙" value={250} />} onPause={() => {}} />
  </div>)
async function topRow(page: Page, preset: string) {
  await showInStyle(page, preset, hud)
  return page.evaluate(() => {
    const line = document.querySelector('[data-slot="top"] .kit-text')!
    const lineHeight = parseFloat(getComputedStyle(line).lineHeight) || parseFloat(getComputedStyle(line).fontSize) * 1.2
    const corner = document.querySelector('[data-slot="top-left"]')!.getBoundingClientRect()
    const name = document.querySelector('.kit-bar-label')!.getBoundingClientRect()
    const bars = [...document.querySelectorAll('[data-slot="top-left"] .kit-progress')].map((bar) => bar.getBoundingClientRect())
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    return {
      oneLine: line.getBoundingClientRect().height < lineHeight * 1.5,
      nameInCorner: name.right <= corner.right + 0.5,
      barsInCorner: bars.every((bar) => bar.right <= corner.right + 0.5 && bar.width >= 2 * rem - 0.5),
    }
  })
}

describe.each(Object.keys(presets))('a HUD on a phone on its side, in %s', (preset) => {
  it('the vitals corner gives way to a long status: the status on one line, the bars and their name inside the corner', async () => {
    const page = await browser.newPage({ viewport: { width: 667, height: 375 } })
    const row = await topRow(page, preset)
    await page.close()
    expect(row).toEqual({ oneLine: true, nameInCorner: true, barsInCorner: true })
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

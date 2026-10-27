// @vitest-environment node
// HUD pieces keep room for longer words (0.37.0, F156: a translated game's words are ~40% longer), in a real browser,
// in all the styles. A bar with its name beside it (Bar width="s" showLabel) in a corner that gives way: the bar gets
// shorter, then moves under its name — it used to stick out of its plate, and "Time left" / "Score" covered its name.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Bar } from './hud'
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
})

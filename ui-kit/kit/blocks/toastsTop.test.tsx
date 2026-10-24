// @vitest-environment node
// --kit-toasts-top (0.33.0, F119): room kept clear above top toasts — a bar of the page's own over the game (the
// gallery's Menu + style bar: on a phone its toasts sat on those buttons). Unset: exactly where they were.
// Real browser, all 5 styles.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'

let browser: Browser
beforeAll(async () => { browser = await openBrowser() }, 60_000)
afterAll(async () => { await browser?.close() })

const stack = (place: string) => `<div popover="manual" class="kit-toasts" data-place="${place}" role="status">
  <div class="kit-panel kit-stack kit-toast" data-gap="xs">Sam joined the room</div></div>`

// The top of the toast stack (px from the window's top), with --kit-toasts-top set to `room` (or unset)
async function topOf(preset: string, place: string, room?: string) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await showInStyle(page, preset, stack(place))
  const top = await page.evaluate((room) => {
    if (room) document.documentElement.style.setProperty('--kit-toasts-top', room)
    const el = document.querySelector('.kit-toasts') as HTMLElement
    el.showPopover()
    return el.getBoundingClientRect().top
  }, room)
  await page.close()
  return top
}

describe.each(Object.keys(presets))('--kit-toasts-top in %s', (preset) => {
  it('moves top toasts down by exactly the room asked for', async () => {
    const before = await topOf(preset, 'top')
    expect(await topOf(preset, 'top', '3.5rem')).toBeCloseTo(before + 56, 0)
  })
  it('leaves bottom toasts where they were', async () => {
    expect(await topOf(preset, 'bottom', '3.5rem')).toBeCloseTo(await topOf(preset, 'bottom'), 0)
  })
})

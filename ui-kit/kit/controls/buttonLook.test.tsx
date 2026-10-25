// @vitest-environment node
// Button looks in a real browser (0.27.0): a danger button is lit like primary in a style that glows (Neon; Dark
// console and Fantasy since 0.34.0), in its own red — so a − / + pair (danger / primary) looks like a pair. Styles
// without a glow stay unlit.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Button } from './Button'

let browser: Browser, page: Page
beforeAll(async () => {
  browser = await openBrowser()
  page = await browser.newPage({ viewport: { width: 390, height: 844 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

const pair = renderToStaticMarkup(<>
  <Button variant="danger" icon aria-label="Less">−</Button><Button variant="primary" icon aria-label="More">+</Button>
</>)
const filters = () => page.$$eval('.kit-button', (els) => els.map((el) => getComputedStyle(el).filter))

describe.each(Object.keys(presets))('− / + in %s', (preset) => {
  it('danger is lit exactly when primary is, each in its own colour', async () => {
    await showInStyle(page, preset, pair)
    const [danger, primary] = await filters()
    expect(danger === 'none').toBe(primary === 'none')
    if (primary !== 'none') {
      expect(danger).toContain('drop-shadow')
      // in this style's own danger red (Neon 255 77 109), not its primary colour — read from its glow-danger setting
      // (0.34.0: Dark console and Fantasy glow too; this line held Neon's red only)
      const red = String(presets[preset]['glow-danger']).match(/rgb\((\d+) (\d+) (\d+)/)!.slice(1).join(', ')
      expect(danger).toContain(red)
      expect(primary).not.toContain(red)
    }
  })
})

it('Neon is the style that glows: its − and + are both lit', async () => {
  await showInStyle(page, 'neon', pair)
  expect((await filters()).every((f) => f.includes('drop-shadow'))).toBe(true)
})

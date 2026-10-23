// @vitest-environment node
// Button looks in a real browser (0.27.0): a danger button is lit like primary in a style that glows (Neon), in its
// own red — so a − / + pair (danger / primary) looks like a pair. Styles without a glow stay unlit.
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
      expect(danger).toContain('255, 77, 109') // Neon's danger red, not its cyan
    }
  })
})

it('Neon is the style that glows: its − and + are both lit', async () => {
  await showInStyle(page, 'neon', pair)
  expect((await filters()).every((f) => f.includes('drop-shadow'))).toBe(true)
})

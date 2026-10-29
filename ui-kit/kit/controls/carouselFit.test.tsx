// @vitest-environment node
// F162 (0.38.0): the parts page's Carousel at 200% text in the fake language — a slide's row ("[Lockdown]" + its
// line) was wider than the carousel's window, so the window cut it off on both sides (the slide is centred). A slide
// is never wider than the window: its words wrap, and a word wider than the window breaks, as a .kit-text's does.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'playwright'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Row } from '../layout'
import { Carousel } from './Carousel'
import { Text } from './Text'

let browser: Browser
beforeAll(async () => { browser = await openBrowser() }, 60_000)
afterAll(async () => { await browser?.close() })

describe('A Carousel slide wider than its window', () => {
  it.each(['clean', 'pixel'])('%s at 200% text on a phone: the words stay inside the window', async (preset) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await showInStyle(page, preset, renderToStaticMarkup(<Carousel label="Highlights">
      <Row gap="s"><Text kind="label">[Ļöçķðöŵñļöçķðöŵñ]</Text><Text kind="caption">[Ɓļûéƀļ: 9 ɱöṽéšɱö → 2]</Text></Row>
      <Row gap="s"><Text kind="label">Two</Text></Row></Carousel>))
    const past = await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
      const view = document.querySelector('.kit-carousel-view')!.getBoundingClientRect()
      const r = document.createRange()
      r.selectNodeContents(document.querySelector('.kit-carousel-item[data-current]')!)
      const lines = [...r.getClientRects()]
      return Math.max(view.left - Math.min(...lines.map((q) => q.left)), Math.max(...lines.map((q) => q.right)) - view.right)
    })
    expect(past).toBeLessThanOrEqual(0.5)
    await page.close()
  })
})

// @vitest-environment node
// F147 (0.35.4): a ◀ value ▶ picker whose longest value won't fit between its arrows ("Accessibil / ity" in Settings'
// tab picker at 200% text in Cozy, Neon, Pixel, Cartoon — wider fonts than Clean's) puts the value on its own line,
// the arrows under it (fitPicker) — never a word broken in the middle. At 100% text it stays on one line.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'playwright'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { fitPicker } from './ArrowPicker'
import { Selector } from './Selector'

let browser: Browser
beforeAll(async () => { browser = await openBrowser() }, 60_000)
afterAll(async () => { await browser?.close() })

const tabs = ['Audio', 'Display', 'Accessibility', 'About']
const picker = renderToStaticMarkup(<Selector label="Settings" options={tabs} value="Audio" onChange={() => {}} />)

describe.each(['cozy', 'pixel'])('the tab picker in %s, 300px wide', (preset) => {
  it.each([['100%', ''], ['200%', 'stack']])('at %s text: data-fit="%s", every word whole', async (textSize, fit) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await showInStyle(page, preset, `<div style="inline-size: 300px; display: flex; flex-direction: column">${picker}</div>`)
    const t = await page.evaluate(`(() => {
      document.documentElement.style.fontSize = '${textSize}'
      const box = document.querySelector('.kit-picker')
      box.style.inlineSize = '100%'
      ;(${fitPicker.toString()})(box)
      // every sizer's words on as many lines as they have words (no word broken in the middle)
      const broken = [...box.querySelectorAll('.kit-picker-sizer')].filter((el) => {
        const r = document.createRange(); r.selectNodeContents(el)
        return new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size > el.textContent.split(' ').length
      }).map((el) => el.textContent)
      return { fit: box.dataset.fit, broken }
    })()`)
    expect(t).toEqual({ fit, broken: [] })
    await page.close()
  })
})

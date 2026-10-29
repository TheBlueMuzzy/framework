// @vitest-environment node
// F162 (0.38.0): Settings on a phone on its side at 200% text (Cartoon, Cozy, Pixel) — the Accessibility tab's list
// was squeezed to 103 px for rows of 72 px: 1.4 rows at a time. Every tab's page shares one cell that gave up all its
// height; now each page keeps two of its list's rows (the floor ScrollArea measures), and past that the card scrolls
// as one. Measured in a real browser with the kit's CSS; ScrollArea's and Settings' own measuring run by hand, as the
// page here is static markup. The screen: the gallery's game area on an 844×390 phone (its own bar takes ~75 px) —
// a phone on its side with the browser's bar showing.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'playwright'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { measureContents } from '../controls/ScrollArea'
import { keepPageFloors, Settings } from './Settings'

let browser: Browser
beforeAll(async () => { browser = await openBrowser() }, 60_000)
afterAll(async () => { await browser?.close() })

describe('Settings on a phone on its side at 200% text', () => {
  it.each(['cartoon', 'cozy', 'pixel'])('%s: the current tab shows two of its rows at a time', async (preset) => {
    const page = await browser.newPage({ viewport: { width: 844, height: 315 } })
    await showInStyle(page, preset, renderToStaticMarkup(<Settings version="v0.1.0.12" load={() => ({})} save={() => {}} />))
    const t = await page.evaluate(`(() => {
      document.documentElement.style.fontSize = '200%'
      for (const list of document.querySelectorAll('.kit-scroll')) (${measureContents.toString()})(list)
      ;(${keepPageFloors.toString()})(document.querySelector('.kit-settings-pages'))
      const list = document.querySelector('.kit-settings-page[data-current] .kit-scroll')
      let rows = [...list.children]
      while (rows.length === 1) rows = [...rows[0].children]
      const two = rows[1].getBoundingClientRect().bottom - rows[0].getBoundingClientRect().top
      return { list: list.clientHeight, two, rows: rows.map((r) => Math.round(r.getBoundingClientRect().height)).join(' '), card: document.querySelector('.kit-panel').clientHeight }
    })()`) as { list: number; two: number }
    expect(t.list, JSON.stringify(t)).toBeGreaterThanOrEqual(t.two - 1)
    await page.close()
  })
})

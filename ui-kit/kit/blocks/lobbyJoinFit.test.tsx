// @vitest-environment node
// F162 (0.38.0): Lobby's join card on a phone on its side at 200% text in the fake language (Neon) — the code boxes +
// Join kept their one line and took the card's width, so your name + Create had ~150 px: "[ÇŔÉÁŢÉÇŔ" ran 17 px past
// Create's sides. (It had been hidden: the squeezed list scrolled it out of sight.) Now the left column never goes under
// its widest word; Join moves under the boxes only when there's no room for both on one line.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'playwright'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Lobby } from './online'

let browser: Browser
beforeAll(async () => { browser = await openBrowser() }, 60_000)
afterAll(async () => { await browser?.close() })

const join = (words = {}) => renderToStaticMarkup(<Lobby name="Muzzy" onNameChange={() => {}} onCreate={() => {}} onJoin={() => {}}
  onStart={() => {}} onLeave={() => {}} words={words} />)
const long = { title: '[Þļáýþļ öñļíñéöñ]', create: '[Çŕéáţéçŕ áá ŕööɱŕö]', or: '[öŕö ĵöíñĵö áá ƒŕíéñðƒŕ]', join: '[Ĵöíñĵö]', name: '[Ýöûŕýö ñáɱéñá]' }

// Every button's words inside it, and the code row inside its cell
const fits = () => `(() => {
  const out = []
  for (const b of document.querySelectorAll('.kit-scroll .kit-button')) if (b.scrollWidth > b.clientWidth + 1) out.push(b.textContent + ' ' + (b.scrollWidth - b.clientWidth) + ' px past')
  const row = document.querySelector('.kit-scroll .kit-row')
  if (row.scrollWidth > row.clientWidth + 1) out.push('the code row ' + (row.scrollWidth - row.clientWidth) + ' px past')
  return { out, joinUnder: row.lastElementChild.getBoundingClientRect().top > row.firstElementChild.getBoundingClientRect().bottom - 1 }
})()`

describe('Lobby join on a phone on its side', () => {
  it.each(['neon', 'pixel', 'clean'])('%s at 200% text in a long language: Create\'s words stay inside it', async (preset) => {
    const page = await browser.newPage({ viewport: { width: 844, height: 315 } })
    await showInStyle(page, preset, join(long))
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    const t = await page.evaluate(fits()) as { out: string[] }
    expect(t.out).toEqual([])
    await page.close()
  })

  it('in English at 100%: the code boxes and Join stay on one line', async () => {
    const page = await browser.newPage({ viewport: { width: 844, height: 315 } })
    await showInStyle(page, 'neon', join())
    const t = await page.evaluate(fits()) as { out: string[]; joinUnder: boolean }
    expect(t).toEqual({ out: [], joinUnder: false })
    await page.close()
  })
})

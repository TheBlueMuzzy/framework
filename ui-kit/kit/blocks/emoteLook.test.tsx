// @vitest-environment node
// Emote looks in a real browser, in all 5 styles (0.28.0): the speech bubble is the SAME size whichever phrase it
// shows (fixed from the start — sized by the longest), its words never touch its edge, it has the Callout's edge and
// corners; the picker's buttons are real tap targets (44px+), two columns on a phone and one row on a wide screen.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Button, Text } from '../controls'

let browser: Browser, page: Page
beforeAll(async () => {
  browser = await openBrowser()
  page = await browser.newPage({ viewport: { width: 360, height: 780 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

const phrases = ['Hello!', 'Well played!', 'Thanks!', 'Wow!', 'Oops!', 'Thinking…', 'Good game!']
// The parts' own markup (as SpeechBubble / EmotePicker draw it), placed in the page instead of a popover so the
// static page shows it; data-ready = placed, like the live one
const layer = (inner: string) => `<div class="kit-callout-layer kit-speech-layer" data-ready style="display: grid; position: static; inline-size: max-content">${inner}</div>`
const bubble = (text: string) => layer(renderToStaticMarkup(<div className="kit-callout kit-speech" data-text={text}>
  <div className="kit-callout-body kit-speech-body">
    {phrases.map((p) => <span key={p} className="kit-speech-sizer"><Text kind="label">{p}</Text></span>)}
    <span className="kit-speech-text"><Text kind="label">{text}</Text></span>
  </div>
  <span className="kit-callout-tip" />
</div>))
const picker = `<div class="kit-callout-layer" data-ready style="display: grid; position: static">${renderToStaticMarkup(
  <div className="kit-callout kit-pointed kit-emote-picker" style={{ '--kit-emote-count': phrases.length } as React.CSSProperties}>
    <div className="kit-callout-body"><div className="kit-emote-grid">{phrases.map((p) => <span key={p} className="kit-emote-slot"><Button variant="secondary" compact className="kit-emote-button">{p}</Button><span className="kit-emote-ring" /></span>)}</div></div>
  </div>)}</div>`

describe.each(Object.keys(presets))('Emotes in %s', (preset) => {
  it('the bubble is the same size for "Wow!" and "Well played!", and its words keep room from every edge', async () => {
    await showInStyle(page, preset, `<div style="display: flex; gap: 24px; flex-wrap: wrap">${bubble('Wow!')}${bubble('Well played!')}<div class="kit-callout" id="plain">Tip</div></div>`)
    const plain = await page.$eval('#plain', (el) => { const s = getComputedStyle(el); return `${s.borderTopLeftRadius} ${s.borderTopWidth} ${s.borderTopColor} ${s.backgroundColor}` })
    const look = await page.$eval('.kit-speech', (el) => { const s = getComputedStyle(el); return `${s.borderTopLeftRadius} ${s.borderTopWidth} ${s.borderTopColor} ${s.backgroundColor}` })
    expect(look).toBe(plain) // a Callout's corners, edge and fill
    const looks = await page.$$eval('.kit-speech', (els) => els.map((el) => {
      const box = el.getBoundingClientRect()
      const words = el.querySelector('.kit-speech-text .kit-text')!
      const range = document.createRange(); range.selectNodeContents(words)
      const w = range.getBoundingClientRect()
      return { size: `${Math.round(box.width)}×${Math.round(box.height)}`, room: Math.min(w.left - box.left, box.right - w.right, w.top - box.top, box.bottom - w.bottom) }
    }))
    expect(looks[0].size).toBe(looks[1].size)
    expect(Number(looks[0].size.split('×')[0])).toBeGreaterThan(60) // really laid out
    for (const l of looks) expect(l.room).toBeGreaterThanOrEqual(8) // breathing room on every side (gap-m)
  })

  it('the picker: 44px+ buttons, two columns on a 360 phone, one row at 1440', async () => {
    await page.setViewportSize({ width: 360, height: 780 })
    await showInStyle(page, preset, picker)
    const phone = await page.$$eval('.kit-emote-button', (els) => els.map((el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left), h: r.height, right: r.right } }))
    expect(Math.min(...phone.map((b) => b.h))).toBeGreaterThanOrEqual(44)
    expect(new Set(phone.map((b) => b.left)).size).toBe(2)
    expect(Math.max(...phone.map((b) => b.right))).toBeLessThanOrEqual(360 - 16) // inside the phone, with the edge room
    await page.setViewportSize({ width: 1440, height: 900 })
    await showInStyle(page, preset, picker)
    const wide = await page.$$eval('.kit-emote-button', (els) => els.map((el) => Math.round(el.getBoundingClientRect().top)))
    expect(new Set(wide).size).toBe(1)
    await page.setViewportSize({ width: 360, height: 780 })
  })
})

// The page's one live region (0.32.0, liveRegion() — last on <body>) under a full-height game: it must not give the
// page a 1 px scroll (it did in the gallery before `.kit-live` pulled it up — F116)
describe('the live region on a full-height page', () => {
  it('adds no page scroll and stays 1 px, unseen', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await showInStyle(page, 'clean', '')
    const after = await page.evaluate(() => {
      document.body.replaceChildren()
      const game = document.body.appendChild(document.createElement('div'))
      game.style.blockSize = '100vh'
      const region = document.body.appendChild(document.createElement('div'))
      region.className = 'kit-sr-only kit-live'
      region.textContent = 'The Veteran: Found some scraps. Left them in your panel.'
      const r = region.getBoundingClientRect()
      return { scroll: document.documentElement.scrollHeight, view: innerHeight, wide: document.documentElement.scrollWidth, size: [r.width, r.height] }
    })
    expect(after.scroll).toBe(after.view)
    expect(after.wide).toBe(390)
    expect(after.size).toEqual([1, 1])
    await page.setViewportSize({ width: 360, height: 780 })
  })
})

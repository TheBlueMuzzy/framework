// @vitest-environment node
// Card looks in a real browser, in all 5 styles (0.27.0): tone="success" keeps the card exactly the plain card's size
// and paints its edge in the style's success colour. Cards are fixed size, so a highlight may never grow one.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle, sizesOf } from '../stylePage.test-util.mjs'
import { Card } from './Card'

let browser: Browser, page: Page
beforeAll(async () => {
  browser = await openBrowser()
  page = await browser.newPage({ viewport: { width: 390, height: 844 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

// The same words in every card, so only the look differs. Each sits in its own fixed-width cell.
const body = <><span className="kit-text" data-kind="body">Drips land 10% slower</span><span className="kit-text" data-kind="caption">Cost 120</span></>
const cards = renderToStaticMarkup(<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 7.5rem)', gap: '1rem', alignItems: 'start' }}>
  <Card title="Slow drip">{body}</Card>
  <Card title="Slow drip" tone="success">{body}</Card>
  <Card title="Slow drip" selected onClick={() => {}}>{body}</Card>
</div>)

const hex = (rgb: string) => '#' + (rgb.match(/\d+/g) ?? []).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('')

describe.each(Object.keys(presets))('Card in %s', (preset) => {
  it('tone="success": exactly the plain card\'s size, its edge in the success colour', async () => {
    await showInStyle(page, preset, cards)
    const [plain, success, selected] = await sizesOf(page, '.kit-card')
    expect(Number(plain.split('×')[1])).toBeGreaterThan(60) // really laid out (not 0×0)
    expect(success).toBe(plain)
    expect(selected).toBe(plain)
    const edge = await page.$eval('.kit-card[data-tone="success"]', (el) => {
      const s = getComputedStyle(el)
      return { border: s.borderTopColor, outline: s.outlineColor, outlineStyle: s.outlineStyle }
    })
    const green = String(presets[preset].success).toLowerCase()
    expect(hex(edge.border)).toBe(green)
    expect(hex(edge.outline)).toBe(green)
    expect(edge.outlineStyle).toBe('solid')
  })
})

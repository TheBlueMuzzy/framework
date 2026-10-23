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
  <Card title="Slow drip" locked onClick={() => {}}>{body}</Card>
</div>)

// WCAG contrast of two #rrggbb colours (the same sum as styles.test.ts)
const luminance = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
const contrast = (a: string, b: string) => { const [l, d] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (l + 0.05) / (d + 0.05) }
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

  it('locked: exactly the open card\'s size, greyed, and every line of its text still reads at 4.5:1', async () => {
    await showInStyle(page, preset, cards)
    const [plain, , , locked] = await sizesOf(page, '.kit-card')
    expect(locked).toBe(plain)
    const looks = await page.$eval('.kit-card[data-locked]', (card) => {
      const paint = getComputedStyle(card)
      const words = [card.querySelector('.kit-card-title')!, ...card.querySelectorAll('.kit-text')]
      return { background: paint.backgroundColor, border: paint.borderTopStyle, texts: words.map((el) => getComputedStyle(el).color) }
    })
    expect(looks.border).toBe('dashed')
    expect(looks.texts).toHaveLength(3)
    for (const text of looks.texts) {
      expect(hex(text)).toBe(String(presets[preset].muted).toLowerCase()) // greyed: the style's quiet text colour
      expect(contrast(hex(text), hex(looks.background))).toBeGreaterThanOrEqual(4.5)
    }
  })
})

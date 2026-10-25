// @vitest-environment node
// MenuHeader beside an action, in a real browser, in all 5 styles (0.27.0): Goops' Upgrades dialog — "UPGRADES" with a
// compact "RESPEC" on the right — rendered "UPGRAD / ES" on 360 / 390 wide phones. Now the title drops a step (heading
// size) before it wraps, and never breaks inside a word; on a wide screen it keeps its title size.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Button } from '../controls'
import { Modal } from './dialogs'
import { fitMenuTitle } from './MenuHeader'

let browser: Browser
beforeAll(async () => { browser = await openBrowser() }, 60_000)
afterAll(async () => { await browser?.close() })

const upgrades = (onBack: boolean) => renderToStaticMarkup(<Modal title="UPGRADES" onBack={onBack ? () => {} : undefined}
  headerAction={<Button variant="secondary" compact>RESPEC</Button>} actions={<Button>Done</Button>}>
  <p>Spend your goop on better machines.</p>
</Modal>)

// What the title did: its size step, how many lines each word sits on, and whether it fits its box
async function titleOn(page: Page, preset: string, markup: string, { alone = false, textSize = '100%' } = {}) {
  await showInStyle(page, preset, markup)
  return page.evaluate(`(() => {
    document.documentElement.style.fontSize = '${textSize}'
    const box = document.querySelector('.kit-menu-header-title')
    ;(${fitMenuTitle.toString()})(box, ${!alone})
    const words = box.firstElementChild, text = words.firstChild
    const linesOf = (start, end) => { const r = document.createRange(); r.setStart(text, start); r.setEnd(text, end)
      return new Set([...r.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top))).size }
    const wordLines = []
    for (const m of text.data.matchAll(/\\S+/g)) wordLines.push(linesOf(m.index, m.index + m[0].length))
    const action = (box.nextElementSibling ?? box).getBoundingClientRect()
    return { fit: box.dataset.fit, wordLines, actionBelow: action.top >= box.getBoundingClientRect().bottom - 1, overflows: words.scrollWidth > box.clientWidth + 1,
      size: getComputedStyle(words).fontSize, heading: getComputedStyle(document.documentElement).getPropertyValue('--text-heading'),
      body: getComputedStyle(document.documentElement).getPropertyValue('--text-body') }
  })()`) as Promise<{ fit: string; wordLines: number[]; actionBelow: boolean; overflows: boolean; size: string; heading: string; body: string }>
}

describe.each(Object.keys(presets))('MenuHeader title beside an action in %s', (preset) => {
  it.each([[360, 780], [390, 844]])('"UPGRADES" + compact RESPEC at %ix%i: never split, a step smaller if it must', async (width, height) => {
    const page = await browser.newPage({ viewport: { width, height } })
    for (const back of [false, true]) {
      const t = await titleOn(page, preset, upgrades(back))
      expect(t.wordLines, `with ‹: ${back}`).toEqual([1]) // the word sits on ONE line
      expect(t.overflows).toBe(false)
      if (!back) expect(['', 'small']).toContain(t.fit) // beside the action alone, one step is enough
      // a ‹ AND the action on a 360 phone in Pixel's wide font: the action moves under the title
      if (t.fit === 'tight') expect(t.actionBelow).toBe(true)
      else expect(t.actionBelow).toBe(false)
      if (t.fit === 'small') expect(parseFloat(t.size) / 16).toBeCloseTo(parseFloat(t.heading), 2) // the style's heading size
      if (t.fit === 'smaller') expect(parseFloat(t.size) / 16).toBeCloseTo(parseFloat(t.body), 2) // body size (never under 18px)
    }
    await page.close()
  })

  it('on a desktop window it keeps its title size', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const t = await titleOn(page, preset, upgrades(true))
    expect(t.fit).toBe('')
    expect(t.wordLines).toEqual([1])
    await page.close()
  })

  // F145 (0.35.1): a title ALONE — Reconnecting's "Reconnecti / ng…" on a 390 phone at 200% text. A word wider than
  // its line drops the title a step instead of splitting; at 100% it keeps its title size (and still wraps between words)
  it('a title alone at 200% text: never split; at 100%: title size', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const alone = (title: string) => renderToStaticMarkup(<Modal title={title} actions={<Button>Quit</Button>}><p>Hold on.</p></Modal>)
    const big = await titleOn(page, preset, alone('Reconnecting…'), { alone: true, textSize: '200%' })
    expect(big.overflows).toBe(false)
    // Clean / Cozy / Cartoon / Console: a step or two down and whole. A wide font (Pixel, Neon, Fantasy) is wider than
    // the line even at body size — the floor at 200% — so there, and only there, the word may break ("split")
    if (['clean', 'cozy', 'cartoon', 'console'].includes(preset)) {
      expect(big.wordLines).toEqual([1])
      expect(['small', 'smaller']).toContain(big.fit)
    } else expect(['small', 'smaller', 'split']).toContain(big.fit)
    const normal = await titleOn(page, preset, alone('Reconnecting…'), { alone: true })
    expect(normal.fit).toBe('')
    const words = await titleOn(page, preset, alone('Choose your next big adventure'), { alone: true })
    expect(words.fit).toBe('') // many short words: wraps between them at full size, as before
    expect(Math.max(...words.wordLines)).toBe(1)
    await page.close()
  })
})

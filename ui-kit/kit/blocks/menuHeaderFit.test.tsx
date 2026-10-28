// @vitest-environment node
// MenuHeader beside an action, in a real browser, in all 5 styles (0.27.0): Goops' Upgrades dialog — "UPGRADES" with a
// compact "RESPEC" on the right — rendered "UPGRAD / ES" on 360 / 390 wide phones. Now the title drops a step (heading
// size) before it wraps, and never breaks inside a word; on a wide screen it keeps its title size.
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser, Page } from 'playwright'
import { presets } from '../styles'
import { openBrowser, showInStyle } from '../stylePage.test-util.mjs'
import { Button, Text } from '../controls'
import { Modal } from './dialogs'
import { fitMenuTitle } from './MenuHeader'
import { Lobby, SeatPicker } from './online'

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
    // is the longest word wider than the box even at body size (the floor)? Depends on the fonts this computer has —
    // GitHub's Linux draws Clean in a wider fallback than Windows (v0.21 /deliver: its Checks went red)
    const probe = words.cloneNode(true)
    probe.style.cssText = 'position: absolute; white-space: nowrap; font-size: var(--text-body)'
    probe.textContent = text.data.split(/\\s+/).reduce((a, b) => (b.length > a.length ? b : a), '')
    box.append(probe)
    const bodyWide = probe.getBoundingClientRect().width > box.clientWidth + 0.5
    probe.remove()
    return { fit: box.dataset.fit, bodyWide, wordLines, actionBelow: action.top >= box.getBoundingClientRect().bottom - 1, overflows: words.scrollWidth > box.clientWidth + 1,
      size: getComputedStyle(words).fontSize, heading: getComputedStyle(document.documentElement).getPropertyValue('--text-heading'),
      body: getComputedStyle(document.documentElement).getPropertyValue('--text-body') }
  })()`) as Promise<{ fit: string; bodyWide: boolean; wordLines: number[]; actionBelow: boolean; overflows: boolean; size: string; heading: string; body: string }>
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
    // A step or two down and whole — unless the word is wider than the line even at body size (the floor at 200%: a
    // wide font — Pixel, Neon, Fantasy, or a wide fallback font on another computer); there, and only there, it may
    // break ("split")
    if (!big.bodyWide) {
      expect(big.wordLines).toEqual([1])
      expect(['small', 'smaller']).toContain(big.fit)
    } else expect(big.fit).toBe('split')
    const normal = await titleOn(page, preset, alone('Reconnecting…'), { alone: true })
    expect(normal.fit).toBe('')
    const words = await titleOn(page, preset, alone('Choose your next big adventure'), { alone: true })
    expect(words.fit).toBe('') // many short words: wraps between them at full size, as before
    expect(Math.max(...words.wordLines)).toBe(1)
    await page.close()
  })
})

// F162 (0.38.0): Settings in Pixel at 200% text on a phone, in the fake language — a ‹, the title and the version on
// the right. The title went "tight" (its own line, heading size), but one word was wider than the whole row even there,
// so it ran past the card's side and its last letter ("]") was cut off. Now it takes the last step instead: body size,
// on its own line, and only a word wider than the row even then may break.
describe('a title too wide for its whole row, beside a ‹ and an action', () => {
  it.each([[390, 844], [360, 780]])('Pixel at double text size, %ix%i: the title stays inside its row', async (width, height) => {
    const page = await browser.newPage({ viewport: { width, height } })
    const markup = renderToStaticMarkup(<Modal title="[Šéţţíñĝššéţ]" onBack={() => {}}
      headerAction={<Text kind="caption">v0.1.0.12</Text>} actions={<Button>Done</Button>}><p>Audio</p></Modal>)
    await showInStyle(page, 'pixel', markup)
    const t = await page.evaluate(`(() => {
      document.documentElement.style.fontSize = '200%'
      const box = document.querySelector('.kit-menu-header-title')
      ;(${fitMenuTitle.toString()})(box, true)
      const row = box.parentElement.getBoundingClientRect()
      const r = document.createRange(); r.selectNodeContents(box.firstElementChild)
      const right = Math.max(...[...r.getClientRects()].map((q) => q.right))
      return { fit: box.dataset.fit, past: right - row.right }
    })()`) as { fit: string; past: number }
    expect(t.past, `fit "${t.fit}"`).toBeLessThanOrEqual(1)
    await page.close()
  })
})

// F145 (0.35.1): the end screens' titles fit the same way (useTitleFit) — the art Game over's frame left its display
// title "Ga / me / ove / r" at 200% text. In a narrow report it drops a step instead; at 100% it keeps its size.
describe('End-screen title (Game over, display size) in a narrow report', () => {
  it.each(['100%', '200%'])('at %s text: whole words', async (textSize) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await showInStyle(page, 'clean', `<div style="inline-size: 160px; display: flex; flex-direction: column">${renderToStaticMarkup(
      <span className="kit-end-title"><Text kind="display">Game over</Text></span>)}</div>`)
    const t = await page.evaluate(`(() => {
      document.documentElement.style.fontSize = '${textSize}'
      const box = document.querySelector('.kit-end-title')
      ;(${fitMenuTitle.toString()})(box, false)
      const text = box.firstElementChild.firstChild, out = []
      for (const m of text.data.matchAll(/\\S+/g)) {
        const r = document.createRange(); r.setStart(text, m.index); r.setEnd(text, m.index + m[0].length)
        out.push(new Set([...r.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top))).size)
      }
      return { fit: box.dataset.fit, wordLines: out }
    })()`) as { fit: string; wordLines: number[] }
    expect(t.wordLines).toEqual([1, 1])
    // 200%: a step or two down (how many depends on the computer's fonts — GitHub's Linux needed two); 100%: its size
    if (textSize === '100%') expect(t.fit).toBe('')
    else expect(['small', 'smaller']).toContain(t.fit)
    await page.close()
  })
})

// F147 (0.35.4): the Seat picker's title ("Game in progr / ess" in Neon and Pixel at 200% text) and the Lobby room's
// ("Roo / m" beside Copy in Cozy) fit the same way — a .kit-fit-title box (no pop)
describe('Seat picker and Lobby room titles fit like the end screens\'', () => {
  it('both titles sit in a fitted box', () => {
    const noop = () => {}
    expect(renderToStaticMarkup(<SeatPicker seats={[{ id: 'z', name: 'Zippy' }]} onPick={noop} onCancel={noop} />))
      .toContain('<span class="kit-fit-title"><h2 class="kit-text" data-kind="title">Game in progress</h2></span>')
    expect(renderToStaticMarkup(<Lobby roomCode="QX2T" onCreate={noop} onJoin={noop} onStart={noop} onLeave={noop} />))
      .toContain('<span class="kit-fit-title"><h2 class="kit-text" data-kind="title">Room <span translate="no">QX2T</span></h2></span>') // (F156: the code is never translated)
  })

  it.each(['neon', 'pixel'])('in %s at 200% text, "progress" stays whole: the title drops a step', async (preset) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await showInStyle(page, preset, `<div style="inline-size: 300px; display: flex; flex-direction: column">${renderToStaticMarkup(
      <span className="kit-fit-title"><Text kind="title">Game in progress</Text></span>)}</div>`)
    const t = await page.evaluate(`(() => {
      document.documentElement.style.fontSize = '200%'
      const box = document.querySelector('.kit-fit-title')
      ;(${fitMenuTitle.toString()})(box, false)
      const text = box.firstElementChild.firstChild, out = []
      for (const m of text.data.matchAll(/\\S+/g)) {
        const r = document.createRange(); r.setStart(text, m.index); r.setEnd(text, m.index + m[0].length)
        out.push(new Set([...r.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top))).size)
      }
      return { fit: box.dataset.fit, wordLines: out }
    })()`) as { fit: string; wordLines: number[] }
    expect(t.wordLines).toEqual([1, 1, 1])
    expect(['small', 'smaller']).toContain(t.fit)
    await page.close()
  })
})

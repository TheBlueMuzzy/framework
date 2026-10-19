// @vitest-environment node
// findProblems in a real browser (Playwright's own Chromium) on small hand-made pages: what must be caught, and what a
// correct page must NOT be blamed for.
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { findProblems } from './uiProblems.mjs'
import { watchFixedSize } from './fixedSize.ts'

let browser, page
beforeAll(async () => {
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  page = await browser.newPage({ viewport: { width: 400, height: 400 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

const problemsOn = async (html) => {
  await page.setContent(`<!doctype html><style>body{margin:0;font:16px sans-serif} button{width:60px;height:48px}</style>${html}`)
  return page.evaluate(findProblems, { screenWidth: 400, checkFocus: false })
}

describe('findProblems — overlap', () => {
  it('catches words sliding over other words, even when they ignore the pointer (HUD words)', async () => {
    const found = await problemsOn(`
      <div style="pointer-events:none;position:absolute;left:10px;top:10px">Score 120</div>
      <div style="pointer-events:none;position:absolute;left:30px;top:12px">Cracks 3 / 10</div>`)
    expect(found).toContain('overlap: "Score 120" × "Cracks 3 / 10"')
  })

  it('a list row scrolled out of its scroll area does not "overlap" the button under the area', async () => {
    const rows = Array.from({ length: 12 }, (_, i) => `<div style="height:40px">Row number ${i + 1}</div>`).join('')
    const found = await problemsOn(`
      <div style="position:absolute;left:0;top:0;width:300px;height:200px;overflow-y:auto">${rows}</div>
      <button style="position:absolute;left:20px;top:220px">Play again</button>`)
    expect(found.filter((p) => p.startsWith('overlap'))).toEqual([])
  })

  it('a dialog over the HUD does not make the HUD words "overlap" the dialog', async () => {
    const found = await problemsOn(`
      <div style="position:absolute;left:10px;top:10px">Score 120</div>
      <div style="position:absolute;left:0;top:0;width:400px;height:200px;background:#222;color:#fff">
        <p style="margin:12px 14px">Paused — take a breath</p></div>`)
    expect(found.filter((p) => p.startsWith('overlap'))).toEqual([])
  })
})

// 0.21.0 — the quality bars: faint text, things touching their box's edge, cards that grow
const only = (kind, found) => found.filter((p) => p.startsWith(`${kind}:`))
const card = 'background:#fff;border:2px solid #333;border-radius:12px;padding:12px;width:220px'
describe('findProblems — quality bars', () => {
  it('a clean card passes: dark words, a badge and an avatar with room on every side', async () => {
    const found = await problemsOn(`<div style="background:#eee;padding:20px">
      <div style="${card}"><p style="margin:0;color:#222">Daily run</p>
        <span class="kit-badge" style="display:inline-block;background:#336;color:#fff;padding:2px 8px">NEW</span>
        <span class="kit-avatar" role="img" aria-label="Ada" style="display:inline-block;width:44px;height:44px;background:#933"></span></div></div>`)
    expect([...only('faint', found), ...only('edge', found), ...only('grows', found)]).toEqual([])
  })

  it('faint text is flagged once, with its ratio — big text needs less, a see-through colour counts', async () => {
    const found = await problemsOn(`<div style="background:#fff;padding:20px">
      <p style="color:#bbb;margin:0 0 12px">Tap to start</p>
      <p style="color:#777;margin:0 0 12px;font-size:28px">Big title</p>
      <p style="color:rgba(0,0,0,0.25);margin:0">Hint text</p></div>`)
    expect(only('faint', found)).toEqual([
      'faint: "Tap to start" is hard to read — 1.9:1 against its background (needs 4.5:1)',
      'faint: "Hint text" is hard to read — 1.8:1 against its background (needs 4.5:1)',
    ])
  })

  it('faint: a see-through panel is mixed with what is under it; text over a picture or with an outline is left alone', async () => {
    const found = await problemsOn(`<div style="background:#000;padding:20px">
      <div style="background:rgba(255,255,255,0.1);padding:12px"><p style="margin:0;color:#fff">Readable</p></div>
      <div style="background:linear-gradient(#fff,#eee);padding:12px"><p style="margin:0;color:#ddd">Over a gradient</p></div>
      <p style="margin:12px 0 0;color:#111;-webkit-text-stroke:2px #fff">Inked</p></div>`)
    expect(only('faint', found)).toEqual([])
  })

  it('a badge touching its card\'s edge is flagged once; words with no padding in their own box too', async () => {
    const found = await problemsOn(`
      <div style="${card};padding:0 12px 12px;margin:20px"><span class="kit-badge" style="display:inline-block;background:#336;color:#fff;padding:2px 8px">NEW</span>
        <p style="margin:12px 0 0;color:#222">Daily run</p></div>
      <span style="display:inline-block;margin:20px;background:#336;color:#fff;padding:0">Tight</span>`)
    expect(only('edge', found)).toEqual([
      'edge: "Tight" touches the edge of its box (<span>, its own) — 0 px of room',
      'edge: "NEW" touches the edge of its box (<div>) — 0 px of room',
    ])
  })

  it('edge: a picture marked data-ui-bleed may run edge to edge; a badge hanging outside the card is not "in" it', async () => {
    const found = await problemsOn(`<div style="${card};padding:0;margin:20px;position:relative;overflow:hidden">
      <img data-ui-bleed alt="" style="display:block;width:100%;height:60px;background:#933">
      <p style="margin:12px;color:#222">Cover art</p>
      <span style="position:absolute;right:-40px;top:0;width:30px;height:20px;background:#c00" class="kit-badge"></span></div>`)
    expect(only('edge', found)).toEqual([])
  })

  it('grows: a card that grows after it settled is flagged once; settling, shrinking and a screen resize are not', async () => {
    await page.setContent(`<!doctype html><style>body{margin:0;font:16px sans-serif} div{display:inline-block;padding:12px;background:#fff;border:2px solid #333}</style>
      <div id="grows">Round 3</div> <div id="settles">Ada</div> <div id="shrinks">Sam<br>joined</div> <div id="resized">Cy</div>`)
    const frames = (n) => page.evaluate((count) => new Promise((done) => { const step = (left) => (left ? requestAnimationFrame(() => step(left - 1)) : done()); step(count) }), n)
    // the kit's watcher, as the page would run it (watchFixedSize is self-contained)
    await page.evaluate((code) => {
      const watch = new Function(`return (${code})`)()
      for (const id of ['grows', 'settles', 'shrinks', 'resized']) watch(document.getElementById(id))
      document.getElementById('settles').append(' Lovelace') // straight away: part of the first layout
    }, watchFixedSize.toString())
    await frames(4)
    await page.evaluate(() => {
      const add = (id, html) => { document.getElementById(id).innerHTML += html }
      add('grows', '<br>+ 40 points')
      add('grows', '<br>and more') // a second growth: still one line
      document.getElementById('shrinks').textContent = 'Sam'
    })
    await frames(2)
    await page.evaluate(() => dispatchEvent(new Event('resize'))) // a phone turned: sizes start over…
    await frames(4)
    await page.evaluate(() => { document.getElementById('resized').style.width = '200px' }) // …so this counts again
    await frames(2)
    const found = await page.evaluate(findProblems, { screenWidth: 400, checkFocus: false })
    expect(only('grows', found).map((p) => p.replace(/from .*/, ''))).toEqual(['grows: "Round 3+ 40 pointsand more" grew ', 'grows: "Cy" grew '])
  })
})

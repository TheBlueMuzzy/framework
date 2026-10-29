// @vitest-environment node
// findProblems in a real browser (Playwright's own Chromium) on small hand-made pages: what must be caught, and what a
// correct page must NOT be blamed for.
import { readFileSync } from 'node:fs'
import { chromium, webkit } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { findProblems } from './uiProblems.mjs'
import { watchFixedSize } from './fixedSize.ts'

let browser, page
beforeAll(async () => {
  // UI_ENGINE=webkit npx vitest run kit/uiProblems.test.mjs — the same checks in iPhone's engine (F148)
  browser = process.env.UI_ENGINE === 'webkit' ? await webkit.launch() : await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
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

  // F149: a card that has to scroll keeps its last row of buttons stuck at its bottom (kit.css); its words scroll under
  // it. Words a scroll of that same box moves out from under the row are not an overlap — and the scroll is put back.
  // Words that no scroll uncovers (the box can't scroll, or the row sticks over them at both ends) still are.
  const stickyCard = (boxHeight, words) => `
    <div id="card" style="position:absolute;left:0;top:0;width:300px;height:${boxHeight}px;overflow-y:auto">
      ${words}
      <div style="position:sticky;bottom:0;display:flex;gap:8px"><button>Leave</button><button>Ready</button></div>
    </div>`
  it('a sticky row of buttons over words its scroll box can scroll out from under it is not an overlap', async () => {
    const found = await problemsOn(stickyCard(150, '<div style="height:120px">Title</div><div style="height:60px">Waiting for everyone</div>'))
    expect(found.filter((p) => p.startsWith('overlap'))).toEqual([])
    expect(await page.$eval('#card', (el) => el.scrollTop)).toBe(0) // (put back)
  })

  it('a sticky row over words no scroll uncovers is still an overlap', async () => {
    // pulled up over the last words by a negative margin: at either end of the scroll they stay under it
    const found = await problemsOn(stickyCard(150, '<div style="height:120px">Title</div><div style="height:60px;margin-bottom:-48px;display:flex;align-items:end">Waiting for everyone</div>'))
    expect(found).toContain('overlap: "Leave" × "Waiting for everyone"')
  })

  it('a dialog over the HUD does not make the HUD words "overlap" the dialog', async () => {
    const found = await problemsOn(`
      <div style="position:absolute;left:10px;top:10px">Score 120</div>
      <div style="position:absolute;left:0;top:0;width:400px;height:200px;background:#222;color:#fff">
        <p style="margin:12px 14px">Paused — take a breath</p></div>`)
    expect(found.filter((p) => p.startsWith('overlap'))).toEqual([])
  })
})

// 0.33.1 (F124) — a solid piece sliding onto a bar, meter or picture (no words there, so the check above missed it)
const plate = 'display:flex;align-items:center;gap:8px;padding:6px 10px;background:#fff;border-radius:12px'
const bar = (label, width = 160) => `<div role="progressbar" aria-label="${label}" style="width:${width}px;height:10px;background:#ddd;border-radius:5px">
  <span style="display:block;width:70%;height:100%;background:#c33"></span></div>`
describe('findProblems — a solid piece covering a bar or picture', () => {
  it('a coins chip sitting on the end of the Health bar is flagged once', async () => {
    const found = await problemsOn(`<div style="background:#554;position:absolute;inset:0">
      <div style="${plate};position:absolute;left:10px;top:10px"><span>❤</span> ${bar('Health')}</div>
      <div aria-label="Coins" style="${plate};position:absolute;left:150px;top:6px"><span style="background:#fc0;border-radius:50%">🪙</span> 250</div>
      <img alt="Map" style="position:absolute;left:10px;top:120px;width:120px;height:80px;background:#396">
      <span class="kit-badge" style="position:absolute;left:100px;top:110px;background:#336;color:#fff;padding:2px 8px">NEW</span></div>`)
    expect(only('overlap', found)).toEqual([
      'overlap: "Coins" covers part of "Health"',
      'overlap: "NEW" covers part of "Map"',
    ])
  })

  it('a dialog wholly over the HUD, a chip wholly on a backdrop picture, a badge in its own card and a label on its own bar are not', async () => {
    const found = await problemsOn(`<div style="background:#554;position:absolute;inset:0">
      <div style="${plate};position:absolute;left:10px;top:10px"><span>❤</span> ${bar('Health')}</div>
      <div style="position:absolute;left:0;top:0;width:400px;height:90px;background:#222;color:#fff"><p style="margin:12px 14px">Paused</p></div>
      <img alt="Backdrop" style="position:absolute;left:0;top:100px;width:400px;height:120px;background:#396">
      <div style="${plate};position:absolute;left:20px;top:120px">Round 1</div>
      <div style="${plate};position:absolute;left:20px;top:240px;position:absolute">
        <span style="display:inline-grid"><span class="kit-avatar" role="img" aria-label="Ada" style="grid-area:1/1;width:44px;height:44px;background:#933"></span>
          <span class="kit-badge" style="grid-area:1/1;align-self:end;justify-self:end;margin:-4px;background:#336;color:#fff;font-size:11px;padding:1px 3px">Bot</span></span> Ada</div>
      <div style="${plate};position:absolute;left:180px;top:240px;display:grid"><div style="grid-area:1/1">${bar('Energy', 180)}</div>
        <span style="grid-area:1/1;place-self:center;font-size:12px;background:#eef;padding:0 4px;border-radius:4px">Energy 40%</span></div></div>`)
    expect(only('overlap', found)).toEqual([])
  })
})

// 0.33.2 (F127) — a solid piece sliding onto another card's words (the coins chip on "Score 120": the text-over-text
// check stopped at the chip's background and said nothing)
describe('findProblems — a solid piece covering text', () => {
  it('a coins chip over the end of "Score 120" is flagged once', async () => {
    const found = await problemsOn(`<div style="background:#554;position:absolute;inset:0">
      <div style="${plate};position:absolute;left:10px;top:10px;color:#222">Score 120</div>
      <div aria-label="Coins" style="${plate};padding-left:40px;position:absolute;left:75px;top:8px"><span>🪙</span><span>250</span></div></div>`)
    expect(only('overlap', found)).toEqual(['overlap: "Coins" covers part of "Score 120"'])
  })

  it('a chip whose own words cross the text is said once, as words over words', async () => {
    const found = await problemsOn(`<div style="background:#554;position:absolute;inset:0">
      <div style="${plate};position:absolute;left:10px;top:10px;color:#222">Score 120</div>
      <div style="${plate};position:absolute;left:70px;top:8px">Coins 250</div></div>`)
    expect(only('overlap', found)).toEqual(['overlap: "Score 120" × "Coins 250"'])
  })

  it('a label on its own chip, a key chip in a sentence, a badge in its card, a dialog wholly over text, text on its backdrop panel, a tooltip and a moving chip are not', async () => {
    const found = await problemsOn(`<div style="background:#554;position:absolute;inset:0;color:#fff">
      <div style="${plate};position:absolute;left:10px;top:10px;width:30px;white-space:nowrap;color:#222"><span>Long label</span></div>
      <p style="position:absolute;left:200px;top:0">Press <span style="background:#fc0;color:#222;padding:0 4px">A</span> to jump</p>
      <div style="${plate};position:absolute;left:10px;top:60px;color:#222"><span>Ada Lovelace</span>
        <span class="kit-badge" style="position:absolute;left:40px;top:4px;width:14px;height:14px;border-radius:50%;background:#c33"></span></div>
      <p style="position:absolute;left:200px;top:50px;margin:0">Round 3</p>
      <div style="position:absolute;left:180px;top:40px;width:200px;height:50px;background:#222"><p style="margin:4px">Paused</p></div>
      <div style="position:absolute;left:0;top:120px;width:400px;height:100px;background:#335"></div>
      <p style="position:absolute;left:20px;top:130px;margin:0">Night falls</p>
      <p style="position:absolute;left:20px;top:250px;margin:0">Hold to charge</p>
      <div id="tip" popover style="position:fixed;inset:auto;left:60px;top:244px;margin:0;width:40px;height:30px;background:#fff;border:0;padding:0"></div>
      <p style="position:absolute;left:220px;top:250px;margin:0">Combo meter</p>
      <div style="position:absolute;left:260px;top:244px;width:30px;height:30px;background:#c33;animation:drift 9s linear"></div></div>
      <style>@keyframes drift { to { transform: translateX(40px) } }</style>
      <script>document.getElementById('tip').showPopover()</script>`)
    expect(only('overlap', found)).toEqual([])
  })

  // 0.35.3 (F145, Muzzy 2026-10-25): toasts at 200% text stacked over the card's words and buttons — on top by design
  it('words in the top layer (a toast) over the page are not an overlap; two toasts over each other still are', async () => {
    const toast = 'position:fixed;inset:auto;margin:0;border:0;padding:4px;background:#fff'
    const found = await problemsOn(`
      <p style="position:absolute;left:20px;top:20px;margin:0">Win a round to earn trophies</p>
      <button style="position:absolute;left:20px;top:60px">More</button>
      <div id="a" popover="manual" style="${toast};left:10px;top:14px;width:300px">Sam joined the room</div>
      <div id="b" popover="manual" style="${toast};left:10px;top:200px;width:200px">Connection lost</div>
      <div id="c" popover="manual" style="${toast};left:30px;top:204px;width:200px">Tap to close me</div>
      <script>for (const id of 'abc') document.getElementById(id).showPopover()</script>`)
    expect(only('overlap', found)).toEqual(['overlap: "Connection lost" × "Tap to close me"'])
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

  it('edge: words are measured by their ink — a ‹ in a snug icon button has room; a "+4" floating away is not judged', async () => {
    const found = await problemsOn(`<div style="margin:20px">
      <button style="width:44px;height:44px;padding:0;font-size:39px;line-height:1;background:#fff;border:1px solid #333">‹</button>
      <span style="display:inline-block;background:#336;color:#fff;padding:4px">7<span style="display:inline-block;position:relative;top:-8px;animation:up 5s">+4</span></span></div>
      <style>@keyframes up { to { transform: translateY(-30px) } }</style>`)
    expect(only('edge', found)).toEqual([])
  })

  it('edge: words with lining-nums (the kit sets it everywhere) are measured in their own font — 0.35.4, F147', async () => {
    // The font shorthand reads "" with lining-nums: the words were measured in the canvas's last font instead.
    // The kit's own Nunito file, not a system font: GitHub's Linux has no Courier New, and its stand-in drew taller.
    // 48 px tall: 44–50 all work — the right font finds room, the old line's leftover font a false "touches".
    const nunito = readFileSync(new URL('./fonts/nunito.woff2', import.meta.url)).toString('base64')
    const squeezed = (variant) => `<style>@font-face{font-family:Proof;src:url(data:font/woff2;base64,${nunito})}</style>
      <button style="display:inline-flex;align-items:center;justify-content:center;width:300px;height:48px;padding:0 26px;
      border:2px solid #333;background:#fff;font:600 36px/50.4px Proof;font-variant-numeric:${variant}">Settings</button>`
    const edgesOn = async (variant) => {
      await page.setContent(`<!doctype html><body style="margin:20px">${squeezed(variant)}</body>`)
      await page.evaluate(() => document.fonts.load('600 36px Proof'))
      return only('edge', await page.evaluate(findProblems, { screenWidth: 400, checkFocus: false }))
    }
    const plain = await edgesOn('normal')
    const lining = await edgesOn('lining-nums')
    expect(lining).toEqual(plain)
    expect(plain).toEqual([])
  })

  it('edge: a chip shrunk by a transform (pinned to a table) is measured with its border as drawn', async () => {
    const chip = (pad) => `display:inline-block;background:#29366f;color:#fff;border:8px solid #f4f4f4;padding:${pad}px;transform:scale(0.4);transform-origin:0 0`
    const found = await problemsOn(`<div style="background:#1a1c2c;padding:20px;height:200px">
      <div style="${chip(8)}">Roomy</div><br><div style="${chip(1)};margin-top:-30px">Tight</div></div>`)
    expect(only('edge', found)).toEqual(['edge: "Tight" touches the edge of its box (<div>, its own) — 0 px of room'])
  })
  // F161: the gallery's pinned chips at 200% text sideways — 36 "1 px of room" finds on chips whose room is 3+ px before
  // they shrink onto the table (like the ring check's, F152: a small copy of a chip with room has room)
  it('edge: a chip shrunk onto the table keeps its room shrunk too — 3 px drawn at 0.4 is fine; touching still counts', async () => {
    const chip = (pad) => `display:inline-block;background:#29366f;color:#fff;border:2px solid #f4f4f4;padding:${pad}px;line-height:1;transform:scale(0.4);transform-origin:0 0`
    const found = await problemsOn(`<div style="background:#1a1c2c;padding:20px;height:200px">
      <div style="${chip(3)}">Roomy</div><br><div style="${chip(0)};margin-top:-10px">Tight</div></div>`)
    expect(only('edge', found)).toEqual(['edge: "Tight" touches the edge of its box (<div>, its own) — 0 px of room'])
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
    // read once: the next screen's check doesn't blame these again
    expect(only('grows', await page.evaluate(findProblems, { screenWidth: 400, checkFocus: false }))).toEqual([])
  })

  it('grows: a card that widens because its column did, or once its picture has loaded, is not flagged', async () => {
    await page.setContent(`<!doctype html><style>body{margin:0;font:16px sans-serif} #column{width:200px} .card{padding:12px;background:#fff;border:2px solid #333}</style>
      <div id="column"><div class="card" id="widens">Level 2</div></div>
      <div class="card" id="picture" style="display:inline-block">Reward <img id="img" alt=""></div>`)
    const frames = (n) => page.evaluate((count) => new Promise((done) => { const step = (left) => (left ? requestAnimationFrame(() => step(left - 1)) : done()); step(count) }), n)
    await page.evaluate((code) => {
      const watch = new Function(`return (${code})`)()
      // the picture is still loading when the card appears (a src that answers later)
      const img = document.getElementById('img')
      Object.defineProperty(img, 'complete', { configurable: true, get: () => false })
      watch(document.getElementById('widens'))
      watch(document.getElementById('picture'))
    }, watchFixedSize.toString())
    await frames(4)
    await page.evaluate(() => {
      document.getElementById('column').style.width = '320px' // a sidebar went away
      const img = document.getElementById('img')
      img.style.cssText = 'width:60px;height:60px;display:inline-block;background:#c90'
      delete img.complete
      img.dispatchEvent(new Event('load'))
    })
    await frames(6)
    expect(only('grows', await page.evaluate(findProblems, { screenWidth: 400, checkFocus: false }))).toEqual([])
  })
})

// 0.34.1 (F141) — a word broken in the middle at a big text size
describe('findProblems — words split in the middle', () => {
  it('the ◀ Accessibility ▶ picker squeezed by its arrows is flagged once: the word fits its box', async () => {
    const found = await problemsOn(`
      <div style="display:flex;width:300px;border:1px solid #888;border-radius:8px">
        <button style="width:110px">◀</button>
        <span style="flex:1 1 0;min-width:0;text-align:center;overflow-wrap:anywhere">Accessibility</span>
        <button style="width:110px">▶</button></div>`)
    expect(only('split', found)).toEqual(['split: "Accessibility" is broken in the middle across 2 lines, though it fits on one line of its box (<div>)'])
  })

  it('a word too long for its box at all may wrap; words wrapping at spaces and hyphens are fine', async () => {
    const found = await problemsOn(`
      <div style="width:90px;padding:4px;border:1px solid #888;overflow-wrap:anywhere">Supercalifragilistic</div>
      <p style="width:90px;margin:8px">Red-green colour-blind mode for players</p>`)
    expect(only('split', found)).toEqual([])
  })

  // 0.38.0 (F162): Mode select's card title "[Öñļíñéöñ]" in the fake language on a phone, 0.3 px wider than its card's
  // inside — the browser broke it (it doesn't fit), and the check said it fits: its pieces add up to within its +0.5 px
  it('a word a hair wider than its box (under half a pixel) may wrap: it doesn\'t fit', async () => {
    await page.setContent('<span id="w" style="font:24px sans-serif">Onlineonline</span>')
    const wide = await page.$eval('#w', (el) => el.getBoundingClientRect().width)
    const found = await problemsOn(`<div style="width:${wide - 0.3}px;padding:4px;border:1px solid #888;font:24px sans-serif;overflow-wrap:break-word">Onlineonline</div>`)
    expect(only('split', found)).toEqual([])
  })

  // 0.38.0 (F162): the parts page's Carousel at 200% text in the fake language — "[Lockdown]" wider than the carousel's
  // window (between its ◀ ▶) broke inside it; the check measured it against the card around, where it would fit
  it('a word wider than a window that hides its overflow may wrap, though it would fit the card around', async () => {
    const found = await problemsOn(`<div style="width:300px;padding:4px;border:1px solid #888">
      <div style="width:120px;overflow:hidden"><span style="display:block;overflow-wrap:anywhere">Supercalifragilistic</span></div></div>`)
    expect(only('split', found)).toEqual([])
  })

  // 0.37.0 (F156): ConnectionDot's chip — a translated "connection" too long for the room beside the dot breaks on purpose
  it('a word in a data-ui-split-ok part may break; the same squeeze without it is flagged', async () => {
    const chip = (mark) => `
      <div ${mark} style="display:flex;width:150px;border:1px solid #888;border-radius:8px">
        <span style="flex:none;width:60px">●</span>
        <span style="min-width:0;overflow-wrap:break-word">Verbindungsfehler</span></div>`
    expect(only('split', await problemsOn(chip('data-ui-split-ok')))).toEqual([])
    expect(only('split', await problemsOn(chip('')))).toHaveLength(1)
  })
  it('a word in a ◀ ▶ picker already stacked (its last step) may break; the same picker unstacked is flagged', async () => {
    const picker = (fit) => `
      <div style="width:300px;padding:4px;border:1px solid #888">
        <div class="kit-picker" data-fit="${fit}" style="padding:0 100px"><span style="overflow-wrap:break-word">Barrierefreiheit</span></div></div>`
    expect(only('split', await problemsOn(picker('stack')))).toEqual([])
    expect(only('split', await problemsOn(picker('')))).toHaveLength(1)
  })

  // 0.35.1 (F145): Reconnecting's "Reconnecti / ng…" — a title word wider than its whole card at 200% text. Not a squeeze
  // (the word fits nowhere at that size), but a title can drop a size, so a broken title word is flagged too
  it('a TITLE word wider than its box is flagged; the same word as plain text is not', async () => {
    const found = await problemsOn(`
      <div style="width:120px;padding:4px;border:1px solid #888">
        <h2 class="kit-text" data-kind="title" style="font-size:32px;margin:0;overflow-wrap:break-word">Reconnecting…</h2>
        <p class="kit-text" style="font-size:32px;margin:0;overflow-wrap:break-word">Reconnecting…</p></div>`)
    const split = only('split', found)
    expect(split).toHaveLength(1) // the title only
    expect(split[0]).toMatch(/^split: "Reconnecting…" is broken in the middle across \d lines — a title word wider than its box \(<div>\)/)
  })

  // 0.37.0 (F156): the title fit already dropped to body size (data-fit="split") and the word is still wider: breaking
  // is the last resort, not a missed fit
  it('a title whose fit went all the way down (data-fit="split") may break', async () => {
    const found = await problemsOn(`
      <div style="width:120px;padding:4px;border:1px solid #888">
        <span data-fit="split"><h2 class="kit-text" data-kind="title" style="font-size:32px;margin:0;overflow-wrap:break-word">Reconnecting…</h2></span></div>`)
    expect(only('split', found)).toEqual([])
  })
})

// 0.35.9 (F153) — light on-game words over a plain light page. HudText draws "Your turn" / "Game over" in the light
// on-game colour with a dark halo, made for the GAME's picture; in the turn-based starter (Sprint 42) they sat on the
// plain light page and "Game over" all but vanished — the faint check skips words with a halo (text-shadow), so every
// check was green. Now: what's behind the letters, if it's a plain colour, against the words' colour (halo ignored).
// (Placed by position and colours only — no font needed.)
describe('findProblems — light words on a light background', () => {
  const halo = 'text-shadow:0 1px 2px #1b1e24,0 0 6px #1b1e24,0 0 12px #1b1e24'
  const hud = (words, extra = '') => `<div class="kit-hud-text" style="position:absolute;left:20px;top:20px;color:#fff;${halo};pointer-events:none${extra}"><span>${words}</span></div>`
  const on = (background, html) => `<div style="position:absolute;inset:0;background:${background}">${html}</div>`

  it('white HUD words on the plain light page or a light grey are flagged; on a mid-to-dark table they pass', async () => {
    expect(only('contrast', await problemsOn(hud('Game over')))).toEqual([
      'contrast: "Game over" is light on-game words on a plain light background — 1.0:1 (needs 3:1; their halo is for busy game art, not a plain page: put the game\'s picture or table colour behind them)',
    ])
    expect(only('contrast', await problemsOn(on('#d4d7dd', hud('Your turn'))))).toHaveLength(1)
    expect(only('contrast', await problemsOn(on('#235b45', hud('Your turn'))))).toEqual([]) // the starter's felt
    expect(only('contrast', await problemsOn(on('#808080', hud('Your turn'))))).toEqual([]) // a mid grey: 4.0:1
  })

  // A CSS gradient is plain colours (the gallery's striped stand-in game): judged by its stop that reads best
  it('a gradient of light colours only is flagged; one with a dark stop is not', async () => {
    expect(only('contrast', await problemsOn(on('repeating-linear-gradient(45deg, #f4f5f7 0 24px, #fff 0 48px)', hud('Tap a piece')))))
      .toEqual([expect.stringMatching(/^contrast: "Tap a piece" is light on-game words on a plain light background — 1\.\d:1/)])
    expect(only('contrast', await problemsOn(on('repeating-linear-gradient(45deg, #f4f5f7 0 24px, #1b1e24 0 48px)', hud('Tap a piece'))))).toEqual([])
  })

  it('words over a picture, a canvas or a video are left alone (can\'t be judged)', async () => {
    expect(only('contrast', await problemsOn(on('url(data:image/gif;base64,R0lGODlhAQABAAAAACw=), #fff', hud('Round 1'))))).toEqual([])
    expect(only('contrast', await problemsOn(`<canvas width="400" height="400" style="position:absolute;inset:0"></canvas>${hud('Round 1')}`))).toEqual([])
    expect(only('contrast', await problemsOn(`<img alt="" style="position:absolute;inset:0;width:400px;height:400px">${hud('Round 1')}`))).toEqual([])
  })

  it('words under a dialog\'s dim or inside a dialog are not judged — only what\'s really on show', async () => {
    const dim = '<div style="position:absolute;inset:0;background:rgba(255,255,255,0.6)"></div>'
    expect(only('contrast', await problemsOn(hud('Game over') + dim))).toEqual([])
    expect(only('contrast', await problemsOn(`<div role="dialog" style="position:absolute;inset:0">${hud('Paused')}</div>`))).toEqual([])
  })

  it('dark words on the light page are not "light words" (the faint check judges those)', async () => {
    expect(only('contrast', await problemsOn(hud('Round 1', ';color:#222;text-shadow:none')))).toEqual([])
    expect(only('contrast', await problemsOn('<p style="color:#fff;background:#fff;margin:0">Not on-game</p>'))).toEqual([])
  })
})

// 0.35.8 (F152) — words or a badge touching an avatar's ring. Results' 1st-place avatar wears an accent ring (an outline:
// 3 px line, 2 px off its edge) that its neighbours' 8 px gap never counted — an outline isn't part of the box, so
// every box check saw 8 px; at 200% text the ring crossed "1ST", the name and its badges. On a ROUND avatar the ring is
// a circle: a badge by its box's corner can be clear of it, or not, whatever the boxes say.
// (Placed by position, not by the words' width, so the font doesn't matter: each piece's edge is where the style says.)
describe('findProblems — a ring around an avatar', () => {
  // A 44 px round avatar at x 100–144, y 20–64 (centre 122, 42); ring: its outline reaches 5 px out → a 27 px circle
  const avatar = (ring) => `<span class="kit-avatar" role="img" aria-label="Muzzy" style="position:absolute;left:100px;top:20px;width:44px;height:44px;border-radius:50%;background:#84c${ring ? ';outline:3px solid #f90;outline-offset:2px' : ''}"></span>`
  // words whose right end is at x = `right` (the page is 400 px wide), centred on the avatar
  const place = (right) => `<span style="position:absolute;right:${400 - right}px;top:32px;line-height:20px">1ST</span>`

  it('words 8 px from the avatar but 1 px from its ring are flagged — and so are words the ring crosses', async () => {
    expect(only('ring', await problemsOn(avatar(true) + place(92)))).toEqual([]) // 3 px from the ring: room
    expect(only('ring', await problemsOn(avatar(true) + place(94)))).toEqual(['ring: "1ST" touches the ring around "Muzzy" — 1 px of room'])
    expect(only('ring', await problemsOn(avatar(true) + place(97)))).toEqual(['ring: "1ST" touches the ring around "Muzzy" — 0 px of room'])
  })

  // A badge up by the avatar's top-right corner: its box touches the avatar's box, but the circle is ~4 px away from the
  // badge's corner — fine with no ring, and touching once the ring adds 5 px
  const badge = '<span class="kit-badge" style="position:absolute;left:136px;top:6px;width:30px;height:14px;background:#2a6"></span>'
  it('a badge by a round avatar is measured to the circle, not the box: clear without the ring, touching with it', async () => {
    expect(only('ring', await problemsOn(avatar(false) + badge))).toEqual([])
    expect(only('ring', await problemsOn(avatar(true) + badge))).toEqual(['ring: "<span>" touches the ring around "Muzzy" — 0 px of room'])
  })

  it('a chip shrunk onto the table keeps its room shrunk too: 4 px drawn at a quarter is fine; touching still counts', async () => {
    const shrunk = (html) => `<div style="position:absolute;left:0;top:0;width:400px;height:100px;transform:scale(0.25);transform-origin:0 0">${html}</div>`
    expect(only('ring', await problemsOn(shrunk(avatar(false) + place(96))))).toEqual([]) // 1 px on screen
    expect(only('ring', await problemsOn(shrunk(avatar(false) + place(99))))).toEqual(['ring: "1ST" touches the ring around "Muzzy" — 0 px of room'])
  })

  it('a badge laid ON the avatar on purpose (a seat\'s badge on its portrait\'s corner) is not "touching" it', async () => {
    const found = await problemsOn(`<div style="position:absolute;left:80px;top:0;width:100px;height:90px;border:2px solid #333">${avatar(true)
      .replace('left:100px', 'left:18px')}<span class="kit-badge" style="position:absolute;left:46px;top:46px;width:20px;height:20px;border-radius:50%;background:#2a6"></span></div>`)
    expect(only('ring', found)).toEqual([])
  })

  // F161: Results' last row scrolled under the list's bottom edge — only the avatar's top shows, and "Continue" below
  // the list was "touching" the ring of the part the list hides
  it('the part of an avatar a scroll area hides has no ring to touch; the part it shows still counts', async () => {
    const list = (top) => `<div style="position:absolute;left:0;top:0;width:400px;height:30px;overflow:auto">
      <div style="position:relative;height:200px">${avatar(true).replace('top:20px', `top:${top}px`)}</div></div>
      <span style="position:absolute;left:150px;top:34px;line-height:20px">Continue</span>`
    // the list shows the avatar's top 6 px; the words sit below the list, 1 px right of where the hidden ring would be
    expect(only('ring', await problemsOn(list(24)))).toEqual([])
    // …but words inside the list, by the part that shows, still touch it
    const inside = `<div style="position:absolute;left:0;top:0;width:400px;height:60px;overflow:auto">
      <div style="position:relative;height:200px">${avatar(true)}${place(97)}</div></div>`
    expect(only('ring', await problemsOn(inside))).toEqual(['ring: "1ST" touches the ring around "Muzzy" — 0 px of room'])
  })

  // 0.38.0 (F162): the Room at 200% text in the fake language — the card scrolls as one, and its row of buttons stays
  // at its foot (sticky) while the players scroll under it: "I'm ready" sat beside Muzzy's ring going by underneath.
  // Like an overlap with a sticky row (scrollsOutFromUnder): scrolling takes it out from under, so it isn't judged.
  it('words on a sticky row the avatar scrolls out from under are not judged; the same row fixed in place is', async () => {
    const card = (sticky) => `<div style="position:absolute;left:0;top:0;width:400px;height:100px;overflow:auto">
      <div style="position:relative;height:300px">${avatar(true).replace('top:20px', 'top:66px')}</div>
      <div style="position:${sticky ? 'sticky' : 'absolute'};bottom:0;${sticky ? '' : 'top:76px;width:400px;'}height:24px;padding-left:148px;box-sizing:border-box;line-height:24px">Ready</div></div>`
    expect(only('ring', await problemsOn(card(true)))).toEqual([])
    expect(only('ring', await problemsOn(card(false)))).toHaveLength(1)
  })
})

// 0.38.0 (F162) — three cut-offs the check missed (found by F161 in the fake language, ?pseudo). Words are drawn in the
// kit's own Nunito file (never a system font: GitHub's Linux draws others wider or narrower), and each case is far
// past its edge, so a few px of font difference never changes the answer; the px in a line are left out of the match.
describe('findProblems — cut-offs at a card edge, words past their card, a squeezed list (F162)', () => {
  const nunito = readFileSync(new URL('./fonts/nunito.woff2', import.meta.url)).toString('base64')
  const withFont = async (html) => {
    await page.setContent(`<!doctype html><style>@font-face{font-family:Proof;src:url(data:font/woff2;base64,${nunito})}
      body{margin:0;font:16px/1.4 Proof} button{width:60px;height:48px}</style>${html}`)
    await page.evaluate(() => document.fonts.load('16px Proof'))
    return page.evaluate(findProblems, { screenWidth: 400, checkFocus: false })
  }
  const noPx = (lines) => lines.map((p) => p.replace(/ — \d+ px.*/, ''))

  // Settings in Pixel at 200% text (fake language): its card scrolls up and down but hides what's past its sides, and the
  // title's last letter ("]") was cut off at the card's right edge. The edge check skips boxes that scroll (rows scrolled
  // part-way under an edge are fine), and the text check only looked at the words' own box.
  const panel = (inside) => `<div style="position:absolute;left:16px;top:16px;width:150px;height:120px;overflow-x:hidden;overflow-y:auto;
    background:#29366f;color:#fff;border:4px solid #f4f4f4;padding:12px">${inside}<div style="height:300px">Rows</div></div>`
  it('clipped: a title cut off by the side of a card that scrolls up and down (its last letter hidden) is flagged once', async () => {
    const found = await withFont(panel('<h2 style="margin:0;font-size:32px;white-space:nowrap">[Šéţţíñĝššéţ]</h2>'))
    expect(noPx(only('clipped', found))).toEqual(['clipped: "[Šéţţíñĝššéţ]" is cut off by the side of its box (<div>), which hides what runs past it'])
  })

  it('clipped: words that fit, rows scrolled part-way under the bottom, and a strip that scrolls sideways are not cut off', async () => {
    const found = await withFont(`${panel('<h2 style="margin:0;font-size:20px">Settings</h2>')}
      <div style="position:absolute;left:16px;top:200px;width:200px;height:60px;overflow-x:auto;white-space:nowrap">A long sideways strip of words you scroll along</div>
      <div style="position:absolute;left:240px;top:16px;width:140px;height:100px;overflow:hidden">
        <div style="height:100px;overflow-y:auto">${'<p style="margin:0 0 8px">A setting row</p>'.repeat(8)}</div></div>`)
    // (the last: a settings page that scrolls, in a stage that hides its overflow — its rows below scroll into view)
    expect(only('clipped', found)).toEqual([])
  })

  // Mode select in Pixel on a desktop (fake language): a card title one word wider than its card ran out past the card's
  // side — the edge check said "touches the edge — 0 px", which reads like a near miss
  const modeCard = (title) => `<div style="padding:20px"><button style="width:140px;height:auto;padding:16px;text-align:start;background:#29366f;color:#fff;border:4px solid #f4f4f4">
    <span style="display:block;font-size:24px;font-weight:700">${title}</span><span style="display:block">Pick a mode</span></button></div>`
  it('edge: a card title running past its card says it runs past, and by how much', async () => {
    const found = await withFont(modeCard('[Öñļíñéöñ]'))
    expect(only('edge', found)).toHaveLength(1)
    expect(only('edge', found)[0]).toMatch(/^edge: "\[Öñļíñéöñ\]" runs \d+ px past the edge of its box \(<button>\)$/)
  })

  it('edge: a card title that fits its card is fine', async () => {
    expect(only('edge', await withFont(modeCard('Online')))).toEqual([])
  })

  // The Room at 200% text on an upright phone: the players list was squeezed to 128 px for rows of ~156 px — less than
  // one player showed, and it scrolled, so nothing was cut off or touching anything
  const list = (height, rows = 4) => `<div style="padding:20px"><div role="region" aria-label="Players" tabindex="0" style="height:${height}px;overflow:auto">
    ${Array.from({ length: rows }, (_, i) => `<div style="height:60px;display:flex;align-items:center">Player ${i + 1}</div>`).join('')}</div></div>`
  it('squeezed: a scrolling list too short for even two of its rows is flagged once, with how much of a row shows', async () => {
    const found = await withFont(list(50))
    expect(only('squeezed', found)).toEqual(['squeezed: the list "Players" shows 0.8 of a row at a time (its shortest row is 60 px) — give it room for 2 rows, or let the card around it scroll as one'])
  })

  it('squeezed: a list with room for two rows, a list that fits, and a short box of one long text are fine', async () => {
    expect(only('squeezed', await withFont(list(120)))).toEqual([])
    expect(only('squeezed', await withFont(list(60, 1)))).toEqual([])
    expect(only('squeezed', await withFont(`<div style="height:50px;width:200px;overflow:auto">${'Lots of words in one paragraph. '.repeat(20)}</div>`))).toEqual([])
  })

  // The full shoot's own false finds (task 3): a card on a phone on its side at 200% text, already scrolling as one,
  // whose parts are each over half the screen tall (Feedback's tooltip demo, 284 px on a 390 px screen) — two of them
  // can't fit on the screen at all, so there's no room to give
  it('squeezed: rows taller than half the screen are not judged — two of them could never show at once', async () => {
    expect(only('squeezed', await withFont(`<div style="height:300px;overflow:auto">
      <div style="height:240px">A tall part</div><div style="height:240px">Another</div></div>`))).toEqual([])
  })

  // …the Idle warning: a popover (the top layer) placed over the gallery's stage, which hides its overflow — no box
  // clips the top layer, nor a box placed by the screen (position: fixed), nor one placed by a box further out
  // (position: absolute) — only the boxes from the one it's placed by outward
  it('clipped: words in a popover, a fixed box or a box placed further out are not cut off by a box they escape', async () => {
    // (the box that hides is not itself placed, so the absolute one is placed by the box around it)
    await withFont(`<div style="position:absolute;left:0;top:200px;width:300px"><div style="height:100px;overflow:hidden">
      <div id="pop" popover="manual" style="inset:auto;left:10px;top:185px;margin:0;width:200px">Still there? A bot plays</div>
      <div style="position:fixed;left:10px;top:290px">A fixed note at its foot</div>
      <div style="position:absolute;left:10px;top:-10px">Placed by the page</div></div></div>`)
    await page.evaluate(() => document.getElementById('pop').showPopover())
    expect(only('clipped', await page.evaluate(findProblems, { screenWidth: 400, checkFocus: false }))).toEqual([])
  })

  it('clipped: words placed by the box that hides its overflow are still cut off by it', async () => {
    const found = await withFont(`<div style="position:absolute;left:0;top:200px;width:300px;height:100px;overflow:hidden">
      <div style="position:absolute;left:10px;top:-15px;font-size:24px">Placed by the box</div></div>`)
    expect(noPx(only('clipped', found))).toEqual(['clipped: "Placed by the box" is cut off by the top or bottom of its box (<div>), which hides what runs past it'])
  })

  // …and Countdown's "3" on a phone on its side: its line box (a tall line) runs past the stage, its ink doesn't —
  // words are measured by their ink, as the edge check does
  it('clipped: a tall line whose letters are all inside the box is not cut off', async () => {
    const found = await withFont(`<div style="position:absolute;left:0;top:100px;width:300px;height:70px;overflow:hidden">
      <div style="font-size:60px;line-height:70px">3</div></div>`)
    expect(only('clipped', found)).toEqual([])
  })
})

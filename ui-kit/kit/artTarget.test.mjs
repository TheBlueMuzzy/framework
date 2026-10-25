// @vitest-environment node
// A control placed in an ArtLayer keeps the kit's 44 px tap floor (0.33.2, found by Goops: art.css's "children may
// shrink to the layer" rule came after kit.css's .kit-target floor and wiped it — a compact Button measured 29 px).
// Measured in a real browser (Playwright's own Chromium) with the kit's real CSS.
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const css = ['kit.css', 'art.css'].map((f) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).join('\n')

let browser, page
beforeAll(async () => {
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  page = await browser.newPage({ viewport: { width: 400, height: 400 } })
}, 60_000)
afterAll(async () => { await browser?.close() })

const sizeOf = async (html, selector) => {
  await page.setContent(`<!doctype html><style>:root{--target-min:44px} body{margin:0;font:16px sans-serif}</style><style>${css}</style>${html}`)
  return page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { w: r.width, h: r.height } }, selector)
}

describe('ArtLayer keeps a control\'s tap size', () => {
  it('a small Button in a sized art layer is still at least 44 × 44', async () => {
    const box = await sizeOf(`<div style="display:grid;width:300px;height:200px">
      <div class="kit-art-layer" data-sized style="--kit-at-ratio:10 / 1;width:200px">
        <button class="kit-target" id="b" style="padding:0 4px;font-size:10px;line-height:1">RANK</button></div></div>`, '#b')
    expect(box.h).toBeGreaterThanOrEqual(44)
    expect(box.w).toBeGreaterThanOrEqual(44)
  })

  it('in an off layer too', async () => {
    const box = await sizeOf(`<div class="kit-art-layer" data-sized data-off style="--kit-at-ratio:10 / 1;width:200px">
      <div class="kit-art-layer-off"><button class="kit-target" id="b" style="font-size:10px">RANK</button></div></div>`, '#b')
    expect(box.h).toBeGreaterThanOrEqual(44)
  })

  it('a picture or panel in the layer still shrinks to it (the layer keeps its shape)', async () => {
    const box = await sizeOf(`<div class="kit-art-layer" data-sized style="--kit-at-ratio:10 / 1;width:200px">
      <div id="p"><div style="height:80px"></div></div></div>`, '#p')
    expect(box.h).toBeCloseTo(20, 0)
  })
})

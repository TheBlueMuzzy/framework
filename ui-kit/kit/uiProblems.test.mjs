// @vitest-environment node
// findProblems in a real browser (Playwright's own Chromium) on small hand-made pages: what must be caught, and what a
// correct page must NOT be blamed for.
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { findProblems } from './uiProblems.mjs'

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

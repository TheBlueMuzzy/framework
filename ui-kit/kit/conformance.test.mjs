// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { SIZES, check, groupProblems } from './conformance.mjs'

describe('UI kit checks', () => {
  it('checks the seven sizes the sprint asked for', () => {
    expect(SIZES.map((s) => `${s.width}×${s.height}`)).toEqual(['390×844', '360×780', '844×390', '768×343', '1100×800', '1440×900', '1920×1080'])
  })
  it('groups problems by kind, each with every screen it showed on (wider counts as clipped)', () => {
    const grouped = groupProblems({
      'phone · first screen': ['small: 30×30 px — "Close"', 'overlap: "Score" × "Cracks"'],
      'desktop · first screen': ['small: 30×30 px — "Close"', 'wider: the page is wider than the screen (400 > 390)'],
    })
    expect([...grouped.small]).toEqual([['30×30 px — "Close"', ['phone · first screen', 'desktop · first screen']]])
    expect([...grouped.overlap.keys()]).toEqual(['"Score" × "Cracks"'])
    expect([...grouped.clipped.keys()]).toEqual(['the page is wider than the screen (400 > 390)'])
  })
  it('--static: runs check-ui only, and asks for a check:ui script when the game has none', async () => {
    const results = []
    const t = {
      rel: 'src/ui/kit', staticOnly: true, scripts: () => ({}),
      run: (cmd, args) => ({ code: 0, out: `${cmd} ${args.join(' ')}` }),
      pass: (name, detail) => results.push({ name, ok: true, detail }),
      fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
      skip: (name, why) => results.push({ name, skipped: true, why }),
    }
    await check(t)
    expect(results.map((r) => [r.name, r.ok ?? 'skip'])).toEqual([
      ['the game\'s UI code keeps the kit\'s rules (check-ui)', true],
      ['check-ui runs in check:fast', false],
      ['the game at every size', 'skip'],
    ])
    expect(results[0].detail).toBe('node src/ui/kit/check-ui.mjs src/ui --css src')
  })
})

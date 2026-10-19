// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { SIZES, check, checkUiArgs, groupProblems, whereText } from './conformance.mjs'

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
  it('says where a problem showed in few words when it showed everywhere in one phase', () => {
    const inPlay = SIZES.map((s) => `${s.name} ${s.width}×${s.height} · in play`)
    expect(whereText(inPlay, 14)).toBe('in play, every size')
    expect(whereText([...inPlay, ...inPlay.map((w) => w.replace('in play', 'first screen'))], 14)).toBe('every screen, every size')
    expect(whereText(inPlay.slice(0, 2), 14)).toBe(`${inPlay[0]}; ${inPlay[1]}`)
  })
  it('reads the game\'s check:ui folders up to the next command', () => {
    expect(checkUiArgs('node src/ui/kit/check-ui.mjs src/ui src/game --css src && node scripts/other.mjs')).toEqual(['src/ui', 'src/game', '--css', 'src'])
    expect(checkUiArgs('node src/ui/kit/check-ui.mjs src/ui; echo done')).toEqual(['src/ui'])
    expect(checkUiArgs('')).toEqual(['src/ui', '--css', 'src'])
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

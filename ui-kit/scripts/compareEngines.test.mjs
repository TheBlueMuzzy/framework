// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { compareLayouts, compareRuns, readRuns } from './compareEngines.mjs'

const layout = (texts = {}, parts = {}) => ({ texts, parts })

describe('comparing two engines’ layouts (F149)', () => {
  it('the same layout: nothing differs', () => {
    const a = layout({ 'BUTTON.kit-button "How to play"#1': 1 }, { 'BUTTON.kit-button "How to play"#1': [113.39, 44] })
    expect(compareLayouts(a, structuredClone(a))).toEqual({ wraps: [], sizes: [] })
  })

  it('a text on more lines in one engine is a wrap; a size within 1 px is not a difference', () => {
    const a = layout({ 'BUTTON.kit-button "How to play"#1': 1 }, { 'BUTTON.kit-button "How to play"#1': [113.39, 44], 'SPAN. "❤"#1': [17.5, 25.19] })
    const b = layout({ 'BUTTON.kit-button "How to play"#1': 2 }, { 'BUTTON.kit-button "How to play"#1': [113.39, 68], 'SPAN. "❤"#1': [18.4, 25.19] })
    const { wraps, sizes } = compareLayouts(a, b)
    expect(wraps).toEqual([{ key: 'BUTTON.kit-button "How to play"#1', a: 1, b: 2 }])
    expect(sizes).toEqual([{ key: 'BUTTON.kit-button "How to play"#1', a: [113.39, 44], b: [113.39, 68] }])
  })

  it('something only one engine has is not compared (a part that only shows in one run)', () => {
    const a = layout({ 'SPAN. "Only here"#1': 1 }, { 'DIV.kit-row ""#1': [10, 10] })
    expect(compareLayouts(a, layout())).toEqual({ wraps: [], sizes: [] })
  })

  it('the report: open wraps fail it, accepted ones (with their reason) don’t; sizes are summed by part', () => {
    const shots = {
      'screens/menu-neon-phone-landscape': [layout({ 'BUTTON.kit-button "How to play"#1': 1 }), layout({ 'BUTTON.kit-button "How to play"#1': 2 })],
      'screens/hud-clean-phone': [layout({}, { 'BUTTON.kit-button "⚙"#1': [44, 44] }), layout({}, { 'BUTTON.kit-button "⚙"#1': [57, 57] })],
    }
    const open = compareRuns(shots)
    expect(open.open).toBe(1)
    expect(open.text).toContain('✗ WRAP screens/menu-neon-phone-landscape  BUTTON.kit-button "How to play"#1: 1 line(s) in Chromium, 2 in WebKit')
    expect(open.text).toContain('✗ 1 wrap(s) differ')
    expect(open.text).toContain('1 part size(s) differ by more than 1 px — BUTTON.kit-button 1 (--sizes lists them)')
    expect(open.text).not.toContain('SIZE screens/hud')
    const accepted = compareRuns(shots, { accepted: { 'screens/menu-neon-phone-landscape|BUTTON.kit-button "How to play"#1': 'a reason' }, allSizes: true })
    expect(accepted.open).toBe(0)
    expect(accepted.text).toContain('~ WRAP')
    expect(accepted.text).toContain('accepted: a reason')
    expect(accepted.text).toContain('✓ no wrap differs (1 accepted)')
    expect(accepted.text).toContain('SIZE screens/hud-clean-phone  BUTTON.kit-button "⚙"#1: 44×44 → 57×57')
  })

  describe('reading the two shoot folders', () => {
    const dir = mkdtempSync(join(tmpdir(), 'compare-engines-'))
    afterAll(() => rmSync(dir, { recursive: true, force: true }))
    it('pairs the shots both runs took, by name (sub-folders too); a shot only one run took is left out', () => {
      const write = (run, name, data) => { mkdirSync(join(dir, run, 'screens'), { recursive: true }); writeFileSync(join(dir, run, `${name}.json`), JSON.stringify(data)) }
      write('chromium', 'screens/hud-clean-phone', layout({ a: 1 }))
      write('webkit', 'screens/hud-clean-phone', layout({ a: 2 }))
      write('chromium', 'screens/hud-clean-desktop', layout()) // Chromium only (WebKit takes no desktop shots)
      const shots = readRuns(join(dir, 'chromium'), join(dir, 'webkit'))
      expect(Object.keys(shots)).toEqual(['screens/hud-clean-phone'])
      expect(shots['screens/hud-clean-phone'][1].texts.a).toBe(2)
      expect(readRuns(join(dir, 'none'), join(dir, 'webkit'))).toEqual({})
    })
  })
})

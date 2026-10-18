import { describe, expect, it } from 'vitest'
import { resolveStyle } from '../style/applyStyle'
import { presets } from '../styles'
import { firstFontName, fontValue, gameFontFaceCss, kitFonts, licenceLight, loadGameFonts } from './gameFonts'

describe('text roles (0.16.0)', () => {
  it('title and heading follow the style\'s display font unless set, so every preset looks the same', () => {
    for (const name of Object.keys(presets)) {
      const vars = resolveStyle({ preset: name })
      expect(vars['font-title']).toBe('var(--font-display)')
      expect(vars['font-heading']).toBe('var(--font-display)')
    }
  })
  it('a game can set each role on its own', () => {
    const vars = resolveStyle({ preset: 'neon', tweaks: { 'font-title': fontValue('GB Boot'), 'font-heading': "'Nokia', monospace", 'font-body': "'VT323'" } })
    expect(vars['font-title']).toBe("'GB Boot', system-ui, sans-serif")
    expect(vars['font-heading']).toBe("'Nokia', monospace")
    expect(vars['font-body']).toBe("'VT323'")
    expect(vars['font-display']).toBe(presets.neon['font-display'])
  })
})

describe('game fonts', () => {
  const file = { fonts: [
    { name: 'Press Start DX', file: 'press_start_dx/Press Start DX.ttf', licence: 'unknown' },
    { name: 'No file', file: '', licence: 'unknown' },
  ] }
  it('makes one @font-face per font with a file, under the game\'s base path', () => {
    const css = gameFontFaceCss(file, '/GOOPS/')
    expect(css).toBe(`@font-face { font-family: 'Press Start DX'; src: url("/GOOPS/fonts/press_start_dx/Press%20Start%20DX.ttf"); font-display: swap; }`)
    expect(gameFontFaceCss({}, '/')).toBe('')
  })
  it('loadGameFonts puts the rules on the page once, and replaces them when called again', () => {
    loadGameFonts(file, '/')
    loadGameFonts({ fonts: [{ name: 'B', file: 'b.ttf', licence: 'unknown' }] }, '/')
    const tags = document.querySelectorAll('#kit-game-fonts')
    expect(tags.length).toBe(1)
    expect(tags[0].textContent).toContain("font-family: 'B'")
  })
  it('reads the first font of a CSS value', () => {
    expect(firstFontName("'Orbitron', 'Exo 2', system-ui")).toBe('Orbitron')
    expect(firstFontName('system-ui, sans-serif')).toBe('system-ui')
    expect(firstFontName('var(--font-display)')).toBe('var(--font-display)')
  })
  it('licence lights', () => {
    expect(licenceLight('commercial-ok').light).toBe('🟢')
    expect(licenceLight('credit-needed').light).toBe('🟡')
    expect(licenceLight('non-commercial').light).toBe('🔴')
    expect(licenceLight('whatever').light).toBe('🔴')
  })
  it('lists the 7 kit fonts (fonts.css), every one OFL = credit needed', () => {
    expect(kitFonts.map((f) => f.name)).toEqual(['Nunito', 'Fredoka', 'Lilita One', 'Silkscreen', 'VT323', 'Orbitron', 'Exo 2'])
    expect(kitFonts.every((f) => f.licence === 'credit-needed')).toBe(true)
  })
})

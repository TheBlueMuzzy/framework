import { describe, expect, it } from 'vitest'
import { fontRoleTokens } from '../../../ui-kit/kit/style/tokens'
import {
  FONT_ROLES, FONT_TOKENS, crispness, cssPixels, firstFontName, fontChoices, fontValue, fontWords, gameFontFor, isFont,
  installedNote, isInstalledPath, licenceChip, prettyFontName, rolesOnLibraryFonts,
} from './fontsLogic'

describe('font roles', () => {
  it('are the UI kit text roles (title + heading from the kit, body + numbers from every preset)', () => {
    expect(FONT_TOKENS).toEqual(['font-title', 'font-heading', 'font-body', 'font-numbers'])
    for (const token of Object.keys(fontRoleTokens)) expect(FONT_TOKENS).toContain(token)
  })
})

describe('font values', () => {
  it('a picked font is saved with a fallback', () => {
    expect(fontValue('Press Start DX')).toBe("'Press Start DX', system-ui, sans-serif")
    expect(firstFontName(fontValue("It's"))).toBe('Its')
    expect(isFont("'Orbitron', 'Exo 2', sans-serif", 'Orbitron')).toBe(true)
    expect(isFont("'Orbitron', 'Exo 2', sans-serif", 'Exo 2')).toBe(false)
  })
  it('reads the style default in words', () => {
    expect(fontWords('var(--font-display)', { 'font-display': "'Orbitron', sans-serif" })).toBe('Style default (Orbitron)')
    expect(fontWords("'VT323', monospace", {})).toBe('VT323')
  })
})

describe('licence chips', () => {
  it('🟢 🟡 🔴', () => {
    expect(licenceChip('commercial-ok').light).toBe('🟢')
    expect(licenceChip('credit-needed').light).toBe('🟡')
    expect(licenceChip('non-commercial').light).toBe('🔴')
    expect(licenceChip('unknown').light).toBe('🔴')
    expect(licenceChip('').words).toMatch(/unknown/)
  })
})

describe('pixel font crispness', () => {
  it('crisp at the native size and whole multiples, soft between — with the nearest crisp sizes', () => {
    expect(crispness(8, 24)).toEqual({ crisp: true, words: 'crisp (8 px × 3)' })
    expect(crispness(8, 21.96)).toEqual({ crisp: false, words: 'soft at 22 px — crisp at 16 · 24 · 32 px' })
    expect(crispness(8, 6)).toEqual({ crisp: false, words: 'soft at 6 px — crisp at 8 · 16 px' })
    expect(crispness(undefined, 18)).toBeNull()
  })
  it('reads CSS sizes', () => {
    expect(cssPixels('1.125rem')).toBe(18)
    expect(cssPixels('20px')).toBe(20)
    expect(cssPixels('2rem', 10)).toBe(20)
    expect(cssPixels('')).toBe(0)
  })
})

describe('choices', () => {
  const kit = [{ name: 'Orbitron', file: '', licence: 'credit-needed' }, { name: 'VT323', file: '', licence: 'credit-needed' }]
  const game = [
    { name: 'Press Start DX', file: 'press_start_dx/Press Start DX.ttf', licence: 'unknown', pixelSize: 8 },
    { name: 'VT323', file: 'vt/vt.ttf', licence: 'commercial-ok' },
  ]
  it('game fonts first, then the kit, then library fonts being tried; a name only once (the game wins)', () => {
    const list = fontChoices(kit, game, [{ name: 'Gbb', source: 'library', licence: 'unknown', libraryPath: 'gb/gbb.ttf' }])
    expect(list.map((c) => `${c.name}:${c.source}`)).toEqual(['Press Start DX:game', 'VT323:game', 'Orbitron:kit', 'Gbb:library'])
  })
  it('finds a library font already in the game by its file name', () => {
    expect(gameFontFor('press_start_dx/Press Start DX.ttf', game)?.name).toBe('Press Start DX')
    expect(gameFontFor('other/press start dx.TTF', game)?.name).toBe('Press Start DX')
    expect(gameFontFor('x/y.ttf', game)).toBeUndefined()
    // library paths name their root (Dev Kit 0.27.0)
    expect(gameFontFor('folder:press_start_dx/Press Start DX.ttf', game)?.name).toBe('Press Start DX')
    expect(gameFontFor('installed1:Press Start DX.ttf', game)?.name).toBe('Press Start DX')
    expect(prettyFontName('installed1:arialbd.ttf')).toBe('Arialbd')
  })
  it('installed fonts: which paths, and the warning', () => {
    expect(isInstalledPath('installed2:arial.ttf')).toBe(true)
    expect(isInstalledPath('folder:installed2:arial.ttf')).toBe(false)
    expect(installedNote('win32')).toBe("Most fonts that come with Windows can't ship in a game — check its licence.")
    expect(installedNote('darwin')).toContain('a Mac')
    expect(installedNote(undefined)).toContain('the computer')
  })
  it('library names match the dev server', () => {
    expect(prettyFontName('gb_boot/gbb__.ttf')).toBe('Gbb')
    expect(prettyFontName('8-bit-pusab.ttf')).toBe('8 bit pusab')
  })
  it('Save waits for roles on a library font', () => {
    const list = fontChoices(kit, game, [{ name: 'Gbb', source: 'library', licence: 'unknown' }])
    const roles = rolesOnLibraryFonts({ 'font-title': fontValue('Gbb'), 'font-body': fontValue('VT323') }, list)
    expect(roles.map((r) => r.label)).toEqual(['Title'])
    expect(FONT_ROLES.length).toBe(4)
  })
})

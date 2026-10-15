// Runs in the framework (not copied into games): checks the Color tool against the real UI kit.
import { describe, expect, it } from 'vitest'
import cartoon from '../../../ui-kit/kit/styles/cartoon.json'
import { colourTokens, lineColourTokens, menuSizeTokens, optionalTokens, otherTokens } from '../../../ui-kit/kit/style/tokens'
import { joinNumber, shapeDefault, shapesToClear, sliderFor, UI_SHAPES, uiShapesFrom } from './styleValues'
import {
  UI_COLOURS,
  copyForClaudeText,
  listChanges,
  normalizeHex,
  sameColour,
  tweaksToSave,
  uiChanged,
  uiColoursFrom,
  uiLabel,
} from './colorLogic'

const start = () => uiColoursFrom(cartoon)

describe('the colour list', () => {
  it('covers exactly the kit\'s 15 colour tokens', () => {
    const kit = [...Object.keys(colourTokens), ...Object.keys(lineColourTokens)].sort()
    expect(UI_COLOURS.map((c) => c.token).sort()).toEqual(kit)
    expect(UI_COLOURS).toHaveLength(15)
  })
  it('gives friendly labels', () => {
    expect(uiLabel('primary')).toBe('Main buttons (primary)')
    expect(uiLabel('game-shade')).toBe('HUD text halo (game-shade)')
  })
})

describe('normalizeHex / sameColour', () => {
  it('tidies typed colours', () => {
    expect(normalizeHex('#FFC629')).toBe('#ffc629')
    expect(normalizeHex('ffc629')).toBe('#ffc629')
    expect(normalizeHex(' #abc ')).toBe('#aabbcc')
    expect(normalizeHex('#ffc62')).toBeNull()
    expect(normalizeHex('transparent')).toBeNull()
    expect(normalizeHex('#ggg')).toBeNull()
  })
  it('treats #FFF and #ffffff as the same colour', () => {
    expect(sameColour('#FFF', '#ffffff')).toBe(true)
    expect(sameColour('#fff', '#fffffe')).toBe(false)
    expect(sameColour('transparent', 'transparent')).toBe(true)
  })
})

describe('uiColoursFrom', () => {
  it('is the preset with the file\'s tweaks on top', () => {
    const ui = uiColoursFrom(cartoon, { primary: '#ff9f1c', 'font-body': 'x' })
    expect(ui.primary).toBe('#ff9f1c')
    expect(ui.bg).toBe(cartoon.bg)
    expect(ui['font-body']).toBeUndefined() // only colours
  })
})

describe('tweaksToSave — what Save writes into style.json "tweaks"', () => {
  it('writes nothing when every colour matches the preset', () => {
    expect(tweaksToSave(cartoon, uiColoursFrom(cartoon))).toEqual({})
  })
  it('writes only the colours that differ from the preset', () => {
    const ui = { ...uiColoursFrom(cartoon), primary: '#ff9f1c' }
    expect(tweaksToSave(cartoon, ui)).toEqual({ primary: '#ff9f1c' })
  })
  it('drops an old colour tweak once it is set back to the preset value (any case)', () => {
    const ui = { ...uiColoursFrom(cartoon), accent: cartoon.accent.toUpperCase() }
    expect(tweaksToSave(cartoon, ui, { accent: '#00ff00' })).toEqual({})
  })
  it('keeps non-colour tweaks the file already had', () => {
    const ui = { ...uiColoursFrom(cartoon), danger: '#aa0000' }
    expect(tweaksToSave(cartoon, ui, { 'font-scale': 1.3, danger: '#bb0000' })).toEqual({ 'font-scale': 1.3, danger: '#aa0000' })
  })
})

describe('listChanges / uiChanged', () => {
  it('lists nothing when nothing changed', () => {
    expect(listChanges(start(), start())).toEqual([])
    expect(uiChanged(start(), start())).toBe(false)
  })
  it('lists changes with friendly names, in panel order', () => {
    const after = { ...start(), primary: '#ff9f1c', bg: '#000000' }
    expect(listChanges(start(), after)).toEqual([
      { name: 'Page background (bg)', from: cartoon.bg, to: '#000000' },
      { name: 'Main buttons (primary)', from: cartoon.primary, to: '#ff9f1c' },
    ])
    expect(uiChanged(start(), after)).toBe(true)
  })
  it('ignores case-only differences', () => {
    const after = { ...start(), bg: cartoon.bg.toUpperCase() }
    expect(listChanges(start(), after)).toEqual([])
  })
})

describe('copyForClaudeText', () => {
  const changes = [{ name: 'Main buttons (primary)', from: '#ffc629', to: '#ff9f1c' }]
  it('is a plain-English list of what changed', () => {
    expect(copyForClaudeText('Roll Better', changes, true)).toBe(
      'Colour changes from the Dev Kit (Roll Better) — saved to content/ui/style.json:\n' +
        '- Main buttons (primary): #ffc629 → #ff9f1c',
    )
  })
  it('says when changes are not saved yet', () => {
    expect(copyForClaudeText('Roll Better', changes, false)).toContain('NOT all saved yet')
  })
  it('asks Claude to write them in when they come from the live build (no Save there)', () => {
    expect(copyForClaudeText('Roll Better', changes, false, true)).toContain('tried in the live build, NOT saved — please write them into content/ui/style.json')
  })
  it('says so when nothing changed', () => {
    expect(copyForClaudeText('Roll Better', [], true)).toBe('No colour changes in the Dev Kit (Roll Better) since the game loaded.')
  })
  it('works for a game tab\'s own values and file', () => {
    const text = copyForClaudeText('Roll Better', [{ name: 'Rows felt', from: '#111111', to: '#222222' }], true, false, 'Table', 'content/ui/table.json')
    expect(text).toBe('Table changes from the Dev Kit (Roll Better) — saved to content/ui/table.json:\n- Rows felt: #111111 → #222222')
  })
})

describe('UI shape & feel values (styleValues.ts)', () => {
  it('cover every non-colour style value the kit has (presets, optional extras, menu sizes)', () => {
    const editable = [...Object.keys(otherTokens), ...Object.keys(optionalTokens), ...Object.keys(menuSizeTokens)]
    expect(UI_SHAPES.map((s) => s.token).sort()).toEqual(editable.sort())
  })
  it('after a restyle only unset menu sizes are cleared — never glow or panel texture (a preset may leave them out)', () => {
    const preset = { ...cartoon } as Record<string, unknown>
    delete preset['glow']
    delete preset['panel-texture']
    delete preset['kit-menu-w']
    const cleared = shapesToClear(preset, { 'kit-ask-w': '30rem' })
    expect(cleared).toContain('kit-menu-w')
    expect(cleared).not.toContain('kit-ask-w')
    expect(cleared).not.toContain('glow')
    expect(cleared).not.toContain('panel-texture')
    expect(cleared.every((t) => t.startsWith('kit-'))).toBe(true)
  })
  it('menu sizes fall back to the kit CSS defaults', () => {
    for (const [token, note] of Object.entries(menuSizeTokens)) expect(shapeDefault(cartoon, token)).toBe(note.split(' ')[0])
  })
  it('read from the preset, with tweaks on top', () => {
    const shapes = uiShapesFrom(cartoon, { 'radius-control': '2rem' })
    expect(shapes['radius-control']).toBe('2rem')
    expect(shapes['press-scale']).toBe(String(cartoon['press-scale']))
    expect(shapes['kit-menu-w']).toBe('36rem')
  })
  it('Save keeps numbers as numbers, drops values back at the preset / default, keeps tweaks it was not given', () => {
    const values = { ...uiShapesFrom(cartoon), 'press-scale': '0.9', 'kit-menu-w': '36rem', 'radius-control': '0.5rem' }
    expect(tweaksToSave(cartoon, values, { 'kit-menu-w': '40rem', primary: '#123456' })).toEqual({
      primary: '#123456',
      'press-scale': 0.9,
      'radius-control': '0.5rem',
    })
  })
  it('names them in plain words', () => {
    expect(uiLabel('radius-control')).toBe('Button & input corners (radius-control)')
  })
  it('a slider in the value’s unit, stretched to reach it; none for a shadow or an unknown unit', () => {
    expect(sliderFor('radius-control', '1rem')).toMatchObject({ n: 1, unit: 'rem', min: 0, max: 3 })
    expect(sliderFor('radius-control', '999px')).toMatchObject({ n: 999, unit: 'px', max: 999 })
    expect(sliderFor('depth-0', '0 2px 0 black')).toBeNull()
    expect(sliderFor('motion-fast', '20vw')).toBeNull()
    expect(joinNumber(0.1 + 0.2, 'rem')).toBe('0.3rem')
  })
})

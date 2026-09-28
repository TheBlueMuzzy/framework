// Tests for the rule checker itself: it must catch each broken rule and let good code through.
import { describe, expect, it } from 'vitest'
import { checkSource } from './check-ui.mjs'

const messages = (path, text) => checkSource(path, text).map((p) => p.message)

describe('check-ui', () => {
  it('passes clean CSS that only uses style names', () => {
    expect(messages('kit/a.css', '.x { color: var(--primary); gap: var(--gap-m); --kit-tile: 8rem; }')).toEqual([])
  })

  it('catches raw colours, px sizes and font names in CSS', () => {
    const found = messages('kit/a.css', '.x { color: #ff0000; padding: 4px; font-family: Arial; background: rgb(0 0 0); }')
    expect(found.filter((m) => m.startsWith('raw colour'))).toHaveLength(2)
    expect(found.some((m) => m.startsWith('px size'))).toBe(true)
    expect(found.some((m) => m.startsWith('font name'))).toBe(true)
  })

  it('allows position:absolute only in Screen', () => {
    expect(messages('kit/a.css', '.kit-screen { position: absolute; }')).toEqual([])
    expect(messages('gallery/a.css', '.popup { position: absolute; }')[0]).toMatch(/only Screen/)
  })

  it('catches unknown style names', () => {
    expect(messages('kit/a.css', '.x { color: var(--pink); }')[0]).toMatch(/unknown style name --pink/)
  })

  it('ignores comments and CSS variable definitions', () => {
    expect(messages('kit/a.css', '/* at least 44px */ :root { --kit-edge: 2px; }')).toEqual([])
  })

  it('catches inline styles, but allows setting CSS variables', () => {
    expect(messages('kit/A.tsx', `<div style={{ color: 'red' }} />`)[0]).toMatch(/inline style/)
    expect(messages('kit/A.tsx', `<div style={{ '--kit-fill': 0.5 } as CSSProperties} />`)).toEqual([])
  })

  it('catches raw values in TSX', () => {
    expect(messages('gallery/A.tsx', `const c = '#123456'`)[0]).toMatch(/raw colour/)
  })

  it('lets the style engine, presets and tests use raw values', () => {
    expect(messages('kit/style/applyStyle.ts', `const x = '#fff'; const y = '4px'`)).toEqual([])
    expect(messages('kit/styles/index.ts', `'#fff'`)).toEqual([])
  })

  it('works the same on the kit copied into a game (src/ui/kit/)', () => {
    expect(messages('src/ui/kit/style/applyStyle.ts', `const x = '#fff'`)).toEqual([])
    expect(messages('src/ui/Hud.tsx', `const c = '#123456'`)[0]).toMatch(/raw colour/)
  })
})

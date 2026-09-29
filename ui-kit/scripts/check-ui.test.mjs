// Tests for the rule checker itself: it must catch each broken rule and let good code through.
import { describe, expect, it } from 'vitest'
import { checkSource, findKitRestyles, readArguments } from './check-ui.mjs'

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

describe('check-ui --css: game CSS that restyles kit parts', () => {
  const warned = (path, text) => findKitRestyles(path, text).map((w) => w.snippet)

  it('warns about rules that restyle a .kit-… class, with the line they start on', () => {
    const css = '.board { color: var(--primary); }\n\n@media (max-width: 40rem) {\n  .game .kit-toasts { inset: auto 0 0; }\n}'
    expect(findKitRestyles('src/App.css', css)).toEqual([expect.objectContaining({ line: 4, snippet: '.game .kit-toasts' })])
  })

  it('lets rules that only set CSS variables through, and ignores comments', () => {
    expect(warned('src/App.css', ':root { --kit-frame-w: 100vw; } .kit-overlay { --kit-overlay-z: 80; } /* .kit-button { } */')).toEqual([])
  })

  it('skips the kit itself (any folder named kit) and non-CSS files', () => {
    expect(warned('src/ui/kit/kit.css', '.kit-button { padding: 0; }')).toEqual([])
    expect(warned('src\\ui\\kit\\blocks\\blocks.css', '.kit-button { padding: 0; }')).toEqual([])
    expect(warned('src/App.tsx', '.kit-button { padding: 0; }')).toEqual([])
  })

  it('reads the command line: UI folders, then --css folders', () => {
    expect(readArguments(['src/ui', '--css', 'src'])).toEqual({ folders: ['src/ui'], cssFolders: ['src'] })
    expect(readArguments(['src/ui'])).toEqual({ folders: ['src/ui'], cssFolders: [] })
  })
})

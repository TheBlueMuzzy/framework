// blocks.css rules a test can read as text (Vitest hands .css imports to tests empty, so this reads the file).
// 0.25.0 (Goops): Bar atMost + Hud dockTight — their CSS uses style names only, no px.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'blocks.css'), 'utf8')
const rule = (selector) => css.split(/\r?\n/).find(line => line.includes(selector)) ?? ''

describe('blocks.css 0.25.0', () => {
  it('at-most: the row shared evenly, capped at the share, never narrower than its label — no px', () => {
    const line = rule('[data-width="at-most"] {')
    expect(line).toContain('flex: 1 1 0')
    expect(line).toContain('min-inline-size: max-content')
    expect(line).toContain('calc(var(--kit-bar-share) * 100%)')
    expect(line).not.toMatch(/\dpx/)
  })

  it('at-most bars on a plate stretch their bar like a share does', () => {
    expect(rule('.kit-hud-chip:is([data-width="share"], [data-width="at-most"]) > .kit-progress')).toContain('flex: 1 1 auto')
  })

  it('dockTight: the dock panel sides get the small gap style name', () => {
    const line = rule('.kit-hud-dock[data-tight] > .kit-panel')
    expect(line).toContain('padding-inline: var(--gap-s)')
    expect(line).not.toMatch(/\dpx/)
  })
})

describe('blocks.css 0.33.0 (F121)', () => {
  it('TalkingBubble: each game colour not set falls back to exactly the style token it replaced', () => {
    for (const exact of ['fill: var(--kit-talk-fill, var(--surface))', 'stroke: var(--kit-talk-outline, var(--border))',
      'stroke-width: var(--kit-talk-outline-width, var(--border-width))', 'color: var(--kit-talk-ink, var(--on-surface))',
      '.kit-talk-more > .kit-text[data-kind] { color: var(--kit-talk-more, var(--muted)); }']) expect(css).toContain(exact)
  })
})

describe('blocks.css 0.35.4 (F147)', () => {
  it('a menu\'s buttons keep their line of words and border when squeezed (target-min still the floor)', () => {
    expect(rule('.kit-menu > .kit-button {')).toContain('min-block-size: max(var(--target-min), calc(1lh + 2 * var(--border-width)))')
  })

  it('HUD past its text cap: the top-left corner gives way to the middle (only then)', () => {
    expect(rule('.kit-hud-slot[data-big-text]) > [data-slot="top-left"]')).toContain('min-inline-size: 0')
  })

  it('MenuHeader ‹ stops growing inside its border, not at the button\'s outside', () => {
    expect(rule('.kit-menu-header > .kit-button[data-icon] {')).toContain('calc(var(--target-min) - var(--border-width))')
  })
})

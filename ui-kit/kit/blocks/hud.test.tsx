// HUD logic: English place names, and the +N float-up appearing when a number changes.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Bar, Counter, HudText, ordinal, PlayerChip, TurnBanner } from './hud'
import { toMilliseconds } from './motion'

afterEach(() => { cleanup(); document.documentElement.removeAttribute('data-reduce-motion') })

describe('ordinal', () => {
  it('names places the English way', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map(ordinal))
      .toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '101st'])
  })
})

describe('Counter', () => {
  it('floats up the difference when the number changes, and nothing at the start', () => {
    const { container, rerender } = render(<Counter label="Coins" value={10} />)
    expect(container.querySelector('.kit-float-up')).toBeNull()
    rerender(<Counter label="Coins" value={15} />)
    expect(container.querySelector('.kit-float-up')?.textContent).toBe('+5')
    rerender(<Counter label="Coins" value={12} />)
    expect([...container.querySelectorAll('.kit-float-up')].map((f) => f.textContent)).toEqual(['+5', '−3'])
  })
})

describe('toMilliseconds', () => {
  it('reads a style motion time', () => {
    expect([toMilliseconds('420ms'), toMilliseconds('0.3s'), toMilliseconds(' 90ms '), toMilliseconds('', 300)]).toEqual([420, 300, 90, 300])
  })
})

describe('PlayerChip', () => {
  it('shows avatar, name, badge, detail and score; reads the score out', () => {
    const { container } = render(<PlayerChip name="Muzzy" color="#e8553d" score={12} detail="S2 · T5" badge="Bot" active />)
    expect(container.querySelector('.kit-avatar')?.getAttribute('aria-label')).toBe('Muzzy')
    expect(container.textContent).toContain('S2 · T5')
    expect(container.textContent).toContain('Bot')
    expect(container.querySelector('[aria-label="12 points"]')).toBeTruthy()
    expect(container.querySelector('.kit-player-chip')?.getAttribute('data-state')).toBe('active')
  })
  it('a goal chip: an icon instead of the avatar', () => {
    const { container } = render(<PlayerChip name="Goal" icon="◎" score={30} />)
    expect(container.querySelector('.kit-avatar')).toBeNull()
    expect(container.textContent).toContain('◎')
  })
  it('avatar={false} and showName={false} leave just the score', () => {
    const { container } = render(<PlayerChip name="Goal" avatar={false} showName={false} score={30} />)
    expect(container.querySelector('.kit-avatar')).toBeNull()
    expect(container.querySelector('.kit-player-chip-text')).toBeNull()
  })
  it('dim marks it faded', () => {
    const { container } = render(<PlayerChip name="Sam" dim />)
    expect(container.querySelector('.kit-player-chip')?.hasAttribute('data-dim')).toBe(true)
  })
  it('with reduce motion on, a rising score jumps straight to its new value', () => {
    document.documentElement.setAttribute('data-reduce-motion', '')
    const { container, rerender } = render(<PlayerChip name="Sam" score={5} />)
    rerender(<PlayerChip name="Sam" score={9} />)
    expect(container.querySelector('.kit-player-chip-score .kit-text')?.textContent).toBe('9')
  })
})

describe('HudText', () => {
  it('is plain words read out politely: no panel, no badge, no button', () => {
    const { container } = render(<HudText detail="Tap a die to keep it">Hold to Roll</HudText>)
    const box = container.querySelector('.kit-hud-text')
    expect(box?.getAttribute('aria-live')).toBe('polite')
    expect(box?.textContent).toBe('Hold to RollTap a die to keep it')
    expect(container.querySelector('.kit-panel, .kit-badge, .kit-hud-chip, button')).toBeNull()
  })
  it('sizes s/m/l pick the text size; tone accent is marked', () => {
    const kinds = (['s', 'm', 'l'] as const).map((size) => {
      const { container } = render(<HudText size={size}>Round 1</HudText>)
      return container.querySelector('.kit-text')?.getAttribute('data-kind')
    })
    expect(kinds).toEqual(['label', 'heading', 'title'])
    const { container } = render(<HudText tone="accent">Locked 1!</HudText>)
    expect(container.querySelector('.kit-hud-text')?.getAttribute('data-tone')).toBe('accent')
  })
  it('TurnBanner variant="plain" is HudText, not a panel', () => {
    const { container } = render(<TurnBanner variant="plain" text="Sam's turn" />)
    expect(container.querySelector('.kit-panel')).toBeNull()
    expect(container.querySelector('.kit-hud-text')?.textContent).toBe("Sam's turn")
  })
})

describe('Bar width', () => {
  it('width names the bar length for the CSS; no width = fills its room, as before', () => {
    const { container, rerender } = render(<Bar label="Time" value={50} />)
    const chip = () => container.querySelector('.kit-hud-chip')
    expect(chip()?.hasAttribute('data-width')).toBe(false)
    rerender(<Bar label="Time" value={50} width="s" />)
    expect(chip()?.getAttribute('data-width')).toBe('s')
  })
})

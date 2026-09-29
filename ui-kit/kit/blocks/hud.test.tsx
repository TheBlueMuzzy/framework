// HUD logic: English place names, and the +N float-up appearing when a number changes.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Counter, ordinal, PlayerChip } from './hud'
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

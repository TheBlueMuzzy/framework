// HUD logic: English place names, and the +N float-up appearing when a number changes.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Counter, ordinal } from './hud'

afterEach(cleanup)

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

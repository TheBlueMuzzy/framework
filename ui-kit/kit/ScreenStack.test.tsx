// Keyboard/gamepad focus follows the top screen: in when it opens or is swapped, back to the opener when it closes.
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { ScreenStack, screens } from '.'

afterEach(() => {
  cleanup()
  while (screens.current.length) screens.pop()
})

const testScreens = {
  menu: () => <button>Menu button</button>,
  shop: () => <button>Shop button</button>,
}

describe('ScreenStack inert', () => {
  // Set on the page itself, not as a React prop, so it also works on React 18.
  it('everything under the top screen is inert, and wakes up again when the screen closes', () => {
    render(<ScreenStack screens={testScreens}><button>Game button</button></ScreenStack>)
    const layerOf = (text: string) => screen.getByText(text).closest('.kit-layer')!
    expect(layerOf('Game button').hasAttribute('inert')).toBe(false)
    act(() => screens.push('menu'))
    act(() => screens.push('shop'))
    expect(layerOf('Game button').hasAttribute('inert')).toBe(true)
    expect(layerOf('Menu button').hasAttribute('inert')).toBe(true)
    expect(layerOf('Shop button').hasAttribute('inert')).toBe(false)
    act(() => screens.pop())
    expect(layerOf('Menu button').hasAttribute('inert')).toBe(false)
    act(() => screens.pop())
    expect(layerOf('Game button').hasAttribute('inert')).toBe(false)
  })
})

describe('ScreenStack focus', () => {
  it('moves focus into a screen when it opens, and back to the opener when it closes', () => {
    render(<ScreenStack screens={testScreens}><button>Game button</button></ScreenStack>)
    const game = screen.getByText('Game button')
    game.focus()
    act(() => screens.push('menu'))
    expect(document.activeElement).toBe(screen.getByText('Menu button'))
    act(() => screens.pop())
    expect(document.activeElement).toBe(game)
  })

  it('replace moves focus into the new top screen (not left on the page)', () => {
    render(<ScreenStack screens={testScreens}><button>Game button</button></ScreenStack>)
    const game = screen.getByText('Game button')
    game.focus()
    act(() => screens.push('menu'))
    act(() => screens.replace('shop'))
    expect(document.activeElement).toBe(screen.getByText('Shop button'))
    act(() => screens.pop()) // the swapped-in screen still hands focus back to what opened the first one
    expect(document.activeElement).toBe(game)
  })
})

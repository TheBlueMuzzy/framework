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

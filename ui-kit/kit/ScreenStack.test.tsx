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

describe('ScreenStack covered screens', () => {
  // Only the top screen shows: open screens under it are hidden (data-covered → visibility hidden in kit.css),
  // the game (children) never is, and a screen comes back when the one on top of it closes.
  it('hides the open screens under the top one, and shows them again when it closes', () => {
    render(<ScreenStack screens={testScreens}><button>Game button</button></ScreenStack>)
    const layerOf = (text: string) => screen.getByText(text).closest('.kit-layer')!
    act(() => screens.push('menu'))
    expect(layerOf('Menu button').hasAttribute('data-covered')).toBe(false)
    act(() => screens.push('shop'))
    expect(layerOf('Menu button').hasAttribute('data-covered')).toBe(true)
    expect(layerOf('Shop button').hasAttribute('data-covered')).toBe(false)
    expect(layerOf('Game button').hasAttribute('data-covered')).toBe(false) // the game stays, under the dim
    expect(layerOf('Shop button').hasAttribute('data-over')).toBe(true) // opened over a screen: no dim fade-in
    expect(layerOf('Menu button').hasAttribute('data-over')).toBe(false)
    act(() => screens.pop())
    expect(layerOf('Menu button').hasAttribute('data-covered')).toBe(false)
  })

  // 0.7.0: the first screen over the game's own layer dims it too (Settings over a main menu, like Pause over the game);
  // the screens above it carry data-over instead. Nothing to dim (no children) or overlay mode (the overlay dims): no data-dim.
  it('dims the game under the first screen (data-dim), screens above it carry data-over', () => {
    render(<ScreenStack screens={testScreens}><button>Game button</button></ScreenStack>)
    const layerOf = (text: string) => screen.getByText(text).closest('.kit-layer')!
    act(() => screens.push('menu'))
    expect(layerOf('Menu button').hasAttribute('data-dim')).toBe(true)
    act(() => screens.push('shop'))
    expect(layerOf('Shop button').hasAttribute('data-dim')).toBe(false)
    expect(layerOf('Shop button').hasAttribute('data-over')).toBe(true)
  })

  it('no data-dim without a game layer, or in overlay mode', () => {
    const { unmount } = render(<ScreenStack screens={testScreens} />)
    act(() => screens.push('menu'))
    expect(screen.getByText('Menu button').closest('.kit-layer')!.hasAttribute('data-dim')).toBe(false)
    unmount()
    render(<ScreenStack overlay screens={testScreens} />)
    expect(screen.getByText('Menu button').closest('.kit-layer')!.hasAttribute('data-dim')).toBe(false)
  })

  it('works the same in overlay mode', () => {
    render(<ScreenStack overlay screens={testScreens} />)
    const layerOf = (text: string) => screen.getByText(text).closest('.kit-layer')!
    act(() => screens.push('menu'))
    act(() => screens.push('shop'))
    expect(layerOf('Menu button').hasAttribute('data-covered')).toBe(true)
    act(() => screens.replace('menu')) // swapped, same depth: the new top shows, the one under stays hidden
    expect(screen.getAllByText('Menu button').map((b) => b.closest('.kit-layer')!.hasAttribute('data-covered'))).toEqual([true, false])
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

  it('a screen that focuses its own field as it opens (autoFocus) still hands focus back to its opener (0.19.2)', () => {
    const withField = { ...testScreens, name: () => <input aria-label="Your name" autoFocus /> }
    render(<ScreenStack screens={withField}><button>Game button</button></ScreenStack>)
    const game = screen.getByText('Game button')
    game.focus()
    act(() => screens.push('name'))
    expect(document.activeElement).toBe(screen.getByLabelText('Your name'))
    act(() => screens.pop())
    expect(document.activeElement).toBe(game)
  })
})

describe('overlay game box', () => {
  it('marks the always-there layer so the HUD sits on the game picture (--kit-frame-w), not just the open screens', () => {
    const { container, rerender } = render(<ScreenStack screens={{}}><div>hud</div></ScreenStack>)
    expect(container.querySelector('.kit-layer')?.hasAttribute('data-framed')).toBe(false)
    rerender(<ScreenStack overlay screens={{}}><div>hud</div></ScreenStack>)
    expect(container.querySelector('.kit-layer')?.hasAttribute('data-framed')).toBe(true)
  })
})

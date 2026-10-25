// Keyboard/gamepad focus follows the top screen: in when it opens or is swapped, back to the opener when it closes.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { askConfirm, ScreenStack, screens } from '.'

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

describe('ScreenStack kit screens (0.25.0)', () => {
  // Goops' start console: a Settings shown without ...kitScreens — its Replay lessons confirm did nothing.
  it('a confirm from Settings works without ...kitScreens in the game list', () => {
    const onConfirm = vi.fn()
    const settings = () => <button onClick={() => askConfirm({ title: 'Replay lessons?', onConfirm, words: { yes: 'Replay' } })}>Replay lessons</button>
    render(<ScreenStack screens={{ settings }}><button>Game button</button></ScreenStack>)
    act(() => screens.push('settings'))
    fireEvent.click(screen.getByText('Replay lessons'))
    const ask = screen.getByRole('dialog', { name: 'Replay lessons?' })
    fireEvent.click(within(ask).getByRole('button', { name: 'Replay' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(screens.current).toEqual(['settings']) // back on Settings
  })

  it('a game screen named confirm still wins over the kit one', () => {
    render(<ScreenStack screens={{ confirm: () => <p>Game confirm</p> }} />)
    act(() => screens.push('confirm'))
    expect(screen.getByText('Game confirm')).toBeTruthy()
  })

  it('a pushed name with no screen warns (naming it) and closes again — no invisible layer on top', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<ScreenStack screens={testScreens}><button>Game button</button></ScreenStack>)
    act(() => screens.push('menu'))
    act(() => screens.push('shpo'))
    expect(warn).toHaveBeenCalledOnce()
    expect(String(warn.mock.calls[0][0])).toContain('"shpo"')
    expect(screens.current).toEqual(['menu'])
    const layer = screen.getByText('Menu button').closest('.kit-layer')!
    expect(layer.hasAttribute('inert')).toBe(false) // the menu takes taps again
    warn.mockRestore()
  })

  it('closes a missing screen once under StrictMode (not the screen under it too)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    act(() => { screens.push('menu'); screens.push('nope') })
    render(<StrictMode><ScreenStack screens={testScreens} /></StrictMode>)
    expect(screens.current).toEqual(['menu'])
    warn.mockRestore()
  })
})

// F142: until a key is pressed, a screen opened by code focuses without the ring (browsers would show it at load).
// A gamepad press counts like a key — a pad-only player sees where they are from the first screen. Mouse and touch don't.
// Each test loads a fresh copy of the kit (vi.resetModules), so "was a key or pad used?" starts as no.
describe('ScreenStack focus ring for keys and pads (F142)', () => {
  async function freshKit() {
    vi.resetModules()
    return await import('.')
  }
  // The options each focus() call got
  function watchFocus() {
    const spy = vi.spyOn(HTMLElement.prototype, 'focus')
    return { calls: () => spy.mock.calls.map((call) => call[0] as FocusOptions | undefined), done: () => spy.mockRestore() }
  }
  const quiet = (options: FocusOptions | undefined) => options?.focusVisible === false

  afterEach(async () => {
    cleanup()
    const kit = await import('.')
    while (kit.screens.current.length) kit.screens.pop()
  })

  it('a pad connecting (browsers only report one after a button press) → the next screen focuses WITH the ring', async () => {
    const kit = await freshKit()
    render(<kit.ScreenStack screens={testScreens}><button>Game button</button></kit.ScreenStack>)
    window.dispatchEvent(new Event('gamepadconnected'))
    const focus = watchFocus()
    act(() => kit.screens.push('menu'))
    expect(document.activeElement).toBe(screen.getByText('Menu button'))
    expect(focus.calls().some(quiet)).toBe(false)
    focus.done()
  })

  it("a game's own pad code tells the kit with markPadUsed() → the next screen focuses WITH the ring", async () => {
    const kit = await freshKit()
    render(<kit.ScreenStack screens={testScreens}><button>Game button</button></kit.ScreenStack>)
    kit.markPadUsed()
    const focus = watchFocus()
    act(() => kit.screens.push('menu'))
    expect(focus.calls().some(quiet)).toBe(false)
    focus.done()
  })

  it('a key press still counts (the d-pad sent as arrow keys is a key press too)', async () => {
    const kit = await freshKit()
    render(<kit.ScreenStack screens={testScreens}><button>Game button</button></kit.ScreenStack>)
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    const focus = watchFocus()
    act(() => kit.screens.push('menu'))
    expect(focus.calls().some(quiet)).toBe(false)
    focus.done()
  })

  it('a mouse or touch start (no key, no pad) → the screen focuses without the ring', async () => {
    const kit = await freshKit()
    render(<kit.ScreenStack screens={testScreens}><button>Game button</button></kit.ScreenStack>)
    fireEvent.pointerDown(screen.getByText('Game button'), { pointerType: 'touch' })
    fireEvent.click(screen.getByText('Game button'))
    const focus = watchFocus()
    act(() => kit.screens.push('menu'))
    expect(document.activeElement).toBe(screen.getByText('Menu button'))
    expect(focus.calls().length).toBeGreaterThan(0)
    expect(focus.calls().every(quiet)).toBe(true)
    focus.done()
  })

  it('the latest kind of input wins: a tap after a key press is quiet again, a pad press after it rings again', async () => {
    const kit = await freshKit()
    render(<kit.ScreenStack screens={testScreens}><button>Game button</button></kit.ScreenStack>)
    fireEvent.keyDown(window, { key: 'Enter' })
    fireEvent.pointerDown(screen.getByText('Game button'))
    let focus = watchFocus()
    act(() => kit.screens.push('menu'))
    expect(focus.calls().every(quiet)).toBe(true)
    focus.done()
    act(() => kit.screens.pop())
    kit.markPadUsed()
    focus = watchFocus()
    act(() => kit.screens.push('shop'))
    expect(focus.calls().some(quiet)).toBe(false)
    focus.done()
  })
})

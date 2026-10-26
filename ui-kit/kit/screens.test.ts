import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screens } from './screens'

// Browser history moves a moment later (like a real browser), so wait for what it should show — never a fixed time
// (a 100 ms wait failed under load in sprint 40: "closing two screens at once" read the state mid-trip)
const waitFor = (check: () => void) => vi.waitFor(check, { timeout: 2000 })

beforeEach(async () => {
  while (screens.current.length) screens.pop()
  await waitFor(() => expect(history.state).toBeNull())
})

describe('screen stack', () => {
  it('push adds on top, pop takes the top off', () => {
    screens.push('settings')
    screens.push('quit')
    expect(screens.current).toEqual(['settings', 'quit'])
    screens.pop()
    expect(screens.current).toEqual(['settings'])
  })

  it('replace swaps only the top screen', () => {
    screens.push('menu')
    screens.push('settings')
    screens.replace('shop')
    expect(screens.current).toEqual(['menu', 'shop'])
  })

  it('replace with nothing open just opens the screen', () => {
    screens.replace('menu')
    expect(screens.current).toEqual(['menu'])
  })

  it('pop with nothing open is safe', () => {
    expect(() => screens.pop()).not.toThrow()
    expect(screens.current).toEqual([])
  })

  it('tells listeners when the stack changes', () => {
    let calls = 0
    const stop = screens.subscribe(() => calls++)
    screens.push('menu')
    screens.pop()
    stop()
    screens.push('menu')
    expect(calls).toBe(2)
  })

  it('browser Back closes the top screen', async () => {
    screens.push('settings')
    screens.push('quit')
    history.back()
    await waitFor(() => expect(screens.current).toEqual(['settings']))
    history.back()
    await waitFor(() => expect(screens.current).toEqual([]))
  })

  it('closing screens steps history back too, so Back is not wasted later', async () => {
    screens.push('settings')
    expect(history.state).toEqual({ kitScreens: 1 })
    screens.pop()
    await waitFor(() => expect(history.state).toBeNull())
  })

  it('closing two screens at once steps history back twice', async () => {
    screens.push('settings')
    screens.push('quit')
    screens.pop()
    screens.pop()
    await waitFor(() => expect(history.state).toBeNull())
    expect(screens.current).toEqual([])
  })

  it('Esc closes the top screen', () => {
    screens.push('settings')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(screens.current).toEqual([])
  })

  it('Esc while a tooltip (popover) is open only closes the tooltip, not the screen', () => {
    screens.push('settings')
    // The test page can't open real popovers, so pretend the browser found an open one.
    const tooltip = document.createElement('div')
    const find = vi.spyOn(document, 'querySelector').mockImplementation((selector) => (selector.includes(':popover-open') ? tooltip : null))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    find.mockRestore()
    expect(screens.current).toEqual(['settings'])
  })

  it('Esc already handled by something else (preventDefault) leaves the screen open', () => {
    screens.push('settings')
    const handled = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    handled.preventDefault()
    window.dispatchEvent(handled)
    expect(screens.current).toEqual(['settings'])
  })
})

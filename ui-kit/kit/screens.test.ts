import { beforeEach, describe, expect, it } from 'vitest'
import { screens } from './screens'

// Browser history moves a moment later (like a real browser), so wait for it.
const historySettles = () => new Promise((resolve) => setTimeout(resolve, 100))

beforeEach(async () => {
  while (screens.current.length) screens.pop()
  await historySettles()
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
    await historySettles()
    expect(screens.current).toEqual(['settings'])
    history.back()
    await historySettles()
    expect(screens.current).toEqual([])
  })

  it('closing screens steps history back too, so Back is not wasted later', async () => {
    screens.push('settings')
    expect(history.state).toEqual({ kitScreens: 1 })
    screens.pop()
    await historySettles()
    expect(history.state).toBeNull()
  })

  it('closing two screens at once steps history back twice', async () => {
    screens.push('settings')
    screens.push('quit')
    screens.pop()
    screens.pop()
    await historySettles()
    expect(screens.current).toEqual([])
    expect(history.state).toBeNull()
  })

  it('Esc closes the top screen', () => {
    screens.push('settings')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(screens.current).toEqual([])
  })
})

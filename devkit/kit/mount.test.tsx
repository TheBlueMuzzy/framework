// 0.17.1: keys typed inside the Dev Kit never reach the game's hotkeys (Goops: "curve" in Search swapped + rotated).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { keepKeysInside } from './mount'

afterEach(() => { document.body.innerHTML = '' })

describe('keepKeysInside', () => {
  it('a key in a Dev Kit box stays inside; the same key on the game still reaches window listeners', () => {
    const host = document.createElement('div')
    const box = document.createElement('input')
    host.appendChild(box)
    document.body.appendChild(host)
    keepKeysInside(host)
    const inHost = vi.fn()
    host.addEventListener('keydown', inHost) // stands in for React's listener on the root (added before ours in real life)
    const game = vi.fn()
    window.addEventListener('keydown', game)
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR', bubbles: true }))
    expect(game).not.toHaveBeenCalled()
    expect(inHost).toHaveBeenCalledOnce()
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR', bubbles: true }))
    expect(game).toHaveBeenCalledOnce()
    window.removeEventListener('keydown', game)
  })
})

// Bot speed is a live setting (UI kit 0.42.0, F191): the bots read botSpeed.get(), which starts from the player's
// saved Settings (the saves module) — so the speed they picked is still there after a reload. (That it follows the
// Settings screen at once is the UI kit's own test: kit/blocks/liveSetting.test.tsx.)
import { afterEach, describe, expect, it, vi } from 'vitest'

// A stand-in for the browser's localStorage (the unit tests run in Node, which has none)
function fakeLocalStorage() {
  const kept = new Map<string, string>()
  return {
    getItem: (key: string) => kept.get(key) ?? null,
    setItem: (key: string, value: string) => { kept.set(key, value) },
    removeItem: (key: string) => { kept.delete(key) },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('bot speed (Settings → Gameplay)', () => {
  it('starts at the row default, Normal', async () => {
    vi.stubGlobal('localStorage', fakeLocalStorage())
    vi.resetModules()
    const { botSpeed } = await import('./settings')
    expect(botSpeed.get()).toBe('Normal')
  })

  it('the speed the player picked survives a reload', async () => {
    vi.stubGlobal('localStorage', fakeLocalStorage())
    vi.resetModules()
    const before = await import('./saves')
    before.settingsSave.save({ botSpeed: 'Instant' })
    vi.resetModules() // the reload: every module runs again, reading what was saved
    const { botSpeed } = await import('./settings')
    expect(botSpeed.get()).toBe('Instant')
  })
})

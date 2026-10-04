import { describe, expect, it } from 'vitest'
import { maybeSay, quietMemory, type BanterSettings } from './banter'

const settings: BanterSettings = { chance: { tangledRival: 0.8, reveal: 1 }, cooldownTurns: 2, alwaysAllowed: ['reveal'] }
const lines = ['Gotcha!', 'Nowhere to go?', 'Squirm a little.']

describe('banter', () => {
  it('speaks about as often as chance × chattiness', () => {
    let rng = 1
    let spoke = 0
    for (let i = 0; i < 2000; i++) {
      const r = maybeSay('tangledRival', 0, 50, lines, quietMemory(), settings, rng)
      rng = r.rng
      if (r.line) spoke++
    }
    expect(spoke / 2000).toBeGreaterThan(0.36) // 0.8 × 50% = 40%
    expect(spoke / 2000).toBeLessThan(0.44)
    expect(maybeSay('tangledRival', 0, 0, lines, quietMemory(), settings, 1).line).toBeNull()
    expect(maybeSay('sneezed', 0, 100, lines, quietMemory(), settings, 1).line).toBeNull() // unlisted moment
  })

  it('stays quiet during the cooldown, except for moments that ignore it', () => {
    const mem = { lastSpokeTurn: 10, said: ['Gotcha!'] }
    const always = { ...settings, chance: { tangledRival: 1, reveal: 1 } }
    expect(maybeSay('tangledRival', 12, 100, lines, mem, always, 1).line).toBeNull()
    expect(maybeSay('tangledRival', 13, 100, lines, mem, always, 1).line).not.toBeNull()
    expect(maybeSay('reveal', 11, 100, ['Well played!'], mem, always, 1).line).toBe('Well played!')
  })

  it('never repeats a line until it has used them all, then reuses the oldest', () => {
    const always = { ...settings, chance: { tangledRival: 1 }, cooldownTurns: 0 }
    let mem = quietMemory()
    let rng = 3
    const heard: string[] = []
    for (let turn = 1; turn <= 4; turn++) {
      const r = maybeSay('tangledRival', turn, 100, lines, mem, always, rng)
      ;[mem, rng] = [r.memory, r.rng]
      heard.push(r.line!)
    }
    expect(new Set(heard.slice(0, 3)).size).toBe(3)
    expect(heard[3]).toBe(heard[0])
  })
})

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { liveFile, sendTuning } from './liveTuning'

describe('liveFile — a tuning import that follows the Dev Kit (what the Vite plugin hands the game)', () => {
  it('is the file until an edit arrives, then the edit, on every read', () => {
    const tank = liveFile('lf-tank', { speed: 2, look: { glow: 0.5 } })
    const readSpeed = () => tank.speed // read where it's used
    const look = () => tank.look
    expect(readSpeed()).toBe(2)
    sendTuning('lf-tank', { speed: 7, look: { glow: 0.1 } })
    expect(readSpeed()).toBe(7)
    expect(look().glow).toBe(0.1)
    expect(Object.keys(tank)).toEqual(['speed', 'look'])
    expect(JSON.parse(JSON.stringify(tank))).toEqual({ speed: 7, look: { glow: 0.1 } })
    expect('speed' in tank).toBe(true)
  })
  it('a copy made before the edit keeps the old value (why the live guard exists)', () => {
    const t = liveFile('lf-copy', { speed: 1 })
    const copied = t.speed
    sendTuning('lf-copy', { speed: 9 })
    expect(copied).toBe(1)
    expect(t.speed).toBe(9)
  })
  it('a file made later starts from the last edit; arrays and plain values come back as they are', () => {
    sendTuning('lf-later', { a: 3 })
    expect(liveFile('lf-later', { a: 1 }).a).toBe(3)
    const list = [1, 2]
    expect(liveFile('lf-list', list)).toBe(list)
  })
  it('costs little: a million reads well under a second', () => {
    const t = liveFile('lf-speed', { k: 1 })
    const start = performance.now()
    let sum = 0
    for (let i = 0; i < 1_000_000; i++) sum += t.k
    expect(sum).toBe(1_000_000)
    expect(performance.now() - start).toBeLessThan(1000)
  })
})

import { describe, expect, it } from 'vitest'
import { inlineThinker, makeThinker, serveThinking, thinkDelay, waitLeft, type Pace, type WorkerLike } from './pace'

const pace: Pace = { think: { turn: { min: 1, max: 2 }, default: { min: 0.5, max: 0.5 } }, speeds: { Slow: 0.5, Normal: 1, Fast: 2, Instant: 0 }, timeBudgetMs: 300 }

describe('pace', () => {
  it('waits a person-like moment, scaled by the speed setting', () => {
    let rng = 1
    for (let i = 0; i < 50; i++) {
      const d = thinkDelay(pace, 'turn', 'Normal', rng)
      rng = d.rng
      expect(d.ms).toBeGreaterThanOrEqual(1000)
      expect(d.ms).toBeLessThanOrEqual(2000)
    }
    expect(thinkDelay(pace, 'turn', 'Slow', 1).ms).toBe(thinkDelay(pace, 'turn', 'Normal', 1).ms * 2)
    expect(thinkDelay(pace, 'turn', 'Instant', 1).ms).toBe(0)
    expect(thinkDelay(pace, 'draft', 'Normal', 1).ms).toBe(500) // unknown kind → default
  })

  it('time spent thinking counts toward the moment', () => {
    expect(waitLeft(1200, 300)).toBe(900)
    expect(waitLeft(1200, 2000)).toBe(0)
  })
})

/** Two ends of a pretend worker, wired to each other (messages arrive later, like a real one). */
function fakeWorkerPair() {
  const listeners = { page: [] as ((e: { data: unknown }) => void)[], worker: [] as ((e: { data: unknown }) => void)[] }
  const page: WorkerLike = { postMessage: (m) => queueMicrotask(() => listeners.worker.forEach((l) => l({ data: m }))), addEventListener: (_t, l) => listeners.page.push(l) }
  const inside: WorkerLike = { postMessage: (m) => queueMicrotask(() => listeners.page.forEach((l) => l({ data: m }))), addEventListener: (_t, l) => listeners.worker.push(l) }
  return { page, inside }
}

describe('thinking in the background', () => {
  it('answers each request with its own result, errors as plain messages', async () => {
    const { page, inside } = fakeWorkerPair()
    serveThinking<number, number>(inside, (n) => {
      if (n < 0) throw new Error('no negative thoughts')
      return n * 2
    })
    const thinker = makeThinker<number, number>(page)
    await expect(Promise.all([thinker.think(1), thinker.think(5)])).resolves.toEqual([2, 10])
    await expect(thinker.think(-1)).rejects.toThrow('no negative thoughts')
  })

  it('after stop, nothing more is asked and late answers are dropped', async () => {
    const { page, inside } = fakeWorkerPair()
    serveThinking<number, number>(inside, (n) => n)
    const thinker = makeThinker<number, number>(page)
    const late = thinker.think(1)
    thinker.stop()
    let settled = false
    late.then(() => (settled = true), () => (settled = true))
    await new Promise((r) => setTimeout(r, 10))
    expect(settled).toBe(false)
    await expect(thinker.think(2)).rejects.toThrow(/stopped/)
  })

  it('inline thinker: same shape, no worker', async () => {
    const t = inlineThinker((n: number) => n + 1)
    await expect(t.think(1)).resolves.toBe(2)
    t.stop()
    await expect(t.think(1)).rejects.toThrow(/stopped/)
  })
})

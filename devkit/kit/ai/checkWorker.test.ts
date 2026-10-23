import { resolve } from 'node:path'
import { Worker } from 'node:worker_threads'
import { describe, expect, it } from 'vitest'
import { runCheckInWorker, serveCheck, type CheckWorkerLike } from './checkWorker'
import type { AiPersonality } from './aiTypes'

const bully: AiPersonality = { id: 'Bully', traits: { aggression: { min: 80, max: 95 } }, goals: ['TRAP'], nudge: 0.2, shifts: [], chattiness: 50 }
const skills = [{ id: 'FirstClass', candidates: 100 }]

/** Two ends of a pretend worker, wired to each other (messages arrive later, like a real one). */
function fakeWorkerPair() {
  type L = (e: { data: unknown }) => void
  const listeners = { page: [] as L[], worker: [] as L[], crash: [] as ((e: { message?: string }) => void)[] }
  let terminated = 0
  const on = (into: L[]) => ((t: string, l: L) => (t === 'error' ? listeners.crash.push(l as never) : into.push(l))) as CheckWorkerLike['addEventListener']
  const page: CheckWorkerLike = { postMessage: (m) => queueMicrotask(() => listeners.worker.forEach((l) => l({ data: m }))), addEventListener: on(listeners.page), terminate: () => void terminated++ }
  const inside: CheckWorkerLike = { postMessage: (m) => queueMicrotask(() => listeners.page.forEach((l) => l({ data: m }))), addEventListener: on(listeners.worker) }
  return { page, inside, crash: (message: string) => listeners.crash.forEach((l) => l({ message })), terminated: () => terminated }
}

/** A real Node worker thread, as the CheckWorkerLike the helper wants (a browser Worker already is one). */
function nodeWorker(): CheckWorkerLike {
  const w = new Worker(resolve('kit/ai/checkWorker.test.worker.ts')) // (from the devkit folder: jsdom's import.meta.url isn't a file)
  return {
    postMessage: (m) => w.postMessage(m),
    addEventListener: ((type: string, l: (e: { data?: unknown; message?: string }) => void) => (type === 'error' ? w.on('error', (e) => l({ message: e.message })) : w.on('message', (data) => l({ data })))) as CheckWorkerLike['addEventListener'],
    terminate: () => void w.terminate(),
  }
}

describe('Run check in a worker', () => {
  it('hands the job over, passes progress on, resolves with the report page and closes the worker', async () => {
    const pair = fakeWorkerPair()
    const asked: unknown[] = []
    serveCheck(pair.inside, async (job, onProgress) => {
      asked.push(job)
      onProgress(1, 2)
      onProgress(2, 2)
      return `<p>${job.games}</p>`
    })
    const progress: [number, number][] = []
    const html = await runCheckInWorker(() => pair.page, { games: 6, personalities: [bully], skills, onProgress: (d, t) => progress.push([d, t]) })
    expect(html).toBe('<p>6</p>')
    expect(progress).toEqual([[1, 2], [2, 2]])
    expect(asked).toEqual([{ games: 6, personalities: [bully], skills }]) // no onProgress: a function can't be posted
    expect(pair.terminated()).toBe(1)
  })

  it('a failing check, a crashed worker and one that will not start all reject in plain English', async () => {
    const failing = fakeWorkerPair()
    serveCheck(failing.inside, () => { throw new Error('no personalities to play') })
    await expect(runCheckInWorker(() => failing.page, { games: 6, personalities: [], skills, onProgress: () => {} })).rejects.toThrow('no personalities to play')
    const crashing = fakeWorkerPair() // nobody serves inside
    const waiting = runCheckInWorker(() => crashing.page, { games: 6, personalities: [bully], skills, onProgress: () => {} })
    crashing.crash('out of memory')
    await expect(waiting).rejects.toThrow('out of memory')
    expect(crashing.terminated()).toBe(1)
    await expect(runCheckInWorker(() => { throw new Error('no Worker here') }, { games: 6, personalities: [bully], skills, onProgress: () => {} })).rejects.toThrow("the check's worker didn't start: no Worker here")
  })

  it('in a real worker thread the main thread stays free while the games play', async () => {
    const gaps: number[] = []
    let last = performance.now()
    const tick = setInterval(() => {
      const now = performance.now()
      gaps.push(now - last)
      last = now
    }, 10)
    const progress: number[] = []
    const html = await runCheckInWorker(nodeWorker, { games: 10, personalities: [bully], skills, onProgress: (d) => progress.push(d) })
    clearInterval(tick)
    expect(html).toBe('<p>10 games: Bully</p>')
    expect(progress).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    // 10 games × 40 ms of busy work happened, yet the page's own timer never waited long (it would wait 400 ms on one thread)
    expect(gaps.length).toBeGreaterThan(15)
    expect(Math.max(...gaps.slice(1))).toBeLessThan(150)
    await expect(runCheckInWorker(nodeWorker, { games: 13, personalities: [bully], skills, onProgress: () => {} })).rejects.toThrow('unlucky number of games')
  }, 20000)
})

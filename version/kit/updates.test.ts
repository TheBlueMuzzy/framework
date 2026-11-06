// @vitest-environment node
// startUpdates — one test per case in .planning/SPRINT.md Notes (F193). A fake serviceWorker (navigator's) and a
// fake registerSW (vite-plugin-pwa's) stand in for the browser: each test fires what the browser would fire.
import { describe, expect, it, vi } from 'vitest'
import { startUpdates, type RegisterSWOptions } from './updates'

const ORIGIN = 'https://muzzy.example'
const BASE = '/glyphtender/'

/** A page: what worker runs it now (null = none), a fake registerSW that keeps its options, and a reload counter. */
function page(controllerScript: string | null, base = BASE) {
  const listeners: Array<() => void> = []
  const serviceWorker = {
    controller: controllerScript ? { scriptURL: controllerScript } : null,
    addEventListener: (type: string, fn: () => void) => { if (type === 'controllerchange') listeners.push(fn) },
  }
  let given: RegisterSWOptions | undefined
  const registerSW = vi.fn((options: RegisterSWOptions) => { given = options; return async () => {} })
  const reload = vi.fn()
  const start = (worker?: string) => startUpdates(registerSW, { worker, base, origin: ORIGIN, serviceWorker, reload })
  return {
    start, registerSW, reload,
    needReload: () => given?.onNeedReload?.(), // registerSW's "the new worker is in charge"
    controllerChange: () => listeners.forEach((fn) => fn()), // the browser's own "a new worker took over"
  }
}

describe('startUpdates', () => {
  it('hands registerSW immediate: true and its own onNeedReload (so registerSW never reloads by itself)', () => {
    const p = page(null)
    p.start()
    expect(p.registerSW).toHaveBeenCalledTimes(1)
    const options = p.registerSW.mock.calls[0][0]
    expect(options.immediate).toBe(true)
    expect(typeof options.onNeedReload).toBe('function')
  })

  it('case 1 — first visit (no worker yet): never reloads, whatever fires', () => {
    const p = page(null)
    expect(p.start().returning).toBe(false)
    p.needReload()
    p.controllerChange()
    expect(p.reload).not.toHaveBeenCalled()
  })

  it('case 2 — a returning player under our worker: a new build swaps the page once (registerSW\'s signal)', () => {
    const p = page(`${ORIGIN}${BASE}sw.js`)
    expect(p.start().returning).toBe(true)
    p.needReload()
    expect(p.reload).toHaveBeenCalledTimes(1)
  })

  it('case 2b — the new worker took over before registerSW was listening: the browser\'s controllerchange still swaps', () => {
    const p = page(`${ORIGIN}${BASE}sw.js`)
    p.start()
    p.controllerChange()
    expect(p.reload).toHaveBeenCalledTimes(1)
  })

  it('case 3 — a player coming from another worker address (Goops v1\'s /GOOPS/sw.js): no reload — it\'s their first visit of this game', () => {
    const p = page(`${ORIGIN}/GOOPS/sw.js`, '/GOOPS/')
    expect(p.start('goops-sw.js').returning).toBe(false)
    p.needReload()
    p.controllerChange()
    expect(p.reload).not.toHaveBeenCalled()
  })

  it('case 3b — the game\'s own worker under a custom name (goops-sw.js) counts as ours', () => {
    const p = page(`${ORIGIN}${BASE}goops-sw.js`)
    expect(p.start('goops-sw.js').returning).toBe(true)
    p.needReload()
    expect(p.reload).toHaveBeenCalledTimes(1)
  })

  it('reaches the game through index.ts too (the one import a game uses)', async () => {
    const index = await import('./index')
    expect(index.startUpdates).toBe(startUpdates)
  })

  it('case 4 — a browser with no service workers: registerSW still called (it checks for itself), nothing throws', () => {
    const registerSW = vi.fn(() => async () => {})
    const reload = vi.fn()
    const started = startUpdates(registerSW, { base: BASE, origin: ORIGIN, serviceWorker: undefined, reload })
    expect(started.returning).toBe(false)
    expect(registerSW).toHaveBeenCalledTimes(1)
    expect(reload).not.toHaveBeenCalled()
  })

  it('case 5 — both signals fire: ONE reload, never a loop', () => {
    const p = page(`${ORIGIN}${BASE}sw.js`)
    p.start()
    p.needReload()
    p.controllerChange()
    p.needReload()
    expect(p.reload).toHaveBeenCalledTimes(1)
  })

  it('gives back registerSW\'s own updater and our worker\'s full address', () => {
    const p = page(null)
    const started = p.start()
    expect(typeof started.update).toBe('function')
    expect(started.ourWorker).toBe(`${ORIGIN}${BASE}sw.js`)
  })
})

// @vitest-environment node
// checkUpdateArrives (F193) on a stand-in browser: it passes the fixed behaviour and catches each way it goes wrong.
import { describe, expect, it } from 'vitest'
import { checkUpdateArrives, nextVersion } from './e2e.mjs'

const URL = 'http://localhost:6400/game/'
const FIRST = 'v0.1.0.1'
const NEXT = 'v0.1.0.9999'

/**
 * A stand-in for a Playwright page in a fresh browser. mode:
 *  'fixed'               — first visit: one load, the worker takes over; returning: the cached build, then ONE swap
 *  'stays old'           — returning: the cached build forever (the race Goops' e2e caught: the plain registerSW line)
 *  'first visit reloads' — the first visit loads twice (registerSW's own reload under another worker)
 *  'loop'                — returning: swaps, and swaps again, and again
 *  'no worker'           — the worker never takes the page over (no offline cache in the build)
 */
function browser(mode) {
  let served = FIRST, shown = null, controller = null, cached = null, swapping = false
  const listeners = []
  const frame = { url: () => URL }
  const load = () => listeners.forEach((fn) => fn(frame))
  return {
    publish: () => { served = NEXT },
    page: {
      mainFrame: () => frame,
      on: (type, fn) => { if (type === 'framenavigated') listeners.push(fn) },
      goto: async () => {
        load()
        if (!controller) {
          shown = served
          if (mode !== 'no worker') { controller = `${URL}sw.js`; cached = served }
          if (mode === 'first visit reloads') load()
        } else {
          shown = cached
          swapping = mode !== 'stays old'
        }
      },
      waitForTimeout: async () => {
        if (!swapping) return
        load()
        shown = cached = served
        if (mode !== 'loop') swapping = false
      },
      evaluate: async () => controller,
      locator: () => ({ first: () => ({ getAttribute: async () => shown }) }),
    },
  }
}

const run = (mode) => {
  const b = browser(mode)
  return checkUpdateArrives(b.page, { url: URL, next: NEXT, publish: b.publish, timeout: 2_000, settle: 1_000 })
}
const failing = (result) => result.checks.filter((c) => !c.ok).map((c) => c.name)

describe('nextVersion', () => {
  it('the same version with build 9999 (or the one given)', () => {
    expect(nextVersion('v0.11.0.4')).toBe('v0.11.0.9999')
    expect(nextVersion('v0.11.0.4', 99)).toBe('v0.11.0.99')
  })
})

describe('checkUpdateArrives', () => {
  it('passes the fixed behaviour: one load on the first visit, the new build on the next, one swap', async () => {
    const result = await run('fixed')
    expect(failing(result)).toEqual([])
    expect(result).toMatchObject({ ok: true, first: FIRST, shown: NEXT, firstVisitLoads: 1, updateLoads: 2 })
  })

  it('catches a returning player left on the old build', async () => {
    const result = await run('stays old')
    expect(result.ok).toBe(false)
    expect(failing(result)).toEqual([`returning player gets the new build on THIS visit (${FIRST} → ${NEXT})`, 'returning player: settles — one swap at most, no loop'])
  })

  it('catches a first visit that reloads', async () => {
    const result = await run('first visit reloads')
    expect(failing(result)).toEqual(['first visit: ONE page load — never reloads'])
  })

  it('catches a reload loop', async () => {
    const result = await run('loop')
    expect(failing(result)).toEqual(['returning player: settles — one swap at most, no loop'])
  })

  it('catches a build with no worker', async () => {
    const result = await run('no worker')
    expect(failing(result)).toContain('first visit: the game\'s worker (sw.js) runs the page')
  })
})

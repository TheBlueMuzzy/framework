// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { check } from './conformance.mjs'

const tester = (files, run = () => ({ code: 0, out: '' })) => {
  const results = []
  const t = {
    files: () => files, run,
    pass: (name, detail) => results.push({ name, ok: true, detail }),
    fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
  }
  return { t, results }
}

describe('Table checks', () => {
  it('no game test calls selfTest → says which test to add', async () => {
    const { t, results } = tester([{ path: 'src/engine/rules.ts', text: 'selfTest(' }]) // not a test file
    await check(t)
    expect(results[0].ok).toBe(false)
    expect(results[0].fix).toContain("import { selfTest } from '../src/table/selfTest'")
  })
  it('runs the game\'s selfTest tests and passes or names the broken promise', async () => {
    const files = [{ path: 'src/engine/rules.test.ts', text: 'expect(selfTest(rules, setups, o)).toEqual([])' }]
    let ran = null
    const ok = tester(files, (cmd, args) => { ran = [cmd, ...args].join(' '); return { code: 0, out: '' } })
    await check(ok.t)
    expect(ran).toBe('npx vitest run src/engine/rules.test.ts')
    expect(ok.results[0]).toMatchObject({ ok: true, detail: 'src/engine/rules.test.ts' })
    const bad = tester(files, () => ({ code: 1, out: 'noise\n  - game 1, move 4: apply() changed the state it was given\n' }))
    await check(bad.t)
    expect(bad.results[0].problems).toContain('  - game 1, move 4: apply() changed the state it was given')
  })
})

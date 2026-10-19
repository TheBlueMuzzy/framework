// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { check } from './conformance.mjs'

function tester(adapterText) {
  const results = []
  const t = {
    has: () => true,
    adapterFile: () => 'src/devkit-game/gAdapter.ts',
    exists: () => true,
    read: () => adapterText,
    linesMatching: (files, re) => files.flatMap((f) => f.text.split('\n').map((l, i) => (re.test(l) ? `${f.path}:${i + 1}  ${l.trim()}` : null)).filter(Boolean)),
    pass: (name, detail) => results.push({ name, ok: true, detail }),
    fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
    skip: (name, why) => results.push({ name, skipped: true, why }),
  }
  return { t, results }
}

describe('Rooms checks', () => {
  it('canRestore that depends on being online passes; always-true fails with the line', async () => {
    const good = tester('  canRestore: () => !store.getState().online,')
    await check(good.t)
    expect(good.results[0].ok).toBe(true)
    const bad = tester('  canRestore: () => true, // offline game')
    await check(bad.t)
    expect(bad.results[0].ok).toBe(false)
    expect(bad.results[0].problems[1]).toContain('src/devkit-game/gAdapter.ts:1')
  })
})

// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { check } from './conformance.mjs'

function tester({ code = [], audioJson = true, devkit = true, engine = readFileSync(new URL('./engine.ts', import.meta.url), 'utf8') }) {
  const results = []
  const linesMatching = (files, re) => files.flatMap((f) => f.text.split('\n').map((l, i) => (re.test(l) ? `${f.path}:${i + 1}  ${l.trim()}` : null)).filter(Boolean))
  const t = {
    rel: 'src/audio', version: '0.3.0',
    exists: (p) => (p === 'content/audio.json' ? audioJson : p === 'src/audio/engine.ts'),
    read: () => engine,
    has: (id) => id === 'devkit' && devkit,
    gameCode: () => code, linesMatching,
    pass: (name, detail) => results.push({ name, ok: true, detail }),
    fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
    skip: (name, why) => results.push({ name, skipped: true, why }),
  }
  return { t, results }
}

describe('Audio checks', () => {
  it('this engine listens for the Dev Kit pause; a game that only says what happened passes', async () => {
    const { t, results } = tester({ code: [{ path: 'src/game/drop.ts', text: "playSound('seed.land')" }] })
    await check(t)
    expect(results.map((r) => r.ok)).toEqual([true, true])
  })
  it('names the file that plays its own sound, and an old engine', async () => {
    const { t, results } = tester({ code: [{ path: 'src/game/boom.ts', text: "new Audio('/audio/boom.mp3').play()" }], engine: 'old', audioJson: false })
    await check(t)
    expect(results[0].problems.join('\n')).toContain('src/game/boom.ts:1')
    expect(results[0].problems[0]).toContain('content/audio.json is missing')
    expect(results[1]).toMatchObject({ ok: false, fix: 'Update it: node <framework>/audio/scripts/install-audio.mjs .' })
  })
})

// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { main } from './audio-check.mjs'
import { check } from './conformance.mjs'
import { findFfmpeg } from './loudness.mjs'

const ffmpeg = findFfmpeg()

function tester({ code = [], audioJson = true, devkit = true, engine = readFileSync(new URL('./engine.ts', import.meta.url), 'utf8'), root = tmpdir(), ffmpeg = null }) {
  const results = []
  const linesMatching = (files, re) => files.flatMap((f) => f.text.split('\n').map((l, i) => (re.test(l) ? `${f.path}:${i + 1}  ${l.trim()}` : null)).filter(Boolean))
  const t = {
    root, rel: 'src/audio', version: '0.4.0', ffmpeg,
    exists: (p) => (p === 'content/audio.json' ? audioJson : p === 'src/audio/engine.ts'),
    read: () => engine,
    json: () => null,
    has: (id) => id === 'devkit' && devkit,
    gameCode: () => code, linesMatching,
    pass: (name, detail) => results.push({ name, ok: true, detail }),
    fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
    warn: (name, problems, fix) => results.push({ name, ok: true, warning: true, problems, fix }),
    skip: (name, why) => results.push({ name, skipped: true, why }),
  }
  return { t, results }
}

describe('Audio checks', () => {
  it('this engine listens for the Dev Kit pause; a game that only says what happened passes', async () => {
    const { t, results } = tester({ code: [{ path: 'src/game/drop.ts', text: "playSound('seed.land')" }] })
    await check(t)
    expect(results.slice(0, 2).map((r) => r.ok)).toEqual([true, true])
  })
  it('names the file that plays its own sound, and an old engine', async () => {
    const { t, results } = tester({ code: [{ path: 'src/game/boom.ts', text: "new Audio('/audio/boom.mp3').play()" }], engine: 'old', audioJson: false })
    await check(t)
    expect(results[0].problems.join('\n')).toContain('src/game/boom.ts:1')
    expect(results[0].problems[0]).toContain('content/audio.json is missing')
    expect(results[1]).toMatchObject({ ok: false, fix: 'Update it: node <framework>/audio/scripts/install-audio.mjs .' })
  })

  describe('every sound is as loud as the others and starts on time', () => {
    it('no ffmpeg on this computer: skipped with the install line, never a failure', async () => {
      const { t, results } = tester({ ffmpeg: null })
      await check(t)
      expect(results[2]).toMatchObject({ skipped: true })
      expect(results[2].why).toContain('winget install Gyan.FFmpeg')
    })
    it.skipIf(!ffmpeg)('no sounds yet: skipped', async () => {
      const root = mkdtempSync(join(tmpdir(), 'audio-conf-'))
      try {
        const { t, results } = tester({ root, ffmpeg })
        await check(t)
        expect(results[2]).toMatchObject({ skipped: true, why: 'no sound files in public/audio/ yet' })
      } finally { rmSync(root, { recursive: true, force: true }) }
    })
    it.skipIf(!ffmpeg)('a too-quiet file is a warning naming it and npm run audio:check -- --fix; after the fix it passes', async () => {
      const root = mkdtempSync(join(tmpdir(), 'audio-conf-'))
      try {
        mkdirSync(join(root, 'public/audio/sfx'), { recursive: true })
        execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'aevalsrc=0.02*sin(2*PI*700*t):s=44100:d=0.3', '-ac', '1', join(root, 'public/audio/sfx/sfx_test_quiet_01.mp3')])
        let { t, results } = tester({ root, ffmpeg })
        await check(t)
        expect(results[2]).toMatchObject({ ok: true, warning: true })
        expect(results[2].problems).toEqual([expect.stringMatching(/^public\/audio\/sfx\/sfx_test_quiet_01\.mp3 — 1\d\.\d dB too quiet$/)])
        expect(results[2].fix).toContain('npm run audio:check -- --fix')
        await main(['--fix', root], { log: () => {} })
        ;({ t, results } = tester({ root, ffmpeg }))
        await check(t)
        expect(results[2]).toMatchObject({ ok: true, detail: '1 sound within 3 dB of their targets' })
        expect(results[2].warning).toBeUndefined()
      } finally { rmSync(root, { recursive: true, force: true }) }
    }, 30000)
    it.skipIf(!ffmpeg)('an older check:framework (no t.warn) fails instead', async () => {
      const root = mkdtempSync(join(tmpdir(), 'audio-conf-'))
      try {
        mkdirSync(join(root, 'public/audio/ui'), { recursive: true })
        execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'aevalsrc=0.02*sin(2*PI*700*t):s=44100:d=0.3', '-ac', '1', join(root, 'public/audio/ui/ui_test_quiet_01.mp3')])
        const { t, results } = tester({ root, ffmpeg })
        delete t.warn
        await check(t)
        expect(results[2]).toMatchObject({ ok: false })
      } finally { rmSync(root, { recursive: true, force: true }) }
    }, 30000)
  })
})

// @vitest-environment node
// The report's parts are tested on made-up folders; the full run (measure → --fix → measure) needs ffmpeg and is
// skipped without it.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { formatTable, listSounds, main, originalOf, summarize } from './audio-check.mjs'
import { DEFAULT_LOUDNESS, findFfmpeg } from './loudness.mjs'

const ffmpeg = findFfmpeg()
if (!ffmpeg) console.log('ffmpeg is not installed — the full audio-check run is skipped (winget install Gyan.FFmpeg · brew install ffmpeg)')

let game
beforeEach(() => { game = mkdtempSync(join(tmpdir(), 'audio-check-game-')) })
afterEach(() => rmSync(game, { recursive: true, force: true }))
const put = (path, text = 'x') => { mkdirSync(join(game, path, '..'), { recursive: true }); writeFileSync(join(game, path), text) }

/** Every file under the game folder (forward slashes), for "nothing else was written" */
const allFiles = (dir = game, base = dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? allFiles(join(dir, e.name), base) : [join(dir, e.name).slice(base.length + 1).replaceAll('\\', '/')])

describe('finding the sounds', () => {
  it('lists every sound file under public/audio/, A–Z, with its folder; skips other files', () => {
    put('public/audio/ui/ui_tap_01.mp3')
    put('public/audio/sfx/sfx_pop_02.wav')
    put('public/audio/sfx/sfx_pop_01.mp3')
    put('public/audio/sfx/notes.txt')
    put('public/audio/stray.mp3')
    expect(listSounds(game).map((s) => [s.rel, s.folder])).toEqual([
      ['sfx/sfx_pop_01.mp3', 'sfx'], ['sfx/sfx_pop_02.wav', 'sfx'], ['stray.mp3', 'stray.mp3'], ['ui/ui_tap_01.mp3', 'ui'],
    ])
    expect(listSounds(join(game, 'nothing-here'))).toEqual([])
  })
  it('finds a kept original by name, whatever its type', () => {
    put('audio-originals/sfx/sfx_pop_01.wav')
    expect(originalOf(game, 'sfx/sfx_pop_01.mp3')).toMatch(/sfx_pop_01\.wav$/)
    expect(originalOf(game, 'sfx/sfx_pop_02.mp3')).toBeNull()
    expect(originalOf(game, 'ui/ui_tap_01.mp3')).toBeNull()
  })
})

describe('the report', () => {
  const m = (loudnessDb, peakDb = -6, onsetMs = 1) => ({ loudnessDb, peakDb, onsetMs, lengthMs: 250, method: 'active' })
  const rows = [
    { rel: 'sfx/sfx_pop_01.mp3', folder: 'sfx', measured: m(-18.2), verdict: { ok: true, problems: [], note: '' } },
    { rel: 'ui/ui_tap_01.mp3', folder: 'ui', measured: m(-24, -6, 60), verdict: { ok: false, problems: ['6.0 dB too quiet', 'starts 60 ms late'], note: '' } },
    { rel: 'mus/mus_theme_01.mp3', folder: 'mus', measured: { ...m(-17), method: 'lufs' }, verdict: { ok: true, problems: [], note: '' } },
  ]
  it('one line per file with its numbers and verdict', () => {
    const table = formatTable(rows).split('\n')
    expect(table[0]).toMatch(/^File\s+Folder\s+Loudness\s+Peak\s+Onset\s+Length\s+Verdict$/)
    expect(table[1]).toMatch(/^sfx\/sfx_pop_01\.mp3\s+sfx\s+-18\.2 dB\s+-6\.0 dB\s+1 ms\s+0\.25 s\s+✓$/)
    expect(table[2]).toMatch(/6\.0 dB too quiet, starts 60 ms late$/)
    expect(table[3]).toContain('-17.0 dB LUFS')
  })
  it('a summary line: how many, and what kind', () => {
    expect(summarize(rows, DEFAULT_LOUDNESS)).toBe('3 sounds · target -18 dB ±3 · ceiling -1 dB · 1 to even out (1 too quiet, 1 start late)')
    expect(summarize(rows.slice(0, 1), DEFAULT_LOUDNESS)).toMatch(/1 sound · .* all even ✓$/)
  })
})

describe('the command', () => {
  it('without ffmpeg: says how to install it, exit 1', async () => {
    const said = []
    expect(await main([game], { ffmpeg: null, log: (l) => said.push(l) })).toBe(1)
    expect(said.join('\n')).toContain('winget install Gyan.FFmpeg')
  })
  it('no sounds yet: says so, exit 0', async () => {
    const said = []
    expect(await main([game], { ffmpeg: 'ffmpeg', log: (l) => said.push(l) })).toBe(0)
    expect(said.join('\n')).toMatch(/No sound files in public\/audio\//)
  })

  it.skipIf(!ffmpeg)('reports, --fix evens out only the flagged files keeping their originals, and the next run is all even', async () => {
    // a quiet, late click (sfx), one already on target (ui), and a file in no sound folder
    const make = (path, filter) => {
      mkdirSync(join(game, path, '..'), { recursive: true })
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', filter, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k', join(game, path)])
    }
    make('public/audio/sfx/sfx_test_quiet_01.mp3', 'aevalsrc=if(gt(t\\,0.06)\\,0.01*sin(2*PI*800*t)\\,0):s=44100:d=0.4')
    make('public/audio/ui/ui_test_ok_01.mp3', 'aevalsrc=0.177*sin(2*PI*800*t):s=44100:d=0.3') // RMS ≈ -18
    make('public/audio/loose_01.mp3', 'aevalsrc=0.1*sin(2*PI*800*t):s=44100:d=0.2')
    const okBefore = readFileSync(join(game, 'public/audio/ui/ui_test_ok_01.mp3'))
    const quietBefore = readFileSync(join(game, 'public/audio/sfx/sfx_test_quiet_01.mp3'))

    const said = []
    const log = (l) => said.push(l)
    expect(await main([game], { log })).toBe(0) // a report: 0 even with flagged files
    let text = said.join('\n')
    expect(text).toMatch(/sfx\/sfx_test_quiet_01\.mp3 .*dB too quiet, starts 6\d ms late/)
    expect(text).toMatch(/ui\/ui_test_ok_01\.mp3 .*✓/)
    expect(text).toMatch(/loose_01\.mp3 .*not in a sound folder/)
    expect(text).toContain('npm run audio:check -- --fix')
    expect(existsSync(join(game, 'audio-originals'))).toBe(false) // the report alone writes nothing

    said.length = 0
    expect(await main(['--fix', game], { log })).toBe(0)
    text = said.join('\n')
    expect(text).toMatch(/--fix changed 1 file:/)
    expect(text).toMatch(/sfx\/sfx_test_quiet_01\.mp3: -4\d\.\d → -1[789]\.\d dB, trimmed 5\d ms · original: audio-originals\/sfx\/sfx_test_quiet_01\.mp3/)
    expect(text).toContain('All of them are even now ✓')
    // the original kept as it was; the on-target file and the loose one untouched; nothing else written
    expect(readFileSync(join(game, 'audio-originals/sfx/sfx_test_quiet_01.mp3')).equals(quietBefore)).toBe(true)
    expect(readFileSync(join(game, 'public/audio/ui/ui_test_ok_01.mp3')).equals(okBefore)).toBe(true)
    expect(allFiles().sort()).toEqual(['audio-originals/sfx/sfx_test_quiet_01.mp3', 'public/audio/loose_01.mp3', 'public/audio/sfx/sfx_test_quiet_01.mp3', 'public/audio/ui/ui_test_ok_01.mp3'])

    said.length = 0
    await main([game], { log })
    expect(said.join('\n')).toMatch(/sfx\/sfx_test_quiet_01\.mp3 .*✓/)
    // a second --fix never overwrites the kept original
    await main(['--fix', game], { log })
    expect(readFileSync(join(game, 'audio-originals/sfx/sfx_test_quiet_01.mp3')).equals(quietBefore)).toBe(true)
  }, 60000)

  it.skipIf(!ffmpeg)('reads the targets from content/audio.json', async () => {
    mkdirSync(join(game, 'public/audio/ui'), { recursive: true })
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'aevalsrc=0.177*sin(2*PI*800*t):s=44100:d=0.3', '-ac', '1', join(game, 'public/audio/ui/ui_test_ok_01.mp3')])
    put('content/audio.json', JSON.stringify({ loudness: { targets: { ui: -26 }, toleranceDb: 2 } }))
    const said = []
    await main([game], { log: (l) => said.push(l) })
    expect(said.join('\n')).toMatch(/ui_test_ok_01\.mp3 .*[78]\.\d dB too loud/)
    expect(said.join('\n')).toContain('±2')
  }, 30000)
})

// @vitest-environment node
// The report's parts are tested on made-up folders; the full run (measure → --fix → measure) needs ffmpeg and is
// skipped without it.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { changeLimits, formatTable, listSounds, main, originalOf, setJsonNumbers, summarize, tunedSounds, volumeMoves } from './audio-check.mjs'
import { DEFAULT_LOUDNESS, findFfmpeg, measureFile } from './loudness.mjs'

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
  it('two sounds with one name in two types (hit.mp3 + hit.ogg) each have their own original', () => {
    put('public/audio/sfx/hit.mp3')
    put('public/audio/sfx/hit.ogg')
    put('audio-originals/sfx/hit.mp3')
    expect(originalOf(game, 'sfx/hit.mp3')).toMatch(/hit\.mp3$/)
    expect(originalOf(game, 'sfx/hit.ogg')).toBeNull() // hit.mp3's original is not hit.ogg's
    put('audio-originals/sfx/hit.ogg')
    expect(originalOf(game, 'sfx/hit.ogg')).toMatch(/hit\.ogg$/)
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
    expect(summarize(rows, DEFAULT_LOUDNESS)).toBe('3 sounds · target -18 dB ±3 · ceiling -1 dB · 1 to even out (1 too quiet, 1 starts late)')
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

  it.skipIf(!ffmpeg)('a linked folder in audio-originals/ never leads a copy outside it', async () => {
    const outside = mkdtempSync(join(tmpdir(), 'audio-check-outside-'))
    try {
      mkdirSync(join(game, 'public/audio/sfx'), { recursive: true })
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'aevalsrc=0.01*sin(2*PI*800*t):s=44100:d=0.3', '-ac', '1', join(game, 'public/audio/sfx/sfx_test_quiet_01.mp3')])
      const before = readFileSync(join(game, 'public/audio/sfx/sfx_test_quiet_01.mp3'))
      mkdirSync(join(game, 'audio-originals'))
      symlinkSync(outside, join(game, 'audio-originals/sfx'), 'junction')
      const said = []
      expect(await main(['--fix', game], { log: (l) => said.push(l) })).toBe(1)
      expect(said.join('\n')).toMatch(/Not allowed: .*outside audio-originals\//)
      expect(readdirSync(outside)).toEqual([])
      expect(readFileSync(join(game, 'public/audio/sfx/sfx_test_quiet_01.mp3')).equals(before)).toBe(true) // untouched
    } finally { rmSync(outside, { recursive: true, force: true }) }
  }, 30000)

  it.skipIf(!ffmpeg)('a sound on target whose only problem is one spike over the ceiling is fixed, not flagged forever', async () => {
    mkdirSync(join(game, 'public/audio/sfx'), { recursive: true })
    // RMS ≈ -18.4 (on target) with a 0.2 ms spike near 0 dBFS (over the -1 ceiling)
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'aevalsrc=0.17*sin(2*PI*800*t)+if(between(t\\,0.15\\,0.1502)\\,0.8\\,0):s=44100:d=0.4', '-ac', '1', '-c:a', 'pcm_s16le', join(game, 'public/audio/sfx/sfx_test_spike_01.wav')])
    const said = []
    const log = (l) => said.push(l)
    await main([game], { log })
    expect(said.join('\n')).toMatch(/sfx_test_spike_01\.wav .*peaks .*over/)
    said.length = 0
    await main(['--fix', game], { log })
    expect(said.join('\n')).not.toContain('left as it was')
    said.length = 0
    await main([game], { log })
    expect(said.join('\n')).toMatch(/sfx_test_spike_01\.wav .*✓/)
  }, 30000)

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

// F169: a game that balanced its mix by ear (a sound's own volumeDb) keeps it — --fix moves each file's change into
// the volumeDb of the sounds that play it, so what the player hears stays the same.
describe('keeping the tuned mix', () => {
  // Glyphtender's real content/audio.json (2026-10-30, eb032a7): the layout every edit must keep
  const glyphtenderText = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'glyphtender-audio.test.json'), 'utf8')
  const glyphtender = JSON.parse(glyphtenderText)

  it('finds every sound and music layer that sets its own volumeDb, with its files; a sound without one is left out', () => {
    const tuned = tunedSounds({
      sounds: {
        'seed.land': { files: ['sfx/a_01.mp3', 'sfx/a_02.mp3'], volumeDb: -3 },
        'plain': { files: ['sfx/b_01.mp3'] },
        'zero': { files: ['sfx/c_01.mp3'], volumeDb: 0 },
        '_note': { files: ['sfx/d_01.mp3'], volumeDb: -2 },
      },
      music: { tracks: { garden: { layers: { harp: { file: 'mus/harp.mp3', volumeDb: -2 }, pad: { files: ['mus/pad.mp3'], volumeDb: -8 }, bells: { file: 'mus/bells.mp3' } } } } },
    })
    expect(tuned.map((s) => [s.name, s.path, s.volumeDb, s.files])).toEqual([
      ['seed.land', ['sounds', 'seed.land', 'volumeDb'], -3, ['sfx/a_01.mp3', 'sfx/a_02.mp3']],
      ['zero', ['sounds', 'zero', 'volumeDb'], 0, ['sfx/c_01.mp3']],
      ['music garden · harp', ['music', 'tracks', 'garden', 'layers', 'harp', 'volumeDb'], -2, ['mus/harp.mp3']],
      ['music garden · pad', ['music', 'tracks', 'garden', 'layers', 'pad', 'volumeDb'], -8, ['mus/pad.mp3']],
    ])
    expect(tunedSounds(null)).toEqual([])
    expect(tunedSounds(glyphtender).find((s) => s.name === 'sprout.grow')).toMatchObject({ volumeDb: -8, files: ['sfx/sfx_sprout_leaf_01.mp3', 'sfx/sfx_sprout_leaf_02.mp3'] })
  })

  it('a sound with volumeDb -3 whose file is evened 6 dB down gets volumeDb +3 — heard the same', () => {
    const tuned = tunedSounds({ sounds: { 'seed.land': { files: ['sfx/land_01.mp3'], volumeDb: -3 } } })
    expect(volumeMoves(tuned, { 'sfx/land_01.mp3': -6 })).toEqual([{ name: 'seed.land', path: ['sounds', 'seed.land', 'volumeDb'], from: -3, to: 3, byDb: 6 }])
    expect(volumeMoves(tuned, {})).toEqual([]) // nothing changed: nothing moves
  })

  it("variants: the sound moves by its files' average change (an unchanged variant counts as 0), so it sounds as loud on average", () => {
    const tuned = tunedSounds({ sounds: { 'seed.land': { files: ['sfx/l_01.mp3', 'sfx/l_02.mp3'], volumeDb: -3 }, 'step': { files: ['sfx/s_01.mp3', 'sfx/s_02.mp3'], volumeDb: -8 } } })
    expect(volumeMoves(tuned, { 'sfx/l_01.mp3': -6, 'sfx/l_02.mp3': -5 }).map((m) => [m.name, m.to])).toEqual([['seed.land', 2.5]])
    expect(volumeMoves(tuned, { 'sfx/s_01.mp3': 13 }).map((m) => [m.name, m.to])).toEqual([['step', -14.5]])
  })

  it("a file two sounds play moves both their volumeDb; a sound with no volumeDb of its own isn't given one", () => {
    const tuned = tunedSounds({ sounds: {
      'ui.toggle.on': { files: ['ui/flip.mp3'], volumeDb: -6 }, 'ui.toggle.off': { files: ['ui/flip.mp3'], volumeDb: -6 }, 'other': { files: ['ui/flip.mp3'] },
    } })
    expect(volumeMoves(tuned, { 'ui/flip.mp3': 4.3 }).map((m) => [m.name, m.to])).toEqual([['ui.toggle.on', -10.3], ['ui.toggle.off', -10.3]])
  })

  it("how far a file may change so every volumeDb that plays it stays in -40…6 (the Dev Kit's range)", () => {
    const tuned = tunedSounds({ sounds: { a: { files: ['sfx/x.mp3'], volumeDb: 0 }, b: { files: ['sfx/x.mp3'], volumeDb: -38 }, c: { files: ['sfx/y.mp3'] } } })
    expect(changeLimits(tuned, 'sfx/x.mp3')).toEqual({ lowestDb: -6, highestDb: 2 }) // a can rise to +6; b can fall to -40
    expect(changeLimits(tuned, 'sfx/y.mp3')).toEqual({ lowestDb: -Infinity, highestDb: Infinity }) // nobody's tuned mix
  })

  it('writes only the numbers it changes — every other byte of the file (layout, order, notes, one-line objects) stays', () => {
    const edits = [
      { path: ['sounds', 'seed.land', 'volumeDb'], value: 3 },
      { path: ['sounds', 'sprout.grow', 'volumeDb'], value: -21.4 },
      { path: ['music', 'tracks', 'garden', 'layers', 'pad', 'volumeDb'], value: -2.5 },
    ]
    const text = setJsonNumbers(glyphtenderText, edits)
    const expected = structuredClone(glyphtender)
    expected.sounds['seed.land'].volumeDb = 3
    expected.sounds['sprout.grow'].volumeDb = -21.4
    expected.music.tracks.garden.layers.pad.volumeDb = -2.5
    expect(JSON.parse(text)).toEqual(expected)
    const before = glyphtenderText.split('\n')
    const after = text.split('\n')
    expect(after.length).toBe(before.length)
    const differ = before.map((line, i) => [line, after[i]]).filter(([a, b]) => a !== b)
    expect(differ).toEqual([
      ['      "volumeDb": -3,', '      "volumeDb": 3,'],
      ['      "volumeDb": -8,', '      "volumeDb": -21.4,'],
      ['          "pad": { "file": "mus/mus_garden_pad_loop.mp3", "volumeDb": -8 },', '          "pad": { "file": "mus/mus_garden_pad_loop.mp3", "volumeDb": -2.5 },'],
    ])
    // the -8 that changed is sprout.grow's, not one of the other -8s
    expect(after.indexOf('      "volumeDb": -21.4,')).toBeGreaterThan(after.indexOf('    "sprout.grow": {'))
    expect(after.indexOf('      "volumeDb": -21.4,')).toBeLessThan(after.indexOf('    "score.pop": {'))
    expect(setJsonNumbers(glyphtenderText, [])).toBe(glyphtenderText)
  })

  it("keeps Windows line endings, and refuses a path that isn't a number", () => {
    const crlf = '{\r\n  "sounds": {\r\n    "a": { "files": ["sfx/a.mp3"], "volumeDb": -6 }\r\n  }\r\n}\r\n'
    expect(setJsonNumbers(crlf, [{ path: ['sounds', 'a', 'volumeDb'], value: 0.5 }])).toBe(crlf.replace('-6', '0.5'))
    expect(() => setJsonNumbers(crlf, [{ path: ['sounds', 'b', 'volumeDb'], value: 1 }])).toThrow(/sounds\.b\.volumeDb/)
    expect(() => setJsonNumbers(crlf, [{ path: ['sounds', 'a', 'files'], value: 1 }])).toThrow(/not a number/)
  })

  it.skipIf(!ffmpeg)("--fix: a sound with volumeDb -3 that's 6 dB too loud → file evened, its volumeDb raised by 6, heard the same; a sound without volumeDb as before", async () => {
    const make = (path, amplitude) => {
      mkdirSync(join(game, path, '..'), { recursive: true })
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `aevalsrc=${amplitude}*sin(2*PI*800*t):s=44100:d=0.4`, '-ac', '1', '-c:a', 'pcm_s16le', join(game, path)])
    }
    make('public/audio/sfx/sfx_land_01.wav', 0.354) // RMS ≈ -12: 6 dB over -18
    make('public/audio/sfx/sfx_plain_01.wav', 0.354)
    const json = [
      '{',
      '  "_help": { "sounds.land": "The seed lands." },',
      '  "sounds": {',
      '    "land": { "files": ["sfx/sfx_land_01.wav"], "volumeDb": -3 },',
      '    "plain": {',
      '      "files": ["sfx/sfx_plain_01.wav"]',
      '    }',
      '  }',
      '}',
      '',
    ].join('\n')
    put('content/audio.json', json)
    const said = []
    const log = (l) => said.push(l)
    // the report says the tuned sound keeps its in-game level (it's the file that's off, not the mix)
    expect(await main([game], { log })).toBe(0)
    expect(said.join('\n')).toContain("1 of their sounds set their own volumeDb (tuned by ear): --fix moves each file's change into it, so they sound the same in the game.")
    said.length = 0
    expect(await main(['--fix', game], { log })).toBe(0)
    const text = said.join('\n')
    const after = readFileSync(join(game, 'content/audio.json'), 'utf8')
    const moved = JSON.parse(after).sounds.land.volumeDb
    expect(moved).toBeGreaterThan(2.4)
    expect(moved).toBeLessThan(3.6)
    expect(after).toBe(json.replace('"volumeDb": -3', `"volumeDb": ${moved}`)) // only that number changed
    expect(JSON.parse(after).sounds.plain.volumeDb).toBeUndefined() // no volumeDb of its own: none given, as today
    expect(text).toContain('content/audio.json: volumeDb moved so the game sounds the same')
    expect(text).toContain(`land: -3 → ${moved} dB`)
    // heard = the file + volumeDb: the same as before (within 0.5 dB), and the file itself is even
    const land = await measureFile(ffmpeg, join(game, 'public/audio/sfx/sfx_land_01.wav'), 'sfx')
    const landBefore = await measureFile(ffmpeg, join(game, 'audio-originals/sfx/sfx_land_01.wav'), 'sfx')
    expect(Math.abs((land.loudnessDb + moved) - (landBefore.loudnessDb - 3))).toBeLessThan(0.5)
    expect(Math.abs(land.loudnessDb + 18)).toBeLessThan(0.5)
    // a second run: all even, nothing moves again
    said.length = 0
    expect(await main(['--fix', game], { log })).toBe(0)
    expect(readFileSync(join(game, 'content/audio.json'), 'utf8')).toBe(after)
    expect(said.join('\n')).not.toContain('volumeDb moved')
  }, 60000)

  it.skipIf(!ffmpeg)("--fix goes only as far as a volumeDb's range lets it: +4 can take 2 dB more, so a file 6 dB too loud comes down 2", async () => {
    mkdirSync(join(game, 'public/audio/sfx'), { recursive: true })
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'aevalsrc=0.354*sin(2*PI*800*t):s=44100:d=0.4', '-ac', '1', '-c:a', 'pcm_s16le', join(game, 'public/audio/sfx/sfx_hot_01.wav')])
    put('content/audio.json', JSON.stringify({ sounds: { hot: { files: ['sfx/sfx_hot_01.wav'], volumeDb: 4 } } }, null, 2))
    const said = []
    expect(await main(['--fix', game], { log: (l) => said.push(l) })).toBe(0)
    const text = said.join('\n')
    expect(text).toMatch(/sfx_hot_01\.wav: -12\.\d → -1[34]\.\d dB .*its volumeDb can't go past -40…6 dB/)
    expect(text).toMatch(/still: [34]\.\d dB too loud/)
    const volumeDb = JSON.parse(readFileSync(join(game, 'content/audio.json'), 'utf8')).sounds.hot.volumeDb
    expect(volumeDb).toBeGreaterThan(5.4)
    expect(volumeDb).toBeLessThanOrEqual(6)
  }, 60000)
})

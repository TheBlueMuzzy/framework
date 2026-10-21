// @vitest-environment node
// The measuring is tested with made-up samples (no ffmpeg). The file tests need ffmpeg and are skipped without it.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  activeDbOf, DEFAULT_LOUDNESS, decode, findFfmpeg, fixArgs, FFMPEG_MISSING, judge, lufsOf, measure, measureFile,
  onsetMsOf, peakOf, planFix, readLoudness, runFfmpeg, toDb,
} from './loudness.mjs'

const RATE = 44100
const ffmpeg = findFfmpeg()
if (!ffmpeg) console.log('ffmpeg is not installed — the file tests are skipped (winget install Gyan.FFmpeg · brew install ffmpeg)')

/** `silenceMs` of nothing, then a sine at `hz` and level `amp` for `toneMs` */
function tone({ silenceMs = 0, toneMs = 500, hz = 1000, amp = 0.5 } = {}) {
  const silent = Math.round((silenceMs / 1000) * RATE)
  const out = new Float32Array(silent + Math.round((toneMs / 1000) * RATE))
  for (let i = silent; i < out.length; i++) out[i] = amp * Math.sin((2 * Math.PI * hz * (i - silent)) / RATE)
  return out
}

describe('readLoudness — content/audio.json "loudness", defaults for the rest', () => {
  it('no block → the defaults, no warnings', () => {
    expect(readLoudness(null)).toEqual({ settings: DEFAULT_LOUDNESS, warnings: [] })
    expect(readLoudness({ buses: {} }).settings).toEqual(DEFAULT_LOUDNESS)
  })
  it('takes what is given and keeps the defaults for the rest', () => {
    const { settings, warnings } = readLoudness({ loudness: { targets: { ui: -22 }, toleranceDb: 2 } })
    expect(settings.targets).toEqual({ ...DEFAULT_LOUDNESS.targets, ui: -22 })
    expect(settings.toleranceDb).toBe(2)
    expect(settings.ceilingDb).toBe(-1)
    expect(warnings).toEqual([])
  })
  it('names a bad value and uses the default', () => {
    const { settings, warnings } = readLoudness({ loudness: { targets: { sfx: 'loud', voice: -10 }, ceilingDb: 3 } })
    expect(settings.targets.sfx).toBe(-18)
    expect(settings.ceilingDb).toBe(-1)
    expect(warnings.join('\n')).toMatch(/targets\.sfx.*using -18/)
    expect(warnings.join('\n')).toMatch(/targets\.voice is not a sound folder/)
    expect(warnings.join('\n')).toMatch(/ceilingDb/)
    expect(readLoudness({ loudness: [] }).warnings[0]).toMatch(/should be an object/)
  })
  it('the starter content/audio.json spells out exactly these defaults (and a note for each)', () => {
    const template = JSON.parse(readFileSync(new URL('../templates/content/audio.json', import.meta.url), 'utf8'))
    expect(template.loudness).toEqual(DEFAULT_LOUDNESS)
    expect(readLoudness(template).warnings).toEqual([])
    for (const key of [...Object.keys(DEFAULT_LOUDNESS.targets).map((f) => `targets.${f}`), 'toleranceDb', 'ceilingDb', 'lateMs']) {
      expect(template._help[`loudness.${key}`], key).toBeTruthy()
      expect(template._labels[`loudness.${key}`], key).toBeTruthy()
    }
  })
  it('never changes the defaults themselves', () => {
    readLoudness({ loudness: { targets: { sfx: -30 } } })
    expect(DEFAULT_LOUDNESS.targets.sfx).toBe(-18)
  })
})

describe('measuring samples', () => {
  it('peak and onset (the first sample at 10 % of the peak)', () => {
    const s = tone({ silenceMs: 60, amp: 0.5 })
    expect(toDb(peakOf(s))).toBeCloseTo(-6.02, 1)
    expect(onsetMsOf(s, RATE)).toBeGreaterThanOrEqual(60)
    expect(onsetMsOf(s, RATE)).toBeLessThan(61)
    expect(onsetMsOf(new Float32Array(100), RATE)).toBe(0)
  })
  it('active loudness: a sine at 0.5 is -9 dB, however much silence is around it', () => {
    expect(activeDbOf(tone({ amp: 0.5 }), RATE)).toBeCloseTo(-9.03, 1)
    expect(activeDbOf(tone({ amp: 0.5, silenceMs: 2000 }), RATE)).toBeCloseTo(-9.03, 1)
    expect(activeDbOf(new Float32Array(1000), RATE)).toBe(-Infinity)
  })
  it('active loudness ignores a quiet tail 20 dB under the hit', () => {
    const hit = tone({ toneMs: 100, amp: 0.5 })
    const withTail = new Float32Array(hit.length * 10)
    withTail.set(hit)
    for (let i = hit.length; i < withTail.length; i++) withTail[i] = 0.01 * Math.sin(i) // -40 dB hiss
    expect(activeDbOf(withTail, RATE)).toBeCloseTo(-9.03, 0)
  })
  it('LUFS: the standard\'s own check — a 1 kHz sine at full scale reads -3.01 LUFS; stereo adds the two sides', () => {
    expect(lufsOf([tone({ amp: 1, toneMs: 2000 })], RATE)).toBeCloseTo(-3.01, 1)
    expect(lufsOf([tone({ amp: 0.1, toneMs: 2000 })], RATE)).toBeCloseTo(-23.01, 1)
    const side = tone({ amp: 0.1, toneMs: 2000 })
    expect(lufsOf([side, side], RATE)).toBeCloseTo(-20, 1)
    expect(lufsOf([new Float32Array(RATE)], RATE)).toBe(-Infinity)
  })
  it('LUFS leaves out the quiet parts (the gates)', () => {
    const music = tone({ amp: 0.1, toneMs: 3000 })
    const withSilence = new Float32Array(music.length * 2)
    withSilence.set(music)
    expect(lufsOf([withSilence], RATE)).toBeCloseTo(lufsOf([music], RATE), 0)
  })
  it('measure picks the method by folder', () => {
    const s = tone({ amp: 0.5, toneMs: 1000, silenceMs: 30 })
    expect(measure([s], RATE, 'sfx')).toMatchObject({ method: 'active', lengthMs: 1030 })
    expect(measure([s, s], RATE, 'mus').method).toBe('lufs')
  })
})

describe('the verdict and the fix', () => {
  const at = (loudnessDb, peakDb, onsetMs = 0) => ({ loudnessDb, peakDb, onsetMs, lengthMs: 300, method: 'active' })
  const S = DEFAULT_LOUDNESS
  it('within the tolerance is fine', () => {
    expect(judge(at(-19.5, -6), 'sfx', S)).toEqual({ ok: true, problems: [], note: '' })
  })
  it('names how far off, a hot peak and a late start', () => {
    expect(judge(at(-21.5, -8), 'sfx', S).problems).toEqual(['3.5 dB too quiet'])
    expect(judge(at(-12, -0.2, 60), 'ui', S).problems).toEqual(['6.0 dB too loud', 'peaks 0.8 dB over -1 dB', 'starts 60 ms late'])
    expect(judge(at(-18, -6, 60), 'mus', S).ok).toBe(true) // music may start softly
    expect(judge(at(-Infinity, -Infinity), 'sfx', S).problems).toEqual(['silent'])
  })
  it('gain to target; a spiky file is shaved at most 3.5 dB and ends a little quieter', () => {
    expect(planFix(at(-24, -12, 30), 'sfx', S)).toEqual({ gainDb: 6, trimMs: 26, peakLimited: false })
    const spiky = planFix(at(-28, -1.5), 'sfx', S) // wants +10, the peak allows -1.5 + 3.5 + 1.5 = 3.5
    expect(spiky.gainDb).toBeCloseTo(3.5)
    expect(spiky.peakLimited).toBe(true)
    expect(planFix(at(-18, -6, 50), 'mus', S).trimMs).toBe(0)
  })
  it('a file evened out once gets no more limiting — and is not flagged forever', () => {
    const quietSpiky = at(-22, -1.6)
    expect(judge(quietSpiky, 'sfx', S).ok).toBe(false) // first time: it can still be raised
    const again = judge(quietSpiky, 'sfx', S, { fixedBefore: true })
    expect(again.ok).toBe(true)
    expect(again.note).toMatch(/as loud as its spikes allow/)
  })
  it('ffmpeg settings: trim + gain + limiter, MP3 like the Dev Kit drop', () => {
    const args = fixArgs('in.mp3', 'out.mp3', 'sfx', { gainDb: 3.25, trimMs: 26 }, S).join(' ')
    expect(args).toContain('atrim=start=0.0260,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.003,volume=3.25dB,alimiter=limit=0.8414')
    expect(args).toContain('-ac 1 -ar 44100 -c:a libmp3lame -b:a 96k out.mp3')
    const music = fixArgs('in.mp3', 'out.mp3', 'mus', { gainDb: -2, trimMs: 0 }, S).join(' ')
    expect(music).not.toContain('atrim')
    expect(music).toContain('-ac 2 -ar 44100 -c:a libmp3lame -b:a 128k')
  })
})

describe('files (ffmpeg)', () => {
  it('without ffmpeg: found missing, with the install line', () => {
    expect(findFfmpeg('surely-not-a-real-ffmpeg-command')).toBeNull()
    expect(FFMPEG_MISSING).toContain('winget install Gyan.FFmpeg')
  })
  it.skipIf(!ffmpeg)('measures a made sound, fixes it to target, and the fixed file measures on target', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'loudness-'))
    try {
      const quiet = join(dir, 'quiet.wav')
      // 60 ms of silence, then a 1 kHz tone at -30 dB peak (active -33)
      await runFfmpeg(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono:d=0.06', '-f', 'lavfi', '-i', 'aevalsrc=0.0316*sin(2*PI*1000*t):s=44100:d=0.3', '-filter_complex', '[0][1]concat=n=2:v=0:a=1', quiet])
      const before = await measureFile(ffmpeg, quiet, 'sfx')
      expect(before.loudnessDb).toBeCloseTo(-33, 0)
      expect(before.onsetMs).toBeGreaterThan(55)
      expect(judge(before, 'sfx', DEFAULT_LOUDNESS).problems).toEqual([expect.stringMatching(/^1[45]\.\d dB too quiet$/), 'starts 60 ms late'])
      const fixed = join(dir, 'fixed.mp3')
      await runFfmpeg(ffmpeg, fixArgs(quiet, fixed, 'sfx', planFix(before, 'sfx', DEFAULT_LOUDNESS), DEFAULT_LOUDNESS))
      const after = await measureFile(ffmpeg, fixed, 'sfx')
      expect(judge(after, 'sfx', DEFAULT_LOUDNESS)).toMatchObject({ ok: true })
      expect(Math.abs(after.loudnessDb + 18)).toBeLessThan(1)
      expect((await decode(ffmpeg, fixed, 2)).length).toBe(2)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30000)
})

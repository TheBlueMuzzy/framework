// HOW LOUD IS A SOUND FILE? — the audio module's one loudness matcher (framework F31). Plain Node, no packages.
// Used by audio-check.mjs (npm run audio:check), the check:framework audio warning (conformance.mjs) and the
// Dev Kit's Sound tab drop (it loads this file from the game's src/audio/).
//
// What it measures, per file (design: framework/.planning/design/audio.md "Loudness"):
//   loudnessDb  how loud it sounds —
//                 effects, menus, stingers (sfx · ui · stg): the "active loudness" (Goops F29): the average power of
//                   the 20 ms slices within 20 dB of the loudest slice. Short sounds are mostly silence and one hit,
//                   so a plain average (or LUFS, which needs 400 ms blocks) reads a click as far too quiet.
//                 music + ambience (mus · amb): LUFS (EBU R128 / ITU BS.1770) — the broadcast and games standard,
//                   made for long sounds: K-weighted (like the ear), 400 ms blocks, quiet blocks left out.
//   peakDb      the loudest single sample (dBFS, 0 = the most a file can hold)
//   onsetMs     where the sound really starts: the first sample at 10 % of the peak (Glyphtender B026)
//   lengthMs    how long the file is
// Then: the gain that brings it to its folder's target, and the ffmpeg settings that apply it (gain + a fast limiter
// so the spikes stay under the ceiling, + the onset trim for effects and menus).
//
// The pure parts (measuring samples, the verdict, the gain) are tested with made-up samples. Reading and writing files
// uses the computer's own ffmpeg (or FFMPEG_PATH) — never a bundled copy.
import { execFile, spawnSync } from 'node:child_process'

// ---------- the settings (content/audio.json "loudness") ----------

/** The sound folders under public/audio/ */
export const FOLDERS = ['sfx', 'ui', 'stg', 'amb', 'mus']
/** Music and ambience: long, measured in LUFS, never trimmed. The rest: short, active loudness, trimmed to the onset. */
export const isLongFolder = (folder) => folder === 'mus' || folder === 'amb'

/**
 * The defaults when content/audio.json has no "loudness" block. Every file is brought to the SAME level (-18): the
 * files are even, and the mix (menus under effects, music under both) is done by the volume groups ("buses").
 */
export const DEFAULT_LOUDNESS = {
  targets: { sfx: -18, ui: -18, stg: -18, amb: -18, mus: -18 },
  toleranceDb: 3, // further off than this = flagged
  ceilingDb: -1, // no sample louder than this (the games / broadcast standard is -1)
  lateMs: 20, // an effect or menu sound that starts later than this = flagged
}

/** How much of a spike the limiter may shave. A spikier file ends up a little quieter instead of squashed. */
export const MAX_LIMITING_DB = 3.5
/** The limiter sits this far under the ceiling: an MP3 can come out a little hotter than what went in */
export const LIMITER_MARGIN_DB = 0.5
/** The onset trim keeps this much before the onset, then fades in over ONSET_FADE_MS (the same rule as the Dev Kit drop) */
export const ONSET_LEAD_MS = 4
export const ONSET_FADE_MS = 3

const isNumber = (v) => typeof v === 'number' && Number.isFinite(v)

/**
 * content/audio.json → the loudness settings (defaults for anything missing). A bad value is named in `warnings`
 * and the default is used. `audioJson` may be null (no file).
 */
export function readLoudness(audioJson) {
  const settings = structuredClone(DEFAULT_LOUDNESS)
  const warnings = []
  const raw = audioJson && typeof audioJson === 'object' ? audioJson.loudness : undefined
  if (raw === undefined) return { settings, warnings }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    warnings.push('loudness should be an object like { "targets": { "sfx": -18 } } — using the defaults.')
    return { settings, warnings }
  }
  const number = (value, where, min, max, fallback) => {
    if (value === undefined) return fallback
    if (!isNumber(value) || value < min || value > max) {
      warnings.push(`${where} should be a number from ${min} to ${max} (got ${JSON.stringify(value)}) — using ${fallback}.`)
      return fallback
    }
    return value
  }
  if (raw.targets !== undefined) {
    if (typeof raw.targets !== 'object' || raw.targets === null) warnings.push('loudness.targets should be an object like { "sfx": -18 } — using the defaults.')
    else {
      for (const folder of FOLDERS) settings.targets[folder] = number(raw.targets[folder], `loudness.targets.${folder}`, -40, 0, settings.targets[folder])
      for (const key of Object.keys(raw.targets)) if (!FOLDERS.includes(key)) warnings.push(`loudness.targets.${key} is not a sound folder (${FOLDERS.join(' · ')}) — ignored.`)
    }
  }
  settings.toleranceDb = number(raw.toleranceDb, 'loudness.toleranceDb', 0.5, 12, settings.toleranceDb)
  settings.ceilingDb = number(raw.ceilingDb, 'loudness.ceilingDb', -12, 0, settings.ceilingDb)
  settings.lateMs = number(raw.lateMs, 'loudness.lateMs', 0, 500, settings.lateMs)
  return { settings, warnings }
}

// ---------- measuring (pure: samples in, numbers out) ----------

/** Linear level → dB (silence = -Infinity) */
export const toDb = (x) => 20 * Math.log10(x)
/** dB → linear level */
export const fromDb = (db) => 10 ** (db / 20)

/** The loudest sample, as a level (0…1+) */
export function peakOf(samples) {
  let peak = 0
  for (const s of samples) peak = Math.max(peak, Math.abs(s))
  return peak
}

/** Where the sound really starts, in ms: the first sample at 10 % of the peak. Silence → 0. */
export function onsetMsOf(samples, sampleRate) {
  const threshold = peakOf(samples) * 0.1
  if (threshold === 0) return 0
  for (let i = 0; i < samples.length; i++) if (Math.abs(samples[i]) >= threshold) return (i / sampleRate) * 1000
  return 0
}

/**
 * Active loudness (dB) of a short sound (Goops F29): split it into 20 ms slices, keep the slices within 20 dB of the
 * loudest one, and average their power. The silence around a hit doesn't drag it down. Silence → -Infinity.
 */
export function activeDbOf(samples, sampleRate) {
  const size = Math.max(1, Math.floor(0.02 * sampleRate))
  const powers = []
  for (let start = 0; start < samples.length; start += size) {
    let sum = 0
    const end = Math.min(start + size, samples.length)
    for (let i = start; i < end; i++) sum += samples[i] * samples[i]
    powers.push(sum / (end - start))
  }
  const loudest = Math.max(0, ...powers)
  if (loudest === 0) return -Infinity
  const active = powers.filter((p) => p > loudest / 100) // 20 dB = a power 100 times smaller
  return 10 * Math.log10(active.reduce((a, p) => a + p, 0) / active.length)
}

// The ear's weighting for LUFS (ITU BS.1770 "K-weighting"): a gentle lift of the highs, a cut of the deep lows.
// Two filters, worked out for any sample rate from the standard's own design values (as libebur128 does — at 48 kHz
// they give exactly the coefficients printed in BS.1770).
function kWeightingFilters(sampleRate) {
  // 1. high shelf: +4 dB above ~1.7 kHz (the head's effect)
  let K = Math.tan((Math.PI * 1681.974450955533) / sampleRate)
  let Q = 0.7071752369554196
  const Vh = 10 ** (3.999843853973347 / 20)
  const Vb = Vh ** 0.4996667741545416
  let a0 = 1 + K / Q + K * K
  const shelf = {
    b: [(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0],
    a: [1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0],
  }
  // 2. high pass: the rumble below ~40 Hz barely counts
  K = Math.tan((Math.PI * 38.13547087602444) / sampleRate)
  Q = 0.5003270373238773
  a0 = 1 + K / Q + K * K
  const pass = { b: [1, -2, 1], a: [1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0] }
  return [shelf, pass]
}

function applyFilter(samples, { b, a }) {
  const out = new Float32Array(samples.length)
  const [b0, b1, b2] = b
  const [, a1, a2] = a
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i]
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
    out[i] = y
    x2 = x1; x1 = x; y2 = y1; y1 = y
  }
  return out
}

/**
 * Integrated loudness (LUFS, ITU BS.1770 / EBU R128) of one or more channels (stereo = [left, right]).
 * 400 ms blocks every 100 ms; blocks quieter than -70 LUFS, then those 10 LU under the average, are left out.
 * A file shorter than one block is measured as one block. Silence → -Infinity.
 */
export function lufsOf(channels, sampleRate) {
  const weighted = channels.map((ch) => kWeightingFilters(sampleRate).reduce(applyFilter, ch))
  const length = channels[0]?.length ?? 0
  const block = Math.min(length, Math.round(0.4 * sampleRate))
  const step = Math.max(1, Math.round(0.1 * sampleRate))
  if (block === 0) return -Infinity
  const powers = []
  for (let start = 0; start + block <= length; start += step) {
    let sum = 0
    for (const ch of weighted) for (let i = start; i < start + block; i++) sum += ch[i] * ch[i]
    powers.push(sum / block)
  }
  const loudness = (p) => -0.691 + 10 * Math.log10(p)
  const mean = (list) => list.reduce((a, p) => a + p, 0) / list.length
  const loudEnough = powers.filter((p) => loudness(p) > -70)
  if (!loudEnough.length) return -Infinity
  const relativeGate = loudness(mean(loudEnough)) - 10
  const kept = loudEnough.filter((p) => loudness(p) > relativeGate)
  return loudness(mean(kept))
}

/**
 * Measures one sound. `channels`: its samples (one Float32Array per channel). `folder` picks the method.
 * → { loudnessDb, method: 'active' | 'lufs', peakDb, onsetMs, lengthMs }
 */
export function measure(channels, sampleRate, folder) {
  const long = isLongFolder(folder)
  const first = channels[0] ?? new Float32Array(0)
  const peak = Math.max(0, ...channels.map(peakOf))
  return {
    loudnessDb: long ? lufsOf(channels, sampleRate) : activeDbOf(first, sampleRate),
    method: long ? 'lufs' : 'active',
    peakDb: toDb(peak),
    onsetMs: onsetMsOf(first, sampleRate),
    lengthMs: (first.length / sampleRate) * 1000,
  }
}

// ---------- the verdict and the fix (pure) ----------

/**
 * How to bring a measured sound to its target: { gainDb, trimMs, peakLimited }.
 *   gainDb: target - loudness, but never pushing a spike more than MAX_LIMITING_DB into the limiter
 *           (peakLimited = true when that cap made it less than the full way)
 *   trimMs: effects + menus only: cut the silence before the onset (keeping ONSET_LEAD_MS)
 * fixedBefore: the file was already evened out once (its original is kept in audio-originals/). Its spikes were
 *   already shaved, so it gets no more limiting: shaving again on every run would squash it a little more each time.
 */
export function planFix(measured, folder, settings, { fixedBefore = false } = {}) {
  if (!isNumber(measured.loudnessDb)) return { gainDb: 0, trimMs: 0, peakLimited: false } // silence: nothing to do
  const wanted = settings.targets[folder] - measured.loudnessDb
  const limiterDb = settings.ceilingDb - LIMITER_MARGIN_DB
  const mostAllowed = limiterDb + (fixedBefore ? 0 : MAX_LIMITING_DB) - measured.peakDb
  const gainDb = Math.min(wanted, mostAllowed)
  const trimMs = isLongFolder(folder) ? 0 : Math.max(0, measured.onsetMs - ONSET_LEAD_MS)
  return { gainDb, trimMs, peakLimited: gainDb < wanted - 0.05 }
}

const dB = (x) => `${Math.abs(x).toFixed(1)} dB`

/**
 * Is it fine? → { ok, problems: ['3.5 dB too quiet', 'starts 60 ms late', …], note }
 * A file that's quiet only because its spikes stop it going louder (the fix can't raise it by even 1 dB) is fine,
 * with a note — otherwise it would be flagged forever. `options` as planFix ({ fixedBefore }).
 */
export function judge(measured, folder, settings, options = {}) {
  const problems = []
  let note = ''
  if (!isNumber(measured.loudnessDb)) return { ok: false, problems: ['silent'], note }
  const off = measured.loudnessDb - settings.targets[folder]
  if (Math.abs(off) > settings.toleranceDb) {
    const { gainDb, peakLimited } = planFix(measured, folder, settings, options)
    if (off < 0 && peakLimited && gainDb < 1) note = `${dB(off)} under target: as loud as its spikes allow`
    else problems.push(`${dB(off)} too ${off < 0 ? 'quiet' : 'loud'}`)
  }
  if (measured.peakDb > settings.ceilingDb + 0.05) problems.push(`peaks ${dB(measured.peakDb - settings.ceilingDb)} over ${settings.ceilingDb} dB`)
  if (!isLongFolder(folder) && measured.onsetMs > settings.lateMs) problems.push(`starts ${Math.round(measured.onsetMs)} ms late`)
  return { ok: problems.length === 0, problems, note }
}

/**
 * ffmpeg's settings to write `output` from `input` brought to target: the onset trim (effects + menus), the gain,
 * a fast limiter just under the ceiling. MP3s get the module's usual encoding: effects + menus mono 96 kbps,
 * music + ambience stereo 128 kbps. Other file types keep ffmpeg's own choice for that type.
 */
export function fixArgs(input, output, folder, fix, settings) {
  const filters = []
  if (fix.trimMs > 0) filters.push(`atrim=start=${(fix.trimMs / 1000).toFixed(4)}`, 'asetpts=PTS-STARTPTS', `afade=t=in:st=0:d=${ONSET_FADE_MS / 1000}`)
  filters.push(`volume=${fix.gainDb.toFixed(2)}dB`)
  const limit = fromDb(settings.ceilingDb - LIMITER_MARGIN_DB)
  filters.push(`alimiter=limit=${limit.toFixed(4)}:attack=0.5:release=40:level=disabled`)
  const long = isLongFolder(folder)
  const mp3 = /\.mp3$/i.test(output)
  return [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', input,
    '-vn', '-map_metadata', '-1',
    '-af', filters.join(','),
    ...(mp3 ? ['-ac', long ? '2' : '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', long ? '128k' : '96k'] : []),
    output,
  ]
}

// ---------- files (need ffmpeg) ----------

export const FFMPEG_MISSING = 'ffmpeg is not installed (it reads and writes the sound files). Install it — Windows: winget install Gyan.FFmpeg · Mac: brew install ffmpeg — then open a new terminal.'

/** The ffmpeg to run: FFMPEG_PATH, else `ffmpeg` on the PATH. null = not installed. (Same rule as the Dev Kit's drop.) */
export function findFfmpeg(env = process.env.FFMPEG_PATH) {
  const command = env && env.trim() ? env.trim() : 'ffmpeg'
  const probe = spawnSync(command, ['-version'], { stdio: 'ignore', windowsHide: true })
  return probe.error || probe.status !== 0 ? null : command
}

/** Runs ffmpeg; resolves with what it printed, or fails with its last error line. */
export function runFfmpeg(ffmpeg, args) {
  return new Promise((done, fail) => {
    execFile(ffmpeg, args, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
      if (error) fail(new Error(`ffmpeg couldn't read that file: ${stderr.toString().trim().split('\n').pop() || error.message}`))
      else done(stdout)
    })
  })
}

export const SAMPLE_RATE = 44100

/** Decodes a file to 44.1 kHz float samples, one Float32Array per channel (mono for effects, stereo for music). */
export async function decode(ffmpeg, file, channelCount) {
  const raw = await runFfmpeg(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', file, '-vn', '-ac', String(channelCount), '-ar', String(SAMPLE_RATE), '-f', 'f32le', '-'])
  const copy = new Uint8Array(raw.byteLength)
  copy.set(raw)
  const all = new Float32Array(copy.buffer, 0, Math.floor(copy.byteLength / 4))
  const frames = Math.floor(all.length / channelCount)
  const channels = Array.from({ length: channelCount }, () => new Float32Array(frames))
  for (let i = 0; i < frames; i++) for (let c = 0; c < channelCount; c++) channels[c][i] = all[i * channelCount + c]
  return channels
}

/** Reads and measures a sound file (see measure). */
export async function measureFile(ffmpeg, file, folder) {
  return measure(await decode(ffmpeg, file, isLongFolder(folder) ? 2 : 1), SAMPLE_RATE, folder)
}

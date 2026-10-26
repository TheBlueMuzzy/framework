// MAKE THE PLACEHOLDER SOUNDS — npm run sounds
// Reads content/audio-placeholders.json (ZzFX numbers per file), builds each sound with ZzFX (MIT, Frank Force —
// the zzfx package, a dev tool only: it never ships in the game) and writes 16-bit mono WAV files into public/audio/.
// Each file is evened out to the audio module's loudness target (content/audio.json "loudness", -18 dB) with its
// loudest sample kept under the ceiling (-1 dB), so `npm run audio:check` is happy and no volume needs re-tuning.
// The same numbers always make the same file (no randomness), so re-running it changes nothing in git.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

// ZzFX makes an AudioContext when it loads (to play sounds in a page). Here we only build samples, so a stand-in will do.
globalThis.AudioContext ??= class {}
const { ZZFX } = await import('zzfx')

const placeholders = JSON.parse(readFileSync('content/audio-placeholders.json', 'utf8'))
const audio = JSON.parse(readFileSync('content/audio.json', 'utf8'))
const ceilingDb = audio.loudness?.ceilingDb ?? -1
const SAMPLE_RATE = ZZFX.sampleRate

const db = (gain) => 20 * Math.log10(Math.max(gain, 1e-9))
const gainOf = (decibels) => 10 ** (decibels / 20)

/** Loudness of the part you hear: RMS of 20 ms windows within 20 dB of the loudest window (the audio module's way). */
function activeLoudnessDb(samples) {
  const size = Math.round(SAMPLE_RATE * 0.02)
  const windows = []
  for (let start = 0; start < samples.length; start += size) {
    let sum = 0
    const end = Math.min(samples.length, start + size)
    for (let i = start; i < end; i++) sum += samples[i] * samples[i]
    windows.push(Math.sqrt(sum / Math.max(1, end - start)))
  }
  const loudest = Math.max(...windows)
  const active = windows.filter((w) => db(w) >= db(loudest) - 20)
  return db(Math.sqrt(active.reduce((s, w) => s + w * w, 0) / active.length))
}

function wavFile(samples) {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2))
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // fmt chunk size
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(SAMPLE_RATE, 24)
  header.writeUInt32LE(SAMPLE_RATE * 2, 28) // bytes per second
  header.writeUInt16LE(2, 32) // bytes per sample
  header.writeUInt16LE(16, 34) // bits per sample
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

for (const [file, numbers] of Object.entries(placeholders)) {
  if (file.startsWith('_')) continue
  const folder = file.split('/')[0]
  const target = audio.loudness?.targets?.[folder] ?? -18
  const samples = ZZFX.buildSamples(...numbers)
  let gain = gainOf(target - activeLoudnessDb(samples))
  const peak = Math.max(...samples.map(Math.abs)) * gain
  if (db(peak) > ceilingDb) gain *= gainOf(ceilingDb) / peak // keep the loudest sample under the ceiling
  const out = join('public/audio', file)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, wavFile(samples.map((s) => s * gain)))
  console.log(`${file}  ${(samples.length / SAMPLE_RATE).toFixed(2)} s  ${activeLoudnessDb(samples.map((s) => s * gain)).toFixed(1)} dB`)
}

// @vitest-environment node
// Runs in the framework (not copied into games). The conversion tests need ffmpeg; they're skipped without it.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer, type ViteDevServer } from 'vite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { encodeArgs, FFMPEG_MISSING, findFfmpeg, findOnsetSec, nextFileName, readAudioTarget, readCreditEntry, saveAudioFile } from './audioSave'
import { devkit } from './devkitVite'

const ffmpeg = findFfmpeg()
/** ffmpeg's description of a file's sound stream, e.g. "Audio: mp3 (mp3float), 44100 Hz, mono, fltp, 96 kb/s" */
const describe_ = (file: string) => spawnSync(ffmpeg!, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr.match(/Audio: .*/)?.[0] ?? ''

/** A 16-bit mono WAV: `silenceMs` of nothing, then a 440 Hz tone for `toneMs`. */
function makeWav(silenceMs: number, toneMs: number, rate = 44100): Buffer {
  const silent = Math.round((silenceMs / 1000) * rate)
  const tone = Math.round((toneMs / 1000) * rate)
  const samples = silent + tone
  const wav = Buffer.alloc(44 + samples * 2)
  wav.write('RIFF', 0)
  wav.writeUInt32LE(36 + samples * 2, 4)
  wav.write('WAVEfmt ', 8)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20) // PCM
  wav.writeUInt16LE(1, 22) // mono
  wav.writeUInt32LE(rate, 24)
  wav.writeUInt32LE(rate * 2, 28)
  wav.writeUInt16LE(2, 32)
  wav.writeUInt16LE(16, 34)
  wav.write('data', 36)
  wav.writeUInt32LE(samples * 2, 40)
  for (let i = 0; i < tone; i++) wav.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 20000), 44 + (silent + i) * 2)
  return wav
}

describe('readAudioTarget — only public/audio/<folder>/category_object_action', () => {
  const ok = { folder: 'sfx', stem: 'sfx_seed_land', bus: 'sfx', ext: 'wav' }
  it('takes a proper target', () => {
    expect(readAudioTarget(ok)).toEqual(ok)
    expect(readAudioTarget({ ...ok, ext: '.WAV' })).toEqual(ok)
    expect(readAudioTarget({ folder: 'stg', stem: 'stg_reveal_winner', bus: 'sfx', ext: 'mp3' })).toMatchObject({ folder: 'stg' })
  })
  it('refuses folders outside the five', () => {
    for (const folder of ['..', '../content', 'content', 'sfx/..', 'SFX', '', undefined, 'sfx/x']) {
      expect(typeof readAudioTarget({ ...ok, folder })).toBe('string')
    }
  })
  it('refuses names that sneak out or break the naming rule', () => {
    for (const stem of ['../sfx_x', 'sfx_..', 'sfx/x_y', 'sfx\\x_y', 'sfx_seed land', 'Sfx_Seed', 'sfx', 'ui_tap', 'sfx_a.mp3', 'sfx_a\0', '', 42]) {
      expect(typeof readAudioTarget({ ...ok, stem })).toBe('string')
    }
  })
  it('refuses unknown buses and file types', () => {
    expect(typeof readAudioTarget({ ...ok, bus: 'voice' })).toBe('string')
    expect(typeof readAudioTarget({ ...ok, ext: 'exe' })).toBe('string')
    expect(typeof readAudioTarget({ ...ok, ext: undefined })).toBe('string')
  })
})

describe('nextFileName — never overwrites, numbers in order', () => {
  it('starts at 01 and follows the highest number', () => {
    expect(nextFileName([], 'sfx_pop')).toBe('sfx_pop_01.mp3')
    expect(nextFileName(['sfx_pop_01.mp3', 'sfx_pop_03.mp3', 'sfx_popcorn_09.mp3', 'sfx_pop_loop.mp3'], 'sfx_pop')).toBe('sfx_pop_04.mp3')
    expect(nextFileName(['sfx_pop_99.mp3'], 'sfx_pop')).toBe('sfx_pop_100.mp3')
  })
})

describe('findOnsetSec — where the sound really starts (B026)', () => {
  it('finds the first sample at 10 % of the peak, minus 4 ms', () => {
    const samples = new Float32Array(44100)
    samples[4410] = 0.05 // quiet hiss: under 10 % of the peak, ignored
    samples[8820] = 0.5 // 200 ms: the hit
    samples[9000] = 1
    expect(findOnsetSec(samples, 44100)).toBeCloseTo(0.2 - 0.004, 4)
  })
  it('never goes before the start, and silence stays untouched', () => {
    expect(findOnsetSec(new Float32Array([1, 0, 0]), 44100)).toBe(0)
    expect(findOnsetSec(new Float32Array(100), 44100)).toBe(0)
  })
})

describe('encodeArgs — the MP3 settings per bus', () => {
  it('effects: mono 96k, trimmed to the onset with a 3 ms fade-in', () => {
    const args = encodeArgs('in.wav', 'out.mp3', 'sfx', 0.05).join(' ')
    expect(args).toContain('-ac 1')
    expect(args).toContain('-b:a 96k')
    expect(args).toContain('atrim=start=0.0500')
    expect(args).toContain('afade=t=in:st=0:d=0.003')
  })
  it('music + ambience: stereo 128k, untouched', () => {
    const args = encodeArgs('in.wav', 'out.mp3', 'music', 0.05).join(' ')
    expect(args).toContain('-ac 2')
    expect(args).toContain('-b:a 128k')
    expect(args).not.toContain('atrim')
    expect(args).not.toContain('afade')
  })
})

describe('without ffmpeg', () => {
  it('is found missing, and saving says how to install it', async () => {
    expect(findFfmpeg('surely-not-a-real-ffmpeg-command')).toBeNull()
    const target = { folder: 'sfx' as const, stem: 'sfx_a_b', bus: 'sfx' as const, ext: 'wav' }
    await expect(saveAudioFile(tmpdir(), target, makeWav(0, 10), null)).rejects.toThrow(FFMPEG_MISSING)
    expect(FFMPEG_MISSING).toContain('winget install Gyan.FFmpeg')
  })
})

describe('readCreditEntry', () => {
  const entry = { paths: ['public/audio/sfx/sfx_pop_01.mp3'], source: 'Freesound — pop.wav', author: 'x', licence: 'CC0', light: '🟢', url: '', credit: '' }
  it('takes a sound credit (only the known fields)', () => {
    expect(readCreditEntry({ ...entry, extra: 1 })).toEqual(entry)
  })
  it('refuses other paths, or no source / licence', () => {
    expect(typeof readCreditEntry({ ...entry, paths: ['src/App.tsx'] })).toBe('string')
    expect(typeof readCreditEntry({ ...entry, paths: ['public/audio/../../x.mp3'] })).toBe('string')
    expect(typeof readCreditEntry({ ...entry, paths: [] })).toBe('string')
    expect(typeof readCreditEntry({ ...entry, source: ' ' })).toBe('string')
    expect(typeof readCreditEntry({ ...entry, licence: undefined })).toBe('string')
    expect(typeof readCreditEntry([entry])).toBe('string')
  })
})

describe('the sound endpoints in a real Vite dev server', () => {
  let game: string
  let server: ViteDevServer
  let url: string
  beforeEach(async () => {
    game = mkdtempSync(join(tmpdir(), 'devkit-audio-server-'))
    mkdirSync(join(game, 'content'), { recursive: true })
    writeFileSync(join(game, 'content/credits.json'), '[\n  {\n    "paths": ["public/a.png"],\n    "source": "own",\n    "licence": "own work"\n  }\n]\n')
    server = await createServer({ root: game, configFile: false, logLevel: 'silent', plugins: [devkit()], server: { port: 0, host: '127.0.0.1' } })
    await server.listen()
    url = server.resolvedUrls!.local[0].replace(/\/$/, '')
  })
  afterEach(async () => {
    await server.close()
    rmSync(game, { recursive: true, force: true })
  })
  const upload = (query: string, body: Buffer, headers: Record<string, string> = {}) =>
    fetch(`${url}/__devkit/save-audio?${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', Origin: url, ...headers },
      body: new Uint8Array(body),
    })
  const credit = (entry: object, headers: Record<string, string> = {}) =>
    fetch(`${url}/__devkit/add-credit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: url, ...headers },
      body: JSON.stringify({ entry }),
    })

  it('refuses paths outside public/audio/ and nothing is written', async () => {
    for (const query of [
      'folder=..&stem=sfx_x_y&bus=sfx&ext=wav',
      'folder=sfx&stem=..%2F..%2Fsfx_x&bus=sfx&ext=wav',
      'folder=sfx&stem=sfx_x%2F..%2F..%2Fy&bus=sfx&ext=wav',
      'folder=..%2F..%2Fsrc&stem=sfx_x&bus=sfx&ext=wav',
      'folder=sfx&stem=sfx_x&bus=sfx&ext=exe',
    ]) {
      expect((await upload(query, makeWav(0, 10))).status, query).toBe(400)
    }
    expect(existsSync(join(game, 'public'))).toBe(false)
  })
  it('refuses other web pages, GET and the wrong content type', async () => {
    const query = 'folder=sfx&stem=sfx_x_y&bus=sfx&ext=wav'
    expect((await upload(query, makeWav(0, 10), { Origin: 'http://evil.example' })).status).toBe(403)
    expect((await fetch(`${url}/__devkit/save-audio?${query}`)).status).toBe(405)
    expect((await upload(query, makeWav(0, 10), { 'Content-Type': 'application/json' })).status).toBe(415)
  })
  it.skipIf(!ffmpeg)('converts a WAV to a mono MP3, trims the silent start, and numbers the files', async () => {
    const res = await upload('folder=sfx&stem=sfx_test_pop&bus=sfx&ext=wav', makeWav(80, 300))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ ok: true, path: 'sfx/sfx_test_pop_01.mp3', file: 'public/audio/sfx/sfx_test_pop_01.mp3' })
    expect(body.trimmedMs).toBeGreaterThanOrEqual(72)
    expect(body.trimmedMs).toBeLessThanOrEqual(80)
    const saved = join(game, 'public/audio/sfx/sfx_test_pop_01.mp3')
    // Mono 96k, and the sound now starts (nearly) at once: decode it back and find its onset
    expect(describe_(saved)).toMatch(/mp3.*mono.*96 kb\/s/)
    const pcm = execFileSync(ffmpeg!, ['-loglevel', 'error', '-i', saved, '-ac', '1', '-ar', '44100', '-f', 'f32le', '-'])
    const samples = new Float32Array(new Uint8Array(pcm).buffer, 0, Math.floor(pcm.byteLength / 4))
    expect(findOnsetSec(samples, 44100)).toBeLessThan(0.04) // was 0.08 s of silence; what's left is the MP3 encoder's own delay
    // A second one gets the next number
    const again = await upload('folder=sfx&stem=sfx_test_pop&bus=sfx&ext=wav', makeWav(0, 100))
    expect((await again.json()).path).toBe('sfx/sfx_test_pop_02.mp3')
    expect(readdirSync(join(game, 'public/audio/sfx')).sort()).toEqual(['sfx_test_pop_01.mp3', 'sfx_test_pop_02.mp3'])
  }, 30000)
  it.skipIf(!ffmpeg)('keeps music stereo and its quiet start untouched', async () => {
    const res = await upload('folder=mus&stem=mus_test_theme&bus=music&ext=wav', makeWav(80, 200))
    const body = await res.json()
    expect(body).toMatchObject({ path: 'mus/mus_test_theme_01.mp3', trimmedMs: 0 })
    expect(describe_(join(game, 'public/audio/mus/mus_test_theme_01.mp3'))).toMatch(/mp3.*stereo.*128 kb\/s/)
  }, 30000)
  it.skipIf(!ffmpeg)('says so plainly when the file is not a sound', async () => {
    const res = await upload('folder=sfx&stem=sfx_test_junk&bus=sfx&ext=wav', Buffer.from('not a sound at all'))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/couldn't read that file/)
    expect(existsSync(join(game, 'public/audio/sfx/sfx_test_junk_01.mp3'))).toBe(false)
  }, 30000)

  it('appends a credit to content/credits.json, keeping how it was written', async () => {
    const entry = { paths: ['public/audio/sfx/sfx_pop_01.mp3'], source: 'Freesound — pop.wav', author: 'Ann', licence: 'CC-BY 4.0', light: '🟡', url: 'https://freesound.org/x', credit: 'pop.wav by Ann, CC BY 4.0' }
    expect((await credit(entry)).status).toBe(200)
    const list = JSON.parse(readFileSync(join(game, 'content/credits.json'), 'utf8'))
    expect(list).toHaveLength(2)
    expect(list[1]).toEqual(entry)
    expect(readFileSync(join(game, 'content/credits.json'), 'utf8')).toContain('"paths": ["public/a.png"]')
  })
  it('refuses credits for other files, and from other pages', async () => {
    expect((await credit({ paths: ['src/App.tsx'], source: 'x', licence: 'CC0' })).status).toBe(400)
    expect((await credit({ paths: ['public/audio/sfx/sfx_a_01.mp3'], source: 'x', licence: 'CC0' }, { Origin: 'http://evil.example' })).status).toBe(403)
    expect(JSON.parse(readFileSync(join(game, 'content/credits.json'), 'utf8'))).toHaveLength(1)
  })
})

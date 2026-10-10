// Music tracks + streaming (music.ts, stream.ts, engine wiring) with the fake AudioContext, fake <audio> elements and
// fake timers. Time only moves when a test calls advance(): the engine clock, the AudioContext clock, the elements'
// playing position and the timers all move together, 10 ms at a time.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dbToGain } from './config.ts'
import { createAudio } from './engine.ts'
import { FakeAudioContext, FakeDocument, FakeGain, FakeMediaElement, FakeMediaSource, FakeNode } from './fakeAudioContext.test.helper.ts'
import type { LogEntry } from './log.ts'
import { layerLevel, restLengthMs } from './music.ts'

const CONFIG = {
  duck: { amountDb: -7, downMs: 10, backMs: 600 },
  sounds: {
    boom: { files: ['sfx/boom.mp3'], duck: true },
    night: { files: ['amb/night.mp3'], bus: 'ambience', loop: true, loopEndMs: 4000, loopCrossfadeMs: 200 },
    sting: { files: ['mus/sting.mp3'], bus: 'music', fadeOutMs: 500 },
    song: { files: ['mus/song.mp3'], bus: 'music', loop: true }, // a music-bus sound: streams by default
    short: { files: ['mus/short.mp3'], bus: 'music', loop: true, stream: 'never' },
  },
  music: {
    tracks: {
      garden: {
        layers: {
          harp: { file: 'mus/harp.mp3' },
          pad: { file: 'mus/pad.mp3', volumeDb: -6, fromIntensity: 0.3, fullAtIntensity: 0.8 },
        },
        loop: true,
        loopCrossfadeMs: 100,
        playsBeforeRest: 2,
        restSeconds: [30, 30],
        fadeInMs: 1000,
        fadeOutMs: 2000,
      },
      piece: {
        layers: { main: { file: 'mus/piece.mp3' } },
        loop: false,
        playsBeforeRest: 1,
        restSeconds: [5, 5],
        fadeInMs: 500,
        fadeOutMs: 1000,
      },
      menu: { layers: { main: { file: 'mus/menu.mp3' } }, playsBeforeRest: 0, fadeInMs: 1000, fadeOutMs: 1000 },
    },
  },
}

/** Each file's length in seconds (what the fake <audio> elements report) */
const LENGTHS: Record<string, number> = {
  '/audio/mus/harp.mp3': 10,
  '/audio/mus/pad.mp3': 10,
  '/audio/mus/piece.mp3': 8,
  '/audio/mus/menu.mp3': 12,
  '/audio/amb/night.mp3': 5,
  '/audio/mus/sting.mp3': 2,
  '/audio/mus/song.mp3': 30,
}

function setup(config: unknown = CONFIG) {
  const ctx = new FakeAudioContext()
  const win = new EventTarget()
  const doc = new FakeDocument()
  const elements: FakeMediaElement[] = []
  const fetched: string[] = []
  let time = 1000
  const audio = createAudio(config, {
    context: () => ctx as unknown as AudioContext,
    window: win,
    document: doc,
    navigator: {},
    now: () => time,
    rng: () => 0.5,
    preload: false,
    fetchFile: async (url) => {
      fetched.push(url)
      return new ArrayBuffer(8)
    },
    mediaElement: (url) => {
      const element = new FakeMediaElement(url, () => ctx.currentTime, LENGTHS[url] ?? NaN)
      elements.push(element)
      return element
    },
  })
  const tap = async () => {
    win.dispatchEvent(new Event('pointerup'))
    await vi.advanceTimersByTimeAsync(0)
  }
  /** Moves every clock on by ms, in 10 ms steps */
  const advance = (ms: number) => {
    for (let done = 0; done < ms; done += 10) {
      time += 10
      ctx.currentTime += 0.01
      vi.advanceTimersByTime(10)
    }
  }
  const musicLog = () => audio.log.entries().filter((e: LogEntry) => e.result === 'music').map((e) => `${e.id} ${e.event}${e.detail ? ` (${e.detail})` : ''}`)
  const playing = () => elements.filter((e) => !e.paused && !e.released)
  return { audio, ctx, win, doc, elements, fetched, tap, advance, musicLog, playing }
}

/** media source → copy volume → layer volume → track fade */
const layerGainOf = (source: FakeMediaSource) => source.connections[0].connections[0] as FakeGain
const trackFadeOf = (source: FakeMediaSource) => layerGainOf(source).connections[0] as FakeGain
/** The kinds of node from a node to the speakers, following the first connection */
function pathOf(node: FakeNode): string[] {
  const kinds: string[] = []
  let at: FakeNode | undefined = node
  while (at) {
    kinds.push(at.kind)
    at = at.connections[0]
  }
  return kinds
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('the intensity curve and rest length (pure)', () => {
  it('a layer is silent up to fromIntensity, full from fullAtIntensity, and t² in between', () => {
    const layer = { fromIntensity: 0.2, fullAtIntensity: 0.6 }
    expect(layerLevel(layer, 0)).toBe(0)
    expect(layerLevel(layer, 0.2)).toBe(0)
    expect(layerLevel(layer, 0.4)).toBeCloseTo(0.25)
    expect(layerLevel(layer, 0.6)).toBe(1)
    expect(layerLevel(layer, 1)).toBe(1)
  })
  it('from 0 + full 0 = always on; from = full = a step', () => {
    expect(layerLevel({ fromIntensity: 0, fullAtIntensity: 0 }, 0)).toBe(1)
    expect(layerLevel({ fromIntensity: 0.5, fullAtIntensity: 0.5 }, 0.49)).toBe(0)
    expect(layerLevel({ fromIntensity: 0.5, fullAtIntensity: 0.5 }, 0.5)).toBe(1)
  })
  it('a rest is a random time between restSeconds', () => {
    expect(restLengthMs({ restSeconds: [60, 90] }, () => 0)).toBe(60000)
    expect(restLengthMs({ restSeconds: [60, 90] }, () => 0.5)).toBe(75000)
    expect(restLengthMs({ restSeconds: [60, 90] }, () => 0.999)).toBe(89970)
  })
})

describe('music tracks', () => {
  it('starts every layer together, streamed into the Music group (through the duck and the muffle)', async () => {
    const { audio, ctx, tap, elements, musicLog } = setup()
    await tap()
    audio.playMusic('garden')
    expect(elements.map((e) => e.src)).toEqual(['/audio/mus/harp.mp3', '/audio/mus/pad.mp3'])
    expect(elements.every((e) => !e.paused)).toBe(true)
    expect(elements.every((e) => e.preservesPitch === false)).toBe(true)
    const [harp] = ctx.mediaSources()
    // media → copy → layer → track fade → bus level → bus mix → duck → muffle → master → limiter → speakers
    expect(pathOf(harp)).toEqual(['media', 'gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'filter', 'gain', 'compressor', 'destination'])
    expect(trackFadeOf(harp).gain.calls.at(-1)).toEqual(['ramp', 1, 1]) // fades in over fadeInMs (1 s)
    expect(musicLog()).toEqual(['garden start (2 layers)', 'garden play (play 1 of 2)'])
    expect(audio.musicState()).toMatchObject({ track: 'garden', phase: 'playing', play: 1, playsBeforeRest: 2, intensity: 0 })
  })

  it("each layer's volume follows the one intensity (volumeDb × the curve)", async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.playMusic('garden')
    const [harp, pad] = ctx.mediaSources()
    expect(layerGainOf(harp).gain.value).toBe(1)
    expect(layerGainOf(pad).gain.value).toBe(0) // intensity 0 is under the pad's fromIntensity (0.3)

    audio.setMusicIntensity(0.55, { rampMs: 400 })
    expect(layerGainOf(pad).gain.value).toBeCloseTo(dbToGain(-6) * 0.25)
    expect(layerGainOf(pad).gain.calls.at(-1)?.[0]).toBe('ramp')
    expect(layerGainOf(pad).gain.calls.at(-1)?.[2]).toBeCloseTo(0.4)
    audio.setMusicIntensity(1)
    expect(layerGainOf(pad).gain.value).toBeCloseTo(dbToGain(-6))
    expect(layerGainOf(harp).gain.value).toBe(1)
    expect(audio.musicState().layers.map((l) => l.name)).toEqual(['harp', 'pad'])

    audio.setMusicIntensity(7) // out of range → 1
    expect(audio.musicState().intensity).toBe(1)
  })

  it('loops seamlessly (a crossfade at the loop point), counts plays, fades out, rests, comes back', async () => {
    const { audio, ctx, tap, advance, musicLog, playing } = setup()
    await tap()
    audio.playMusic('garden')
    const [harp] = ctx.mediaSources()

    advance(9700) // 10 s files: within 0.25 s of the crossfade, the next time round is primed for both layers
    expect(ctx.mediaSources()).toHaveLength(4)
    expect(musicLog().at(-1)).toBe('garden play (play 1 of 2)')
    advance(220) // the crossfade starts 0.1 s before the loop point
    expect(musicLog().at(-1)).toBe('garden play (play 2 of 2)')
    expect(playing()).toHaveLength(4) // old + new crossfading
    advance(200)
    expect(harp.element.released).toBe(true)
    expect(playing()).toHaveLength(2)

    // The last play before the rest doesn't loop: it fades out over its last 2 s (fadeOutMs) and ends at ~19.9 s
    advance(7800)
    const fade = trackFadeOf(ctx.mediaSources()[2]).gain.calls.at(-1)!
    expect(fade.slice(0, 2)).toEqual(['ramp', 0])
    advance(2100)
    expect(musicLog().at(-1)).toBe('garden rest (30 s)')
    expect(audio.musicState()).toMatchObject({ phase: 'resting' })
    expect(playing()).toHaveLength(0)

    advance(29000)
    expect(audio.musicState().phase).toBe('resting')
    expect(audio.musicState().restLeftMs).toBeLessThanOrEqual(1100)
    advance(1100)
    expect(musicLog().at(-1)).toBe('garden play (play 1 of 2 — back after a rest)')
    expect(playing()).toHaveLength(2)
    // both layers start from the top, together
    const [a, b] = ctx.mediaSources().slice(-2).map((s) => s.element.currentTime)
    expect(a).toBe(b)
    expect(a).toBeLessThan(0.3)
    expect(musicLog()).toEqual([
      'garden start (2 layers)', 'garden play (play 1 of 2)', 'garden play (play 2 of 2)', 'garden rest (30 s)',
      'garden play (play 1 of 2 — back after a rest)',
    ])
  })

  it('a piece with an ending counts one play when it ends', async () => {
    const { audio, tap, advance, musicLog, playing } = setup()
    await tap()
    audio.playMusic('piece')
    advance(8100)
    expect(musicLog()).toEqual(['piece start (1 layer)', 'piece play (play 1 of 1)', 'piece rest (5 s)'])
    expect(playing()).toHaveLength(0)
    advance(5100)
    expect(musicLog().at(-1)).toBe('piece play (play 1 of 1 — back after a rest)')
  })

  it('playsBeforeRest 0 = never rests', async () => {
    const { audio, tap, advance, musicLog } = setup()
    await tap()
    audio.playMusic('menu')
    advance(40000)
    expect(musicLog().filter((l) => l.includes('rest'))).toEqual([])
    expect(musicLog().at(-1)).toBe('menu play (play 4)')
  })

  it('switching tracks crossfades: the old one fades out and is let go, the new one fades in', async () => {
    const { audio, ctx, tap, advance, musicLog, elements } = setup()
    await tap()
    audio.playMusic('menu')
    const [menu] = ctx.mediaSources()
    audio.playMusic('garden', { fadeMs: 800 })
    expect(trackFadeOf(menu).gain.calls.at(-1)).toEqual(['ramp', 0, 0.8])
    const harp = ctx.mediaSources()[1]
    expect(trackFadeOf(harp).gain.calls.at(-1)).toEqual(['ramp', 1, 0.8])
    expect(musicLog().slice(2)).toEqual(['menu stop (switching to garden)', 'garden start (2 layers)', 'garden play (play 1 of 2)'])
    advance(900)
    expect(elements[0].released).toBe(true)
    expect(audio.musicState().track).toBe('garden')
  })

  it('asking for the track that is already on changes nothing', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.playMusic('garden')
    audio.playMusic('garden')
    expect(ctx.mediaSources()).toHaveLength(2)
  })

  it('stopMusic fades out and lets go; with a track name, only that track', async () => {
    const { audio, ctx, tap, advance, elements, musicLog } = setup()
    await tap()
    audio.playMusic('menu')
    audio.stopMusic({ track: 'garden' }) // not the one playing: nothing
    expect(audio.musicState().phase).toBe('playing')
    audio.stopMusic({ fadeMs: 500 })
    expect(trackFadeOf(ctx.mediaSources()[0]).gain.calls.at(-1)).toEqual(['ramp', 0, 0.5])
    expect(audio.musicState()).toMatchObject({ track: null, phase: 'off' })
    expect(musicLog().at(-1)).toBe('menu stop')
    advance(600)
    expect(elements[0].released).toBe(true)
  })

  it('asked for before the first tap: waits, then starts', async () => {
    const { audio, tap, elements } = setup()
    audio.playMusic('menu')
    expect(audio.musicState()).toMatchObject({ track: 'menu', phase: 'waiting' })
    expect(audio.log.entries().at(-1)).toMatchObject({ id: 'menu', result: 'dropped', reason: 'locked' })
    expect(elements).toHaveLength(0)
    await tap()
    expect(audio.musicState().phase).toBe('playing')
    expect(elements).toHaveLength(1)
  })

  it('a hidden tab pauses the music, and the rest clock stops with it', async () => {
    const { audio, tap, advance, doc, playing } = setup()
    await tap()
    audio.playMusic('piece')
    advance(8100) // → resting 5 s
    audio.restMusic() // (no effect while resting)
    doc.setVisibility('hidden')
    advance(20000)
    expect(audio.musicState().phase).toBe('resting')
    doc.setVisibility('visible')
    await vi.advanceTimersByTimeAsync(0)
    advance(5100)
    expect(audio.musicState().phase).toBe('playing')
    expect(playing()).toHaveLength(1)
    doc.setVisibility('hidden')
    expect(playing()).toHaveLength(0) // the <audio> element is paused too, not just the AudioContext
  })

  it('Dev Kit: rest now fades out and rests; come back now plays again', async () => {
    const { audio, tap, advance, musicLog } = setup()
    await tap()
    audio.playMusic('garden')
    audio.restMusic()
    expect(audio.musicState().phase).toBe('fading')
    advance(2100) // fadeOutMs
    expect(audio.musicState().phase).toBe('resting')
    audio.endMusicRest()
    expect(audio.musicState()).toMatchObject({ phase: 'playing', play: 1 })
    expect(musicLog().at(-1)).toBe('garden play (play 1 of 2 — back now)')
  })

  it('a live edit (Dev Kit) changes a layer volume at once; deleting the track stops it', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.playMusic('garden')
    const edited = structuredClone(CONFIG)
    edited.music.tracks.garden.layers.harp = { file: 'mus/harp.mp3', volumeDb: -12 } as typeof edited.music.tracks.garden.layers.harp
    audio.setConfig(edited)
    expect(layerGainOf(ctx.mediaSources()[0]).gain.value).toBeCloseTo(dbToGain(-12))
    const without = structuredClone(CONFIG) as { music: { tracks: Record<string, unknown> } }
    delete without.music.tracks.garden
    audio.setConfig(without)
    expect(audio.musicState().phase).toBe('off')
  })

  it('unknown tracks and tracks with no layers are logged, not played', async () => {
    const { audio, tap } = setup({ music: { tracks: { empty: {} } } })
    await tap()
    audio.playMusic('nope')
    audio.playMusic('empty')
    expect(audio.log.entries().map((e) => e.reason)).toEqual(['unknown-sound', 'no-files'])
  })

  it('a ducking sound dips the streamed music', async () => {
    const { audio, ctx, tap, fetched } = setup()
    await tap()
    audio.playMusic('menu')
    await audio.preload(['boom'])
    expect(fetched).toEqual(['/audio/sfx/boom.mp3'])
    audio.play('boom')
    // the duck node is on the music's way out (media → copy → layer → fade → level → mix → DUCK)
    let duck: FakeNode = ctx.mediaSources()[0]
    for (let i = 0; i < 6; i++) duck = duck.connections[0]
    expect((duck as FakeGain).gain.calls).toContainEqual(['ramp', dbToGain(-7), expect.closeTo(0.01, 5)])
  })

  it('a phone that refuses to start the <audio> gets it started on the next tap', async () => {
    const { audio, tap, elements, win } = setup()
    await tap()
    const refuse = vi.spyOn(FakeMediaElement.prototype, 'play').mockImplementationOnce(() => Promise.reject(new Error('NotAllowedError')))
    audio.playMusic('menu')
    await vi.advanceTimersByTimeAsync(0)
    expect(elements[0].paused).toBe(true)
    refuse.mockRestore()
    win.dispatchEvent(new Event('pointerup'))
    expect(elements[0].paused).toBe(false)
  })

  it('stopAll stops the music too; dispose lets every stream go', async () => {
    const { audio, tap, advance, elements } = setup()
    await tap()
    audio.playMusic('menu')
    audio.play('night')
    audio.stopAll({ fadeMs: 100 })
    advance(1200)
    expect(elements.every((e) => e.released)).toBe(true)
    audio.playMusic('garden')
    audio.dispose()
    expect(elements.every((e) => e.released)).toBe(true)
  })
})

describe('streamed sounds (music + ambience in "sounds")', () => {
  it('music and ambience stream by default (no decoding); "stream": "never" decodes', async () => {
    const { audio, ctx, tap, elements, fetched } = setup()
    await tap()
    expect(audio.play('song').kind).toBe('play')
    expect(elements.map((e) => e.src)).toEqual(['/audio/mus/song.mp3'])
    expect(fetched).toEqual([])
    expect(audio.play('short')).toMatchObject({ kind: 'drop', reason: 'not-loaded' }) // decoded: loads first
    expect(fetched).toEqual(['/audio/mus/short.mp3'])
    expect(ctx.decoded).toBe(0)
    await audio.preload(['song', 'night']) // streamed: nothing to preload
    expect(fetched).toEqual(['/audio/mus/short.mp3'])
  })

  it('a streamed loop crossfades at its loop point (loopEndMs) back to loopStartMs', async () => {
    const { audio, ctx, tap, advance, playing } = setup()
    await tap()
    audio.play('night')
    advance(3790) // 0.25 s + the 0.2 s crossfade before the loop point: the next copy is primed
    expect(ctx.mediaSources()).toHaveLength(2)
    advance(20) // the crossfade begins 0.2 s before 4 s
    const [first, second] = ctx.mediaSources()
    expect(playing()).toHaveLength(2)
    expect(first.connections[0]).toBeInstanceOf(FakeGain)
    expect((first.connections[0] as FakeGain).gain.calls.at(-1)).toEqual(['ramp', 0, expect.closeTo(4.0, 1)])
    expect((second.connections[0] as FakeGain).gain.calls.at(-1)).toEqual(['ramp', 1, expect.closeTo(4.0, 1)])
    advance(300)
    expect(first.element.released).toBe(true)
    expect(audio.voices().map((v) => v.sound)).toEqual(['night'])
    expect(audio.play('night')).toMatchObject({ kind: 'drop', reason: 'already-playing' })
  })

  it('a streamed one-shot fades out before its end and is forgotten when it ends', async () => {
    const { audio, ctx, tap, advance } = setup()
    await tap()
    audio.play('sting')
    expect(audio.voices()).toHaveLength(1)
    advance(1600)
    const volume = ctx.mediaSources()[0].connections[0].connections[0] as FakeGain // copy → the sound's own volume
    expect(volume.gain.calls.at(-1)?.slice(0, 2)).toEqual(['ramp', 0])
    advance(500)
    expect(audio.voices()).toHaveLength(0)
    expect(ctx.mediaSources()[0].element.released).toBe(true)
  })

  it('stop() fades a streamed loop out and lets it go', async () => {
    const { audio, tap, advance, elements } = setup()
    await tap()
    audio.play('night')
    audio.stop('night', { fadeMs: 300 })
    expect(audio.voices()).toHaveLength(0)
    advance(400)
    expect(elements[0].released).toBe(true)
  })
})

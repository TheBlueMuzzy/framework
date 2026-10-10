import { describe, expect, it, vi } from 'vitest'
import { dbToGain, sliderToGain } from './config.ts'
import { createAudio, type AudioOptions } from './engine.ts'
import { FakeAnalyser, FakeAudioContext, FakeCompressor, FakeDocument, FakeFilter, FakeGain, FakeNode, FakeSource, settle } from './fakeAudioContext.test.helper.ts'
import { exposeLog } from './log.ts'
import { seededRandom } from './planner.ts'
import { getAudio, playSound, setAudio } from './shared.ts'

const CONFIG = {
  buses: { music: -8, ambience: -10, sfx: 0, ui: -8 },
  master: { limiterDb: -1 },
  snapshots: { paused: { music: -10, lowpassHz: 900, fadeMs: 250 }, reveal: { music: -6, ambience: -8, fadeMs: 400 } },
  duck: { amountDb: -7, downMs: 10, backMs: 600 },
  tiers: { small: 'pop', medium: 'pop', big: 'boom' },
  sounds: {
    pop: { files: ['sfx/pop_1.mp3', 'sfx/pop_2.mp3'], maxVoices: 2, cooldownMs: 0 },
    tap: { files: ['ui/tap.mp3'], bus: 'ui', cooldownMs: 0 },
    shaped: { files: ['sfx/shaped.mp3'], trimStartMs: 100, trimEndMs: 200, fadeInMs: 50, fadeOutMs: 100, pitch: 12, pan: 0.5, lowpassHz: 2000, highpassHz: 100 },
    boom: { files: ['sfx/boom.mp3'], duck: true },
    // (decoded on purpose: these test the decoded path — streaming has its own tests in music.test.ts)
    night: { files: ['amb/night.mp3'], bus: 'ambience', loop: true, loopStartMs: 200, loopEndMs: 800, stream: 'never' },
    theme: { files: ['mus/theme.mp3'], bus: 'music', loop: true, stream: 'never' },
  },
}

function setup(extra: Partial<AudioOptions> = {}) {
  const ctx = new FakeAudioContext()
  const makeContext = vi.fn(() => ctx as unknown as AudioContext)
  const win = new EventTarget()
  const doc = new FakeDocument()
  const session = { type: 'auto', state: 'active' }
  const fetched: string[] = []
  let time = 1000
  const audio = createAudio(CONFIG, {
    context: makeContext,
    window: win,
    document: doc,
    navigator: { audioSession: session },
    now: () => time,
    rng: seededRandom(3),
    baseUrl: '/game/',
    fetchFile: async (url) => {
      fetched.push(url)
      return new ArrayBuffer(8)
    },
    ...extra,
  })
  const tap = async () => {
    win.dispatchEvent(new Event('pointerup'))
    await settle()
    await settle()
  }
  const advance = (ms: number) => {
    time += ms
    ctx.currentTime += ms / 1000
  }
  return { audio, ctx, makeContext, win, doc, session, fetched, tap, advance }
}

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
const lastSource = (ctx: FakeAudioContext) => ctx.startedSounds().at(-1)!
const masterOf = (ctx: FakeAudioContext) => ctx.nodes.find((n) => n.connections[0] instanceof FakeCompressor) as FakeGain
/** A bus's level node = the node a voice of that bus connects into */
function levelFor(source: FakeSource): FakeGain {
  let at: FakeNode = source
  while (at.kind !== 'gain') at = at.connections[0]
  return (at.connections[0].kind === 'panner' ? at.connections[0].connections[0] : at.connections[0]) as FakeGain
}

describe('unlock (first tap)', () => {
  it('makes nothing before the first tap, and drops sounds asked for meanwhile (not queued)', async () => {
    const { audio, makeContext, ctx, tap } = setup()
    expect(audio.state()).toBe('locked')
    const result = audio.play('pop')
    expect(result).toMatchObject({ kind: 'drop', reason: 'locked' })
    expect(makeContext).not.toHaveBeenCalled()
    await tap()
    expect(ctx.startedSounds()).toHaveLength(0) // the dropped one never plays later
  })

  it('the first tap makes the context, resumes it, sets the iPhone session to ambient, and loads the effects', async () => {
    const { audio, makeContext, ctx, session, fetched, tap } = setup()
    await tap()
    expect(makeContext).toHaveBeenCalledTimes(1)
    expect(ctx.resumeCalls).toBe(1)
    expect(session.type).toBe('ambient')
    expect(audio.state()).toBe('running')
    expect(fetched.sort()).toEqual(['/game/audio/sfx/boom.mp3', '/game/audio/sfx/pop_1.mp3', '/game/audio/sfx/pop_2.mp3', '/game/audio/sfx/shaped.mp3', '/game/audio/ui/tap.mp3'])
    await tap()
    expect(makeContext).toHaveBeenCalledTimes(1)
  })

  it('a keydown unlocks too', async () => {
    const { audio, win } = setup()
    win.dispatchEvent(new Event('keydown'))
    await settle()
    expect(audio.state()).toBe('running')
  })
})

describe('the mix', () => {
  it('wires sfx: source → volume → bus level → bus mix → master → limiter → speakers', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    expect(audio.play('pop')).toMatchObject({ kind: 'play' })
    expect(pathOf(lastSource(ctx))).toEqual(['source', 'gain', 'gain', 'gain', 'gain', 'compressor', 'destination'])
  })

  it('music goes through the duck and the muffle filter before the master', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.play('theme')
    await settle()
    expect(pathOf(lastSource(ctx))).toEqual(['source', 'gain', 'gain', 'gain', 'gain', 'filter', 'gain', 'compressor', 'destination'])
  })

  it('the limiter holds the master at master.limiterDb', async () => {
    const { ctx, tap } = setup()
    await tap()
    const limiter = ctx.nodes.find((n) => n instanceof FakeCompressor) as FakeCompressor
    expect(limiter.threshold.value).toBe(-1)
    expect(limiter.ratio.value).toBe(20)
  })

  it('bus level = content dB × the player\'s slider; master = slider', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.play('tap')
    const uiLevel = levelFor(lastSource(ctx))
    expect(uiLevel.gain.value).toBeCloseTo(dbToGain(-8), 6)
    audio.setBusVolume('ui', 50)
    expect(uiLevel.gain.value).toBeCloseTo(dbToGain(-8) * 0.25, 6)
    audio.setBusVolume('master', 80)
    expect(masterOf(ctx).gain.value).toBeCloseTo(sliderToGain(80), 6)
    audio.setBusVolume('ui', 0)
    expect(uiLevel.gain.value).toBe(0)
  })

  it('settings made before the first tap apply when the mix is built', async () => {
    const { audio, ctx, tap } = setup()
    audio.setBusVolume('master', 50)
    audio.setMono(true)
    await tap()
    expect(masterOf(ctx).gain.value).toBeCloseTo(0.25, 6)
    expect(masterOf(ctx).channelCount).toBe(1)
  })

  it('mute: master to 0 and one-shots dropped; unmute brings it back', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.setMuted(true)
    expect(masterOf(ctx).gain.value).toBe(0)
    expect(audio.play('pop')).toMatchObject({ kind: 'drop', reason: 'muted' })
    audio.setMuted(false)
    expect(masterOf(ctx).gain.value).toBe(1)
  })

  it('mono: one channel at the master, folded down as speakers', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    const master = masterOf(ctx)
    audio.setMono(true)
    expect([master.channelCount, master.channelCountMode, master.channelInterpretation]).toEqual([1, 'explicit', 'speakers'])
    audio.setMono(false)
    expect(master.channelCount).toBe(2)
  })

  it('setConfig (live Dev Kit tuning) changes the bus levels', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.play('tap')
    const uiLevel = levelFor(lastSource(ctx))
    audio.setConfig({ ...CONFIG, buses: { ...CONFIG.buses, ui: -20 } })
    expect(uiLevel.gain.value).toBeCloseTo(dbToGain(-20), 6)
    expect(audio.config().buses.ui).toBe(-20)
  })
})

describe('level meters (Dev Kit)', () => {
  it('is 0 before the first tap, then reads the peak of a side-branch listener on that group', async () => {
    const { audio, ctx, tap } = setup()
    expect(audio.level('sfx')).toBe(0)
    await tap()
    expect(audio.level('sfx')).toBe(0)
    const analyser = ctx.nodes.find((n): n is FakeAnalyser => n instanceof FakeAnalyser)!
    analyser.wave = [0.1, -0.6, 0.3]
    expect(audio.level('sfx')).toBeCloseTo(0.6)
    expect(analyser.connections).toEqual([]) // it only listens: nothing comes out of it
    // the sfx group's mix node feeds it, and still feeds the master first (the sound's path is unchanged)
    const feeder = ctx.nodes.find((n) => n.connections.includes(analyser))!
    expect(feeder.connections[0]).not.toBe(analyser)
  })
  it('makes one listener per group, the master after the limiter', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.level('master')
    audio.level('master')
    audio.level('music')
    const analysers = ctx.nodes.filter((n) => n instanceof FakeAnalyser)
    expect(analysers).toHaveLength(2)
    const limiter = ctx.nodes.find((n) => n instanceof FakeCompressor)!
    expect(limiter.connections).toContain(analysers[0])
  })
})

describe('hidden tab, calls, lock screen', () => {
  it('hidden → suspended; sounds meanwhile are dropped and never burst out on return', async () => {
    const { audio, ctx, doc } = setup()
    const { tap } = { tap: async () => { /* unlock via the API */ audio.unlock(); await settle(); await settle() } }
    await tap()
    doc.setVisibility('hidden')
    expect(ctx.suspendCalls).toBe(1)
    expect(audio.state()).toBe('suspended')
    for (let i = 0; i < 20; i++) expect(audio.play('pop')).toMatchObject({ kind: 'drop', reason: 'suspended' })
    const before = ctx.startedSounds().length
    doc.setVisibility('visible')
    await settle()
    expect(audio.state()).toBe('running')
    expect(ctx.startedSounds().length).toBe(before)
  })

  it('with "mute in background" off, a hidden tab keeps playing', async () => {
    const { audio, ctx, doc, tap } = setup()
    await tap()
    audio.setMuteInBackground(false)
    doc.setVisibility('hidden')
    expect(ctx.suspendCalls).toBe(0)
    expect(audio.state()).toBe('running')
  })

  it('if the browser won\'t resume on return, the next tap does', async () => {
    const { audio, ctx, doc, tap } = setup()
    await tap()
    doc.setVisibility('hidden')
    ctx.allowResume = false
    doc.setVisibility('visible')
    await settle()
    expect(audio.state()).toBe('suspended')
    ctx.allowResume = true
    await tap()
    expect(audio.state()).toBe('running')
  })

  it('iOS "interrupted" (a phone call) counts as suspended', async () => {
    const { audio, ctx, session, tap } = setup()
    await tap()
    ctx.setState('interrupted')
    expect(audio.play('pop')).toMatchObject({ reason: 'suspended' })
    ctx.setState('running')
    session.state = 'interrupted'
    expect(audio.state()).toBe('suspended')
  })

  it('a loop asked for while locked starts once audio is unlocked (and loaded)', async () => {
    const { audio, ctx, tap } = setup()
    expect(audio.play('night')).toMatchObject({ reason: 'locked' })
    await tap()
    await settle()
    const loop = ctx.startedSounds().find((s) => s.loop)
    expect(loop).toBeDefined()
    expect([loop!.loopStart, loop!.loopEnd]).toEqual([0.2, 0.8])
    expect(audio.voices().map((v) => v.sound)).toEqual(['night'])
    // …and asking again doesn't start a second copy
    expect(audio.play('night')).toMatchObject({ reason: 'already-playing' })
  })

  it('stop() cancels a loop that was waiting', async () => {
    const { audio, ctx, tap } = setup()
    audio.play('night')
    audio.stop('night')
    await tap()
    await settle()
    expect(ctx.startedSounds()).toHaveLength(0)
  })
})

describe('playing', () => {
  it('passes the plan to the source: trims, speed, fades, filters, pan', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.play('shaped')
    const source = lastSource(ctx)
    expect(source.playbackRate.value).toBe(2)
    // start(when, offset 0.1 s, play 1 − 0.1 − 0.2 = 0.7 s of the file)
    expect(source.started![1]).toBeCloseTo(0.1, 6)
    expect(source.started![2]).toBeCloseTo(0.7, 6)
    expect(pathOf(source)).toEqual(['source', 'filter', 'filter', 'gain', 'panner', 'gain', 'gain', 'gain', 'compressor', 'destination'])
    const [thin, muffle] = [source.connections[0] as FakeFilter, source.connections[0].connections[0] as FakeFilter]
    expect([thin.type, thin.frequency.value, muffle.type, muffle.frequency.value]).toEqual(['highpass', 100, 'lowpass', 2000])
    const volume = muffle.connections[0] as FakeGain
    // fade in from 0, then fade out to 0 at the end (0.7 s of file at double speed = 0.35 s)
    expect(volume.gain.calls[0]).toEqual(['set', 0, 0])
    expect(volume.gain.calls.at(-1)![1]).toBe(0)
    expect(volume.gain.calls.at(-1)![2]).toBeCloseTo(0.35, 6)
  })

  it('a one-shot not loaded yet is dropped (it would be late) and loads for next time', async () => {
    const { audio, ctx, tap } = setup({ preload: false })
    await tap()
    expect(audio.play('tap')).toMatchObject({ kind: 'drop', reason: 'not-loaded' })
    await settle()
    expect(audio.play('tap')).toMatchObject({ kind: 'play' })
    expect(ctx.startedSounds()).toHaveLength(1)
  })

  it('one copy too many stops the oldest copy (with a tiny fade, no click)', async () => {
    const { audio, ctx, tap, advance } = setup()
    await tap()
    audio.play('pop')
    advance(10)
    audio.play('pop')
    advance(10)
    audio.play('pop')
    const [first, second, third] = ctx.startedSounds()
    expect(first.stoppedAt).not.toBeNull()
    expect(second.stoppedAt).toBeNull()
    expect(third.stoppedAt).toBeNull()
    expect(audio.voices()).toHaveLength(2)
  })

  it('a finished sound leaves the voice list', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.play('pop')
    expect(audio.voices()).toHaveLength(1)
    lastSource(ctx).end()
    expect(audio.voices()).toHaveLength(0)
  })

  it('a scheduled sound starts at its moment on the audio clock', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.play('tap', { at: 1250 })
    expect(lastSource(ctx).started![0]).toBeCloseTo(0.25, 6)
  })

  it('playTier plays the tier\'s sound', async () => {
    const { audio, tap } = setup()
    await tap()
    expect(audio.playTier('small')).toMatchObject({ kind: 'play', sound: 'pop' })
  })
})

describe('snapshots and ducking', () => {
  it('"paused" ramps the music down and muffles it; null ramps back', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.play('theme')
    await settle()
    const musicLevel = levelFor(lastSource(ctx))
    const musicMix = musicLevel.connections[0] as FakeGain
    const muffle = musicMix.connections[0].connections[0] as FakeFilter
    audio.snapshot('paused')
    expect(musicMix.gain.value).toBeCloseTo(dbToGain(-10), 6)
    expect(musicMix.gain.calls.at(-1)).toEqual(['ramp', dbToGain(-10), 0.25])
    expect(muffle.frequency.value).toBe(900)
    audio.snapshot(null)
    expect(musicMix.gain.value).toBe(1)
    expect(muffle.frequency.value).toBe(20000)
  })

  it('a snapshot chosen before the first tap applies when the mix is built', async () => {
    const { audio, ctx, tap } = setup()
    audio.snapshot('paused')
    await tap()
    const filters = ctx.nodes.filter((n) => n instanceof FakeFilter) as FakeFilter[]
    expect(filters.some((f) => f.frequency.value === 900)).toBe(true)
  })

  it('an unknown snapshot warns and changes nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { audio, tap } = setup()
    await tap()
    audio.snapshot('nope')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no snapshot called "nope"'))
    warn.mockRestore()
  })

  it('a mix pushed on top of another returns to it when popped (Pause during the Reveal)', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.play('theme')
    await settle()
    const musicMix = levelFor(lastSource(ctx)).connections[0] as FakeGain
    const muffle = musicMix.connections[0].connections[0] as FakeFilter
    audio.pushSnapshot('reveal')
    expect(musicMix.gain.calls.at(-1)).toEqual(['ramp', dbToGain(-6), 0.4]) // in over the reveal's fadeMs
    audio.pushSnapshot('paused')
    expect(audio.snapshots()).toEqual(['reveal', 'paused'])
    expect(musicMix.gain.calls.at(-1)).toEqual(['ramp', dbToGain(-10), 0.25])
    expect(muffle.frequency.value).toBe(900)
    audio.popSnapshot('paused')
    // back to the reveal — not to normal — over the paused mix's fadeMs
    expect(audio.snapshots()).toEqual(['reveal'])
    expect(musicMix.gain.calls.at(-1)).toEqual(['ramp', dbToGain(-6), 0.25])
    expect(muffle.frequency.value).toBe(20000)
    audio.popSnapshot('reveal')
    expect(musicMix.gain.calls.at(-1)).toEqual(['ramp', 1, 0.4])
    expect(audio.snapshots()).toEqual([])
  })

  it('popping a mix that is NOT on top changes nothing you hear (the Reveal ends while paused)', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.play('theme')
    await settle()
    const musicMix = levelFor(lastSource(ctx)).connections[0] as FakeGain
    audio.pushSnapshot('reveal')
    audio.pushSnapshot('paused')
    const calls = musicMix.gain.calls.length
    audio.popSnapshot('reveal')
    expect(audio.snapshots()).toEqual(['paused'])
    expect(musicMix.gain.calls.length).toBe(calls)
    audio.popSnapshot('reveal') // not there: nothing
    audio.popSnapshot('paused')
    expect(musicMix.gain.value).toBe(1)
  })

  it('snapshot(name) replaces the whole stack; snapshot(null) clears it', async () => {
    const { audio, tap } = setup()
    await tap()
    audio.pushSnapshot('reveal')
    audio.pushSnapshot('paused')
    audio.snapshot('reveal')
    expect(audio.snapshots()).toEqual(['reveal'])
    audio.snapshot(null)
    expect(audio.snapshots()).toEqual([])
  })

  it('a live edit that deletes a mix takes it off the stack', async () => {
    const { audio, tap } = setup()
    await tap()
    audio.pushSnapshot('reveal')
    audio.pushSnapshot('paused')
    audio.setConfig({ ...CONFIG, snapshots: { reveal: CONFIG.snapshots.reveal } })
    expect(audio.snapshots()).toEqual(['reveal'])
  })

  it('a ducking sound dips the music and brings it back', async () => {
    const { audio, ctx, tap } = setup()
    await tap()
    audio.play('theme')
    await settle()
    const musicLevel = levelFor(lastSource(ctx))
    const duck = musicLevel.connections[0].connections[0] as FakeGain
    audio.play('boom')
    const ramps = duck.gain.calls.filter((c) => c[0] === 'ramp')
    expect(ramps[0][1]).toBeCloseTo(dbToGain(-7), 6)
    expect(ramps[0][2]).toBeCloseTo(0.01, 6)
    expect(ramps[1]).toEqual(['ramp', 1, 0.61])
  })
})

describe('the log', () => {
  it('records plays and drops with reasons, and can sit on window.__audioLog', async () => {
    const { audio, tap } = setup()
    const seen: string[] = []
    const stop = audio.onLog((entry) => seen.push(`${entry.id}:${entry.result}`))
    audio.play('pop')
    await tap()
    audio.play('pop')
    audio.play('ghost')
    stop()
    audio.play('pop')
    expect(seen).toEqual(['pop:dropped', 'pop:played', 'ghost:dropped'])
    const entries = audio.log.entries()
    expect(entries.map((e) => e.reason ?? 'played')).toEqual(['locked', 'played', 'unknown-sound', 'played'])
    expect(entries[1].file).toMatch(/^sfx\/pop_[12]\.mp3$/)
    const target: { __audioLog?: unknown } = {}
    exposeLog(audio, target)
    expect(target.__audioLog).toBe(audio.log)
  })
})

describe('shared engine (playSound)', () => {
  it('does nothing before setAudio, then plays on the shared engine', async () => {
    setAudio(null)
    expect(playSound('pop')).toBeNull()
    const { audio, tap } = setup()
    setAudio(audio)
    await tap()
    expect(getAudio()).toBe(audio)
    expect(playSound('pop')).toMatchObject({ kind: 'play' })
    setAudio(null)
  })
})

describe('dispose', () => {
  it('stops listening to taps and closes the context', async () => {
    const { audio, ctx, tap, makeContext } = setup()
    audio.dispose()
    await tap()
    expect(makeContext).not.toHaveBeenCalled()
    expect(audio.play('pop')).toMatchObject({ kind: 'drop' })
    expect(ctx.state).toBe('suspended')
  })
})

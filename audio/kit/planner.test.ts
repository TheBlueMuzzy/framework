import { describe, expect, it } from 'vitest'
import { readAudioConfig, type AudioConfig } from './config.ts'
import { freshMemory, ladderSemitones, planPlay, seededRandom, type ActiveVoice, type Drop, type PlanInput, type PlayPlan, type SoundMemory } from './planner.ts'

const config: AudioConfig = readAudioConfig({
  ladder: { scale: 'pentatonic', root: 'D', steps: 6, resetMs: 1000 },
  limits: { maxVoices: 4, staleMs: 400 },
  sounds: {
    pop: { files: ['sfx/pop_1.mp3', 'sfx/pop_2.mp3', 'sfx/pop_3.mp3'], cooldownMs: 0, maxVoices: 8 },
    one: { files: ['sfx/one.mp3'], cooldownMs: 0, maxVoices: 8 },
    seq: { files: ['a.mp3', 'b.mp3', 'c.mp3'], pick: 'sequence', cooldownMs: 0, maxVoices: 8 },
    bag: { files: ['a.mp3', 'b.mp3', 'c.mp3', 'd.mp3'], pick: 'shuffle', cooldownMs: 0, maxVoices: 8 },
    land: { files: ['sfx/land.mp3'], volumeDb: -6, pitch: 2, randomPitch: 1, randomVolumeDb: 3, cooldownMs: 40, maxVoices: 2, priority: 2 },
    pad: { files: ['sfx/pad.mp3'], delayMs: 50, trimStartMs: 20, trimEndMs: 100, fadeInMs: 10, fadeOutMs: 300, pan: -0.5, lowpassHz: 1200, highpassHz: 80, duck: true },
    score: { files: ['sfx/score.mp3'], ladder: true, randomPitch: 2, cooldownMs: 0, maxVoices: 8 },
    night: { files: ['amb/night.mp3'], bus: 'ambience', loop: true, loopStartMs: 1500, loopEndMs: 61500 },
    low: { files: ['ui/low.mp3'], bus: 'ui', priority: 0, cooldownMs: 0, maxVoices: 8 },
    high: { files: ['sfx/high.mp3'], priority: 4, cooldownMs: 0, maxVoices: 8 },
    empty: { files: [] },
  },
}, () => {})

/** Plays a sound with sensible defaults; override any input. */
function plan(name: string, overrides: Partial<PlanInput> = {}) {
  return planPlay({ name, config, voices: [], now: 1000, rng: seededRandom(1), engine: 'running', ...overrides })
}
const played = (result: { plan: PlayPlan | Drop }) => {
  if (result.plan.kind !== 'play') throw new Error(`expected a play, got a drop: ${result.plan.reason}`)
  return result.plan
}
const dropReason = (result: { plan: PlayPlan | Drop }) => (result.plan.kind === 'drop' ? result.plan.reason : 'played')

/** Plays the same sound n times in a row, carrying memory, t ms apart. Returns the plans. */
function playMany(name: string, times: number, gapMs = 100, seed = 7): PlayPlan[] {
  const rng = seededRandom(seed)
  let memory: SoundMemory = freshMemory()
  const plans: PlayPlan[] = []
  for (let i = 0; i < times; i++) {
    const result = planPlay({ name, config, voices: [], now: 1000 + i * gapMs, rng, engine: 'running', memory })
    plans.push(played(result))
    memory = result.memory
  }
  return plans
}

const voice = (v: Partial<ActiveVoice> & { id: number }): ActiveVoice => ({ sound: 'x', bus: 'sfx', startAt: 900, endAt: 2000, gainDb: 0, priority: 2, ...v })

describe('drops (with a reason)', () => {
  it('unknown sound / no files', () => {
    expect(dropReason(plan('nope'))).toBe('unknown-sound')
    expect(dropReason(plan('empty'))).toBe('no-files')
  })

  it('locked and suspended engines drop — even loops — and nothing is queued', () => {
    expect(dropReason(plan('pop', { engine: 'locked' }))).toBe('locked')
    expect(dropReason(plan('pop', { engine: 'suspended' }))).toBe('suspended')
    expect(dropReason(plan('night', { engine: 'suspended' }))).toBe('suspended')
    // A drop leaves the memory alone: the next real play is not affected by what was dropped
    const memory = freshMemory()
    expect(plan('pop', { engine: 'suspended', memory }).memory).toBe(memory)
  })

  it('muted drops one-shots but not loops (they keep going silently under the master mute)', () => {
    expect(dropReason(plan('pop', { muted: true }))).toBe('muted')
    expect(dropReason(plan('night', { muted: true }))).toBe('played')
  })

  it('catch-up is silent', () => {
    expect(dropReason(plan('pop', { options: { catchUp: true } }))).toBe('catch-up')
  })

  it('a loop that is already playing is not started twice', () => {
    const voices = [voice({ id: 1, sound: 'night', bus: 'ambience', endAt: Infinity })]
    expect(dropReason(plan('night', { voices }))).toBe('already-playing')
  })
})

describe('timing: at, delay, stale', () => {
  it('plays now when there is no "at"', () => {
    const p = played(plan('one'))
    expect(p.startAt).toBe(1000)
    expect(p.delayMs).toBe(0)
  })

  it('schedules a future moment', () => {
    expect(played(plan('one', { options: { at: 1250 } })).delayMs).toBe(250)
  })

  it('a moment a little in the past plays right away', () => {
    expect(played(plan('one', { options: { at: 700 } })).delayMs).toBe(0)
  })

  it('a moment older than staleMs is dropped', () => {
    expect(dropReason(plan('one', { options: { at: 599 } }))).toBe('stale')
    expect(dropReason(plan('one', { options: { at: 600 } }))).toBe('played')
  })

  it('adds the sound\'s own delay and the caller\'s delay', () => {
    expect(played(plan('pad', { options: { at: 1100, delayMs: 30 } })).delayMs).toBe(180)
  })
})

describe('cooldown', () => {
  it('skips a repeat inside the cooldown, plays after it', () => {
    const first = plan('land')
    expect(dropReason(plan('land', { now: 1039, memory: first.memory }))).toBe('cooldown')
    expect(dropReason(plan('land', { now: 1040, memory: first.memory }))).toBe('played')
  })

  it('compares scheduled start times, so a scheduled run spaced wider than the cooldown all plays', () => {
    const first = plan('land', { options: { at: 1000 } })
    expect(dropReason(plan('land', { memory: first.memory, options: { at: 1050 } }))).toBe('played')
    expect(dropReason(plan('land', { memory: first.memory, options: { at: 1020 } }))).toBe('cooldown')
  })
})

describe('variants', () => {
  it('random never plays the same file twice in a row', () => {
    const plans = playMany('pop', 300)
    for (let i = 1; i < plans.length; i++) expect(plans[i].fileIndex).not.toBe(plans[i - 1].fileIndex)
    // …and uses every file
    expect(new Set(plans.map((p) => p.fileIndex))).toEqual(new Set([0, 1, 2]))
  })

  it('one file is always that file', () => {
    expect(playMany('one', 5).map((p) => p.file)).toEqual(Array(5).fill('sfx/one.mp3'))
  })

  it('sequence plays in order and wraps', () => {
    expect(playMany('seq', 7).map((p) => p.file)).toEqual(['a.mp3', 'b.mp3', 'c.mp3', 'a.mp3', 'b.mp3', 'c.mp3', 'a.mp3'])
  })

  it('shuffle plays each file once per round, never the same twice across rounds', () => {
    const plans = playMany('bag', 40)
    for (let round = 0; round < 10; round++) {
      const files = plans.slice(round * 4, round * 4 + 4).map((p) => p.fileIndex)
      expect([...files].sort()).toEqual([0, 1, 2, 3])
    }
    for (let i = 1; i < plans.length; i++) expect(plans[i].fileIndex).not.toBe(plans[i - 1].fileIndex)
  })

  it('a shorter files list (live edit) never picks a file that is gone', () => {
    const memory: SoundMemory = { ...freshMemory(), lastFile: 5, bag: [7, 2] }
    expect(played(plan('bag', { memory })).fileIndex).toBe(2)
    expect(played(plan('pop', { memory })).fileIndex).toBeLessThan(3)
  })
})

describe('volume and pitch', () => {
  it('turns dB into a volume and semitones into a speed', () => {
    const p = played(plan('one', { options: { volumeDb: -6, pitch: 12 } }))
    expect(p.gainDb).toBe(-6)
    expect(p.gain).toBeCloseTo(0.501, 3)
    expect(p.playbackRate).toBe(2)
  })

  it('random pitch and volume stay inside their ranges and vary', () => {
    const plans = playMany('land', 200, 100)
    for (const p of plans) {
      expect(p.semitones).toBeGreaterThanOrEqual(1)
      expect(p.semitones).toBeLessThanOrEqual(3)
      expect(p.gainDb).toBeGreaterThanOrEqual(-9)
      expect(p.gainDb).toBeLessThanOrEqual(-3)
      expect(p.playbackRate).toBeCloseTo(2 ** (p.semitones / 12), 10)
    }
    expect(new Set(plans.map((p) => p.semitones.toFixed(3))).size).toBeGreaterThan(50)
  })

  it('the same seed gives the same plays (replays and tests are exact)', () => {
    expect(playMany('land', 20, 100, 42)).toEqual(playMany('land', 20, 100, 42))
    expect(playMany('land', 20, 100, 42)).not.toEqual(playMany('land', 20, 100, 43))
  })
})

describe('the rest of the plan', () => {
  it('passes trims, fades, filters, pan and duck through in seconds', () => {
    const p = played(plan('pad'))
    expect(p).toMatchObject({
      trimStartSec: 0.02, trimEndSec: 0.1, fadeInSec: 0.01, fadeOutSec: 0.3,
      lowpassHz: 1200, highpassHz: 80, pan: -0.5, duck: true, bus: 'sfx', loop: false, steal: [],
    })
  })

  it('a pan option overrides the sound\'s pan, kept within −1…1', () => {
    expect(played(plan('pad', { options: { pan: 0.3 } })).pan).toBe(0.3)
    expect(played(plan('pad', { options: { pan: 4 } })).pan).toBe(1)
  })

  it('loops carry their loop points', () => {
    expect(played(plan('night'))).toMatchObject({ loop: true, loopStartSec: 1.5, loopEndSec: 61.5, bus: 'ambience' })
  })
})

describe('voice limits', () => {
  it('one copy too many cuts the oldest copy of that sound', () => {
    const voices = [voice({ id: 1, sound: 'land', startAt: 950 }), voice({ id: 2, sound: 'land', startAt: 800 })]
    expect(played(plan('land', { voices })).steal).toEqual([2])
  })

  it('copies that have ended don\'t count', () => {
    const voices = [voice({ id: 1, sound: 'land', endAt: 990 }), voice({ id: 2, sound: 'land', endAt: 1000 })]
    expect(played(plan('land', { voices })).steal).toEqual([])
  })

  it('at the global cap, cuts the least important, then quietest, then oldest', () => {
    const voices = [
      voice({ id: 1, priority: 3, gainDb: -20 }),
      voice({ id: 2, priority: 1, gainDb: -3, startAt: 500 }),
      voice({ id: 3, priority: 1, gainDb: -10, startAt: 900 }),
      voice({ id: 4, priority: 1, gainDb: -10, startAt: 600 }),
    ]
    expect(played(plan('one', { voices })).steal).toEqual([4])
  })

  it('drops the new sound when everything playing is more important', () => {
    const voices = [1, 2, 3, 4].map((id) => voice({ id, priority: 3 }))
    const result = plan('low', { voices })
    expect(dropReason(result)).toBe('global-limit')
    // …but an important sound gets in
    expect(played(plan('high', { voices })).steal).toHaveLength(1)
  })

  it('music, ambience and loops don\'t count toward the cap', () => {
    const voices = [
      voice({ id: 1, bus: 'music', endAt: Infinity }),
      voice({ id: 2, bus: 'ambience', endAt: Infinity }),
      voice({ id: 3, sound: 'whir', endAt: Infinity }),
      voice({ id: 4 }),
    ]
    expect(played(plan('one', { voices })).steal).toEqual([])
  })

  it('stealing its own oldest copy also makes room under the global cap', () => {
    const voices = [voice({ id: 1, sound: 'land', startAt: 100 }), voice({ id: 2, sound: 'land' }), voice({ id: 3 }), voice({ id: 4 })]
    expect(played(plan('land', { voices })).steal).toEqual([1])
  })
})

describe('the ladder', () => {
  it('pentatonic steps: 0 2 4 7 9 12…', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((s) => ladderSemitones('pentatonic', s))).toEqual([0, 2, 4, 7, 9, 12, 14])
    expect(ladderSemitones('chromatic', 13)).toBe(13)
  })

  it('climbs one step per quick repeat, holds the top, and has no random pitch', () => {
    const plans = playMany('score', 9, 150)
    expect(plans.map((p) => p.ladderStep)).toEqual([0, 1, 2, 3, 4, 5, 5, 5, 5])
    expect(plans.map((p) => p.semitones)).toEqual([0, 2, 4, 7, 9, 12, 12, 12, 12])
  })

  it('starts over at the bottom after resetMs of quiet', () => {
    const a = plan('score', { now: 1000 })
    const b = plan('score', { now: 1500, memory: a.memory })
    expect(played(b).ladderStep).toBe(1)
    expect(played(plan('score', { now: 2500, memory: b.memory })).ladderStep).toBe(2)
    expect(played(plan('score', { now: 2501, memory: b.memory })).ladderStep).toBe(0)
  })

  it('climbs for a scheduled run asked for all at once (score pops at their times)', () => {
    let memory = freshMemory()
    const steps: (number | null)[] = []
    for (const at of [1200, 1320, 1440, 1560]) {
      const result = plan('score', { memory, options: { at } })
      steps.push(played(result).ladderStep)
      memory = result.memory
    }
    expect(steps).toEqual([0, 1, 2, 3])
  })

  it('a game can name the step itself', () => {
    expect(played(plan('score', { options: { step: 3 } })).semitones).toBe(7)
    expect(played(plan('score', { options: { step: 99 } })).ladderStep).toBe(5)
  })

  it('non-ladder sounds have no step', () => {
    expect(played(plan('one')).ladderStep).toBeNull()
  })
})

describe('purity', () => {
  it('never changes what it is given', () => {
    const memory: SoundMemory = { lastStartAt: 0, lastFile: 1, bag: [2, 0], ladderStep: 2, ladderLastAt: 900 }
    const voices = [voice({ id: 1, sound: 'bag' })]
    const before = JSON.stringify({ memory, voices, config })
    plan('bag', { memory, voices })
    plan('score', { memory, voices })
    expect(JSON.stringify({ memory, voices, config })).toBe(before)
  })
})

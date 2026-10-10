// Runs in the framework (not copied into games): knob paths, notes, presets, looping and the moments list.
import { describe, expect, it } from 'vitest'
import {
  activeStyle, allStyles, checkMoments, fitRange, guessRole, knobInfo, liveName, momentMatches, momentsFor, nextFireDelay,
  noteFor, readKnob, resolveKeys, sharedWith, styleValue, writeKnob,
} from './momentLogic'
import type { DevKitMoment, MomentKnob } from './momentTypes'

const audio = {
  _labels: { 'sounds.*.volumeDb': 'Volume (dB)', 'buses.sfx': 'Sound effects (dB)' },
  _help: { 'sounds.*.volumeDb': 'How loud.' },
  _ranges: { 'sounds.*.volumeDb': [-40, 6, 0.5], 'sounds.score.pop.pitch': [-12, 12, 0.1] },
  buses: { sfx: 0 },
  sounds: { 'score.pop': { volumeDb: -8, pitch: 0 }, score: { volumeDb: -2 }, tangle: { volumeDb: -4 } },
}

describe('knob paths (keys may hold dots)', () => {
  it('walks the longest key that exists', () => {
    expect(resolveKeys(audio, 'sounds.score.pop.volumeDb')).toEqual(['sounds', 'score.pop', 'volumeDb'])
    expect(resolveKeys(audio, 'sounds.score.volumeDb')).toEqual(['sounds', 'score', 'volumeDb'])
    expect(resolveKeys(audio, 'buses.sfx')).toEqual(['buses', 'sfx'])
    expect(resolveKeys(audio, 'sounds.nope.volumeDb')).toBeNull()
  })
  it('reads and writes without touching anything else', () => {
    expect(readKnob(audio, 'sounds.score.pop.volumeDb')).toBe(-8)
    const next = writeKnob(audio, 'sounds.score.pop.volumeDb', -5)
    expect(readKnob(next, 'sounds.score.pop.volumeDb')).toBe(-5)
    expect(readKnob(audio, 'sounds.score.pop.volumeDb')).toBe(-8) // the original stays
    expect(next._help).toEqual(audio._help)
    expect(() => writeKnob(audio, 'sounds.nope.volumeDb', 1)).toThrow(/isn't in the file/)
  })
  it('names a file the way live edits do', () => {
    expect(liveName('content/tuning/feel.json')).toBe('feel')
    expect(liveName('content/audio.json')).toBe('audio')
  })
})

describe('notes: exact or wildcard', () => {
  it('finds the exact entry first, then a wildcard, and says what * stood for', () => {
    expect(noteFor(audio._ranges, ['sounds', 'score.pop', 'pitch'])).toEqual({ value: [-12, 12, 0.1], stars: [] })
    expect(noteFor(audio._ranges, ['sounds', 'score.pop', 'volumeDb'])).toEqual({ value: [-40, 6, 0.5], stars: ['score.pop'] })
    expect(noteFor(audio._ranges, ['buses', 'music'])).toBeUndefined()
  })
  it('a knob row gets a label (with the sound named), help and a range', () => {
    const info = knobInfo({ file: 'content/audio.json', path: 'sounds.score.pop.volumeDb' }, audio, -8)
    expect(info.label).toBe('score.pop: Volume (dB)')
    expect(info.help).toBe('How loud.')
    expect(info.range).toEqual({ min: -40, max: 6, step: 0.5 })
    expect(info.ranges).toEqual({ 'sounds.score.pop.volumeDb': [-40, 6, 0.5] })
  })
  it('no notes: a label from the key and a made-up range', () => {
    const info = knobInfo({ file: 'content/tuning/feel.json', path: 'tiers.big.grow' }, { tiers: { big: { grow: 0.5 } } }, 0.5)
    expect(info.label).toBe('Grow')
    expect(info.range).toEqual({ min: 0, max: 1, step: 0.01 })
  })
})

describe('presets', () => {
  it('guesses what a key does', () => {
    expect(guessRole('tiers.big.grow')).toBe('size')
    expect(guessRole('tiers.big.shake')).toBe('shake')
    expect(guessRole('sounds.score.pop.volumeDb')).toBe('volume')
    expect(guessRole('sounds.score.pop.randomPitch')).toBe('randomPitch')
    expect(guessRole('sounds.score.pop.randomVolumeDb')).toBe('none')
    expect(guessRole('scorePopMs')).toBe('duration')
    expect(guessRole('trailFade')).toBe('duration')
    expect(guessRole('revealDelayMs')).toBe('delay')
    expect(guessRole('sounds.chordLetters')).toBe('none')
  })
  it('relative rules: Soft is gentler and slower, Punchy bigger and quicker; Balanced is the file', () => {
    const grow: MomentKnob = { file: 'content/tuning/feel.json', path: 'tiers.big.grow' }
    expect(styleValue(grow, 'soft', 0.5)).toBe(0.3)
    expect(styleValue(grow, 'balanced', 0.5)).toBe(0.5)
    expect(styleValue(grow, 'punchy', 0.5)).toBe(0.7)
    const time: MomentKnob = { file: 'content/tuning/anim.json', path: 'popMs' }
    expect(styleValue(time, 'soft', 400)).toBe(520)
    expect(styleValue(time, 'punchy', 400)).toBe(300)
    const vol: MomentKnob = { file: 'content/audio.json', path: 'sounds.score.pop.volumeDb' }
    expect(styleValue(vol, 'soft', -8)).toBe(-11)
    expect(styleValue(vol, 'punchy', -8)).toBe(-6)
  })
  it('stays inside the range and on its steps', () => {
    expect(fitRange(1.4, { min: 0, max: 1, step: 0.01 })).toBe(1)
    expect(fitRange(0.123456, { min: 0, max: 1, step: 0.01 })).toBe(0.12)
    expect(fitRange(5.3, { min: -40, max: 6, step: 0.5 })).toBe(5.5)
    const grow: MomentKnob = { file: 'f', path: 'grow' }
    expect(styleValue(grow, 'punchy', 0.9, { min: 0, max: 1, step: 0.01 })).toBe(1)
  })
  it('exact values win; text and "none" knobs stay put', () => {
    const exact: MomentKnob = { file: 'f', path: 'grow', values: { soft: 0.1, punchy: 0.9 } }
    expect(styleValue(exact, 'soft', 0.5)).toBe(0.1)
    expect(styleValue(exact, 'balanced', 0.5)).toBe(0.5) // no exact balanced: the file's value
    expect(styleValue({ file: 'f', path: 'events.totalPop' }, 'punchy', 'big')).toBe('big')
    expect(styleValue({ file: 'f', path: 'grow', role: 'none' }, 'punchy', 0.5)).toBe(0.5)
    expect(styleValue({ file: 'f', path: 'events.totalPop', values: { punchy: 'big', soft: 'small' } }, 'soft', 'medium')).toBe('small')
  })
  it('shows the active style, or custom after a tweak', () => {
    const knobs: MomentKnob[] = [{ file: 'f', path: 'grow' }, { file: 'f', path: 'popMs' }]
    const base = { grow: 0.5, popMs: 400 } as Record<string, number>
    const styles = allStyles(knobs, (k) => base[k.path], () => undefined)
    expect(styles.soft).toEqual([0.3, 520])
    expect(activeStyle([0.5, 400], styles)).toBe('balanced')
    expect(activeStyle([0.7, 300], styles)).toBe('punchy')
    expect(activeStyle([0.7, 310], styles)).toBe('custom')
  })
})

describe('looping', () => {
  it('waits the rest of the interval, never overlapping a long play', () => {
    expect(nextFireDelay(1000, 1600, 2500)).toBe(1900)
    expect(nextFireDelay(1000, 4000, 2500)).toBe(0)
  })
})

describe('the moments list', () => {
  const play = () => {}
  const pop: DevKitMoment = { id: 'pop', screen: 'board', label: 'Score pop', note: 'the +1s', knobs: [{ file: 'content/tuning/feel.json', path: 'tiers.big.grow' }], play }
  const win: DevKitMoment = { id: 'win', screen: 'reveal', label: 'New Grand Glyphtender', knobs: [{ file: 'content/tuning/feel.json', path: 'tiers.big.grow' }], play }
  const bad: DevKitMoment = { id: 'pop', screen: 'nowhere', label: 'Copy', knobs: [{ file: 'src/x.ts', path: 'a' }], play }
  it('picks one screen\'s moments', () => {
    expect(momentsFor([pop, win], 'board').map((m) => m.id)).toEqual(['pop'])
  })
  it('names problems in plain words', () => {
    expect(checkMoments([pop, win], ['board', 'reveal'])).toEqual([])
    expect(checkMoments([pop, bad], ['board'])).toEqual([
      'two moments are called "pop"',
      'moment "pop" plays on screen "nowhere", which isn\'t in the previews list',
      'moment "pop": knob file "src/x.ts" must be a content/…json file',
    ])
  })
  it('says which other moments share a knob', () => {
    expect(sharedWith([pop, win], pop, pop.knobs[0])).toEqual(['New Grand Glyphtender'])
  })
  it('search looks at the name, the note and the id', () => {
    expect(momentMatches(pop, '+1')).toBe(true)
    expect(momentMatches(win, 'grand')).toBe(true)
    expect(momentMatches(win, 'pop')).toBe(false)
  })
})

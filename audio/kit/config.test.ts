import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG, DEFAULT_SOUND, dbToGain, readAudioConfig, readSound, semitonesToRate, sliderToGain } from './config.ts'

const template = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'templates', 'content', 'audio.json'), 'utf8'))

function collect() {
  const messages: string[] = []
  return { warn: (m: string) => messages.push(m), messages }
}

describe('readAudioConfig', () => {
  it('reads the starter template with no warnings', () => {
    const { warn, messages } = collect()
    const config = readAudioConfig(template, warn)
    expect(messages).toEqual([])
    expect(config.buses).toEqual({ music: -8, ambience: -10, sfx: 0, ui: -8 })
    expect(config.sounds['example.pop'].files).toHaveLength(3)
    expect(config.snapshots.paused.lowpassHz).toBe(900)
    expect(config.sounds['tier.big'].duck).toBe(true)
  })

  it('fills every missing part with defaults', () => {
    const { warn, messages } = collect()
    const config = readAudioConfig({ sounds: { tap: { files: ['ui/tap.mp3'] } } }, warn)
    expect(messages).toEqual([])
    expect(config.buses).toEqual(DEFAULT_CONFIG.buses)
    expect(config.limits).toEqual({ maxVoices: 14, staleMs: 400 })
    expect(config.sounds.tap).toEqual({ ...DEFAULT_SOUND, files: ['ui/tap.mp3'] })
  })

  it('never throws on garbage — warns and uses the defaults', () => {
    for (const junk of [null, 42, 'loud', [], { sounds: 'nope' }, { buses: { music: 'loud' } }]) {
      const { warn, messages } = collect()
      expect(() => readAudioConfig(junk, warn)).not.toThrow()
      expect(messages.length).toBeGreaterThan(0)
    }
  })

  it('does not change the defaults it copies from', () => {
    const config = readAudioConfig({}, () => {})
    config.buses.music = 5
    config.snapshots.paused.music = 3
    expect(DEFAULT_CONFIG.buses.music).toBe(-8)
    expect(DEFAULT_CONFIG.snapshots.paused.music).toBe(-10)
  })

  it('skips _help / _labels / _sections / _ranges and "_" sounds', () => {
    const { warn, messages } = collect()
    const config = readAudioConfig({ _help: { x: 'y' }, sounds: { _note: 'hi', a: { files: [], _help: 'notes' } } }, warn)
    expect(messages).toEqual([])
    expect(Object.keys(config.sounds)).toEqual(['a'])
  })

  it('keeps the music section as written (framework F28)', () => {
    const music = { layers: { bed: { files: ['mus/bed.mp3'] } } }
    expect(readAudioConfig({ music }, () => {}).music).toEqual(music)
  })

  it('warns once per message on the console by default', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    readAudioConfig({ limits: { staleMs: 'soon' } })
    readAudioConfig({ limits: { staleMs: 'soon' } })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toContain('limits.staleMs should be a number')
    spy.mockRestore()
  })
})

describe('readSound', () => {
  it('clamps out-of-range numbers with a plain-English warning', () => {
    const { warn, messages } = collect()
    const sound = readSound('boom', { files: ['a.mp3'], volumeDb: 20, pitch: -30, maxVoices: 2.6 }, warn)
    expect(sound.volumeDb).toBe(6)
    expect(sound.pitch).toBe(-12)
    expect(sound.maxVoices).toBe(3)
    expect(messages[0]).toBe('sounds["boom"].volumeDb is 20, outside -40…6 — using 6.')
  })

  it('replaces wrong types and unknown choices with defaults', () => {
    const { warn, messages } = collect()
    const sound = readSound('x', { files: 'a.mp3', pick: 'loudest', bus: 'voices', loop: 'yes', cooldownMs: null }, warn)
    expect(sound).toEqual(DEFAULT_SOUND)
    expect(messages).toHaveLength(5)
  })

  it('points out misspelled settings', () => {
    const { warn, messages } = collect()
    readSound('x', { volmeDb: -3 }, warn)
    expect(messages).toEqual(['sounds["x"].volmeDb is not a sound setting — ignored (check the spelling).'])
  })

  it('filters: 0 is off, 1–19 Hz becomes 20', () => {
    const { warn } = collect()
    expect(readSound('x', { lowpassHz: 0 }, warn).lowpassHz).toBe(0)
    expect(readSound('x', { lowpassHz: 5 }, warn).lowpassHz).toBe(20)
    expect(readSound('x', { highpassHz: 400 }, warn).highpassHz).toBe(400)
  })

  it('a loop end before the loop start loops the whole file', () => {
    const { warn, messages } = collect()
    const sound = readSound('x', { loop: true, loopStartMs: 2000, loopEndMs: 1000 }, warn)
    expect([sound.loopStartMs, sound.loopEndMs]).toEqual([0, 0])
    expect(messages).toHaveLength(1)
  })
})

describe('sound maths', () => {
  it('dB → volume', () => {
    expect(dbToGain(0)).toBe(1)
    expect(dbToGain(-6)).toBeCloseTo(0.501, 3)
    expect(dbToGain(-20)).toBeCloseTo(0.1, 6)
  })

  it('semitones → speed', () => {
    expect(semitonesToRate(0)).toBe(1)
    expect(semitonesToRate(12)).toBe(2)
    expect(semitonesToRate(-12)).toBe(0.5)
  })

  it('slider curve: 0 is silent, middle sounds like the middle', () => {
    expect(sliderToGain(0)).toBe(0)
    expect(sliderToGain(100)).toBe(1)
    expect(20 * Math.log10(sliderToGain(50))).toBeCloseTo(-12.04, 1)
    expect(20 * Math.log10(sliderToGain(80))).toBeCloseTo(-3.88, 1)
    expect(sliderToGain(-5)).toBe(0)
    expect(sliderToGain(150)).toBe(1)
    expect(sliderToGain(Number.NaN)).toBe(0)
  })
})

import { describe, expect, it } from 'vitest'
// The audio module's own defaults + ranges — the Music section's copy must match them
import { DEFAULT_LAYER, DEFAULT_TRACK, LAYER_RANGES, TRACK_RANGES } from '../../../audio/kit/config.ts'
import {
  LAYER_KNOBS, TRACK_KNOBS, layerFile, layerValue, layersOf, musicHelp, musicLabel, musicRange, musicStatusText, trackChanged,
  trackNames, trackValue, tracksOf, withLayerValue, withTrackValue,
} from './musicLogic'
import type { RawAudio } from './soundLogic'

const FILE: RawAudio = {
  _help: { 'music.tracks.*.fadeInMs': 'Fade in.', 'music.tracks.garden': 'The game screen.', 'music.tracks.*.layers.*.volumeDb': 'Layer volume.' },
  _labels: { 'music.tracks.*.fadeInMs': 'Fade in (ms)!', 'music.tracks.*.restSeconds': 'Rest (s)' },
  _ranges: { 'music.tracks.*.fadeInMs': [0, 5000, 100], 'music.tracks.garden.layers.pad.volumeDb': [-20, 0] },
  music: {
    _note: 'skipped',
    tracks: {
      garden: {
        layers: { harp: { file: 'mus/harp.mp3' }, pad: { files: ['mus/pad.mp3'], volumeDb: -6, fromIntensity: 0.3 } },
        restSeconds: [45, 75],
        fadeInMs: 1500,
      },
      menu: { layers: { main: { file: 'mus/menu_kalimba.mp3' } }, restSeconds: 20 },
    },
  },
}

describe('the knobs match the audio module (framework/audio/kit/config.ts)', () => {
  it('track knobs: same defaults and ranges', () => {
    for (const knob of TRACK_KNOBS) {
      if (knob.key.startsWith('restSeconds.')) {
        expect(knob.fallback).toBe(DEFAULT_TRACK.restSeconds[Number(knob.key.split('.')[1])])
        expect(knob.range).toEqual(TRACK_RANGES.restSeconds)
        continue
      }
      expect(knob.fallback, knob.key).toEqual(DEFAULT_TRACK[knob.key as keyof typeof DEFAULT_TRACK])
      if (knob.kind === 'number') expect(knob.range, knob.key).toEqual(TRACK_RANGES[knob.key as keyof typeof TRACK_RANGES])
    }
    // every track setting has a knob (layers are edited one by one)
    const keys = new Set(TRACK_KNOBS.map((k) => k.key.split('.')[0]))
    expect(keys).toEqual(new Set(Object.keys(DEFAULT_TRACK).filter((k) => k !== 'layers')))
  })
  it('layer knobs: same defaults and ranges', () => {
    for (const knob of LAYER_KNOBS) {
      expect(knob.fallback, knob.key).toBe(DEFAULT_LAYER[knob.key as keyof typeof DEFAULT_LAYER])
      expect(knob.range, knob.key).toEqual(LAYER_RANGES[knob.key as keyof typeof LAYER_RANGES])
    }
    expect(new Set(LAYER_KNOBS.map((k) => k.key))).toEqual(new Set(Object.keys(LAYER_RANGES)))
  })
})

describe('reading the music section', () => {
  it('lists tracks and layers (notes skipped), and a layer\'s file or first of files', () => {
    expect(Object.keys(tracksOf(FILE))).toEqual(['garden', 'menu'])
    expect(Object.keys(layersOf(FILE, 'garden'))).toEqual(['harp', 'pad'])
    expect(layerFile(layersOf(FILE, 'garden').pad)).toBe('mus/pad.mp3')
    expect(tracksOf({})).toEqual({})
  })
  it('values: own, else the default; the rest pair reads as two sliders (one number = both)', () => {
    expect(trackValue(FILE, 'garden', 'fadeInMs')).toBe(1500)
    expect(trackValue(FILE, 'garden', 'fadeOutMs')).toBe(3000)
    expect(trackValue(FILE, 'garden', 'loop')).toBe(true)
    expect(trackValue(FILE, 'garden', 'restSeconds.0')).toBe(45)
    expect(trackValue(FILE, 'garden', 'restSeconds.1')).toBe(75)
    expect(trackValue(FILE, 'menu', 'restSeconds.1')).toBe(20)
    expect(trackValue(FILE, 'nope', 'restSeconds.0')).toBe(60)
    expect(layerValue(FILE, 'garden', 'pad', 'volumeDb')).toBe(-6)
    expect(layerValue(FILE, 'garden', 'pad', 'fullAtIntensity')).toBe(0)
  })
  it('notes: exact first, then the wildcard; the two rest sliders keep their own labels', () => {
    const fadeIn = TRACK_KNOBS.find((k) => k.key === 'fadeInMs')!
    const restLow = TRACK_KNOBS.find((k) => k.key === 'restSeconds.0')!
    const volume = LAYER_KNOBS.find((k) => k.key === 'volumeDb')!
    expect(musicLabel(FILE, 'garden', null, fadeIn)).toBe('Fade in (ms)!')
    expect(musicLabel(FILE, 'garden', null, restLow)).toBe('Rest: shortest (s)')
    expect(musicHelp(FILE, 'garden', null, fadeIn)).toBe('Fade in.')
    expect(musicRange(FILE, 'garden', null, fadeIn)).toEqual([0, 5000, 100])
    expect(musicRange(FILE, 'garden', 'pad', volume)).toEqual([-20, 0, 0.5]) // its own range; step from the module
    expect(musicRange(FILE, 'garden', 'harp', volume)).toEqual([-40, 6, 0.5])
    expect(musicHelp(FILE, 'garden', 'harp', volume)).toBe('Layer volume.')
  })
  it('search: by track name, layer name or file', () => {
    expect(trackNames(FILE, 'kalimba')).toEqual(['menu'])
    expect(trackNames(FILE, 'pad')).toEqual(['garden'])
    expect(trackNames(FILE, 'game screen')).toEqual(['garden'])
    expect(trackNames(FILE)).toEqual(['garden', 'menu'])
  })
})

describe('editing (copies — the original never changes)', () => {
  it('a track knob', () => {
    const next = withTrackValue(FILE, 'garden', 'playsBeforeRest', 3)
    expect(trackValue(next, 'garden', 'playsBeforeRest')).toBe(3)
    expect(trackValue(FILE, 'garden', 'playsBeforeRest')).toBe(2)
    expect(trackChanged(next, FILE, 'garden')).toBe(true)
    expect(trackChanged(next, FILE, 'menu')).toBe(false)
  })
  it('one end of the rest writes the pair', () => {
    const next = withTrackValue(FILE, 'menu', 'restSeconds.1', 40)
    expect(tracksOf(next).menu.restSeconds).toEqual([20, 40])
  })
  it('a layer knob', () => {
    const next = withLayerValue(FILE, 'garden', 'harp', 'fullAtIntensity', 0.5)
    expect(layerValue(next, 'garden', 'harp', 'fullAtIntensity')).toBe(0.5)
    expect(layersOf(FILE, 'garden').harp.fullAtIntensity).toBeUndefined()
  })
})

describe('the "Now" line', () => {
  const base = { track: 'garden', play: 2, playsBeforeRest: 3, restLeftMs: 0, intensity: 0, layers: [] }
  it('says what the music is doing in plain words', () => {
    expect(musicStatusText(null)).toBe('off')
    expect(musicStatusText({ ...base, phase: 'playing' })).toBe('garden · play 2 of 3')
    expect(musicStatusText({ ...base, phase: 'playing', playsBeforeRest: 0 })).toBe('garden · play 2')
    expect(musicStatusText({ ...base, phase: 'resting', restLeftMs: 41200 })).toBe('garden · resting — back in 42 s')
    expect(musicStatusText({ ...base, phase: 'waiting' })).toBe('garden · waiting for the first tap')
    expect(musicStatusText({ ...base, phase: 'off', track: null })).toBe('off')
  })
})

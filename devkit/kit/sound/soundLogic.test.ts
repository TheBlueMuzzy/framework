import { describe, expect, it } from 'vitest'
// The audio module's own defaults + ranges — the Sound tab's copy must match them
import { DEFAULT_SOUND, SOUND_RANGES } from '../../../audio/kit/config.ts'
import {
  KNOBS, abConfig, checkLicence, creditEntry, dragValue, fileChanged, folderFor, handlesFor, knobHelp, knobLabel, knobRange,
  knobValue, moveItem, nearestHandle, noteFor, peaksOf, soundChanged, soundGroups, stemFor, tierOf, withFiles, withMixValue,
  withOnlyFile, withSoundValue, type RawAudio,
} from './soundLogic'

const FILE: RawAudio = {
  _help: { 'sounds.*.volumeDb': 'How loud, in dB.', 'sounds.seed.land': 'The seed lands.', 'sounds.seed.land.pitch': 'Its own pitch note.' },
  _labels: { 'sounds.*.volumeDb': 'Volume (dB)' },
  _ranges: { 'sounds.*.volumeDb': [-30, 6, 0.5], 'sounds.seed.land.pitch': [-2, 2, 0.1], 'sounds.*.delayMs': [0, 500] },
  tiers: { small: 'tier.small', big: 'boom' },
  sounds: {
    _note: 'skipped',
    'seed.land': { bus: 'sfx', files: ['sfx/sfx_seed_land_01.mp3', 'sfx/sfx_seed_land_02.mp3'], volumeDb: -3 },
    'ui.tap': { bus: 'ui', files: ['ui/ui_button_tap_01.mp3'] },
    'amb.night': { bus: 'ambience', files: ['amb/amb_night_garden_loop.mp3'], loop: true },
    boom: { files: ['stg/stg_boom_01.mp3'], duck: true },
  },
}

describe('KNOBS match the audio module (framework/audio/kit/config.ts)', () => {
  it('has every setting of a sound, with the same defaults', () => {
    const keys = KNOBS.map((k) => k.key)
    expect(new Set([...keys, 'files'])).toEqual(new Set(Object.keys(DEFAULT_SOUND)))
    for (const knob of KNOBS) expect(knob.fallback, knob.key).toEqual(DEFAULT_SOUND[knob.key as keyof typeof DEFAULT_SOUND])
  })
  it('has the same slider ranges', () => {
    for (const [key, range] of Object.entries(SOUND_RANGES)) expect(KNOBS.find((k) => k.key === key)?.range, key).toEqual(range)
  })
})

describe('notes with the "sounds.*" wildcard', () => {
  it('finds a sound\'s own note first, then the wildcard', () => {
    expect(noteFor(FILE, '_ranges', 'seed.land', 'pitch')).toEqual([-2, 2, 0.1])
    expect(noteFor(FILE, '_ranges', 'ui.tap', 'volumeDb')).toEqual([-30, 6, 0.5])
    expect(noteFor(FILE, '_ranges', 'ui.tap', 'pitch')).toBeUndefined()
  })
  it('knobRange: the file\'s range, a missing step from the module, else the module\'s range', () => {
    expect(knobRange(FILE, 'seed.land', 'pitch')).toEqual([-2, 2, 0.1])
    expect(knobRange(FILE, 'ui.tap', 'pitch')).toEqual([-12, 12, 0.1])
    expect(knobRange(FILE, 'ui.tap', 'delayMs')).toEqual([0, 500, 5])
    expect(knobRange({}, 'x', 'volumeDb')).toEqual([-40, 6, 0.5])
  })
  it('labels and help in plain English (a readable fallback)', () => {
    expect(knobLabel(FILE, 'ui.tap', 'volumeDb')).toBe('Volume (dB)')
    expect(knobLabel(FILE, 'ui.tap', 'randomPitch')).toBe('random pitch')
    expect(knobHelp(FILE, 'ui.tap', 'volumeDb')).toBe('How loud, in dB.')
    expect(knobHelp(FILE, 'seed.land', 'pitch')).toBe('Its own pitch note.')
    expect(knobHelp(FILE, 'ui.tap', 'pan')).toBeUndefined()
  })
})

describe('values and edits', () => {
  it('a knob is the sound\'s own value, else the default', () => {
    expect(knobValue(FILE, 'seed.land', 'volumeDb')).toBe(-3)
    expect(knobValue(FILE, 'ui.tap', 'volumeDb')).toBe(0)
    expect(knobValue(FILE, 'ui.tap', 'cooldownMs')).toBe(30)
    expect(knobValue(FILE, 'boom', 'bus')).toBe('sfx')
  })
  it('an edit changes a copy, not the original', () => {
    const edited = withSoundValue(FILE, 'seed.land', 'volumeDb', -9, FILE)
    expect(knobValue(edited, 'seed.land', 'volumeDb')).toBe(-9)
    expect(knobValue(FILE, 'seed.land', 'volumeDb')).toBe(-3)
    expect(edited._help).toEqual(FILE._help) // notes ride along untouched
    expect(soundChanged(edited, FILE, 'seed.land')).toBe(true)
    expect(soundChanged(edited, FILE, 'ui.tap')).toBe(false)
    expect(fileChanged(edited, FILE)).toBe(true)
  })
  it('↺ to a default the saved sound never spelled out leaves no trace', () => {
    const edited = withSoundValue(FILE, 'ui.tap', 'pitch', 3, FILE)
    expect((edited.sounds as Record<string, object>)['ui.tap']).toHaveProperty('pitch', 3)
    const back = withSoundValue(edited, 'ui.tap', 'pitch', 0, FILE)
    expect((back.sounds as Record<string, object>)['ui.tap']).not.toHaveProperty('pitch')
    expect(fileChanged(back, FILE)).toBe(false)
  })
  it('a value the saved sound did spell out stays spelled out', () => {
    const edited = withSoundValue(FILE, 'seed.land', 'volumeDb', 0, FILE)
    expect((edited.sounds as Record<string, object>)['seed.land']).toHaveProperty('volumeDb', 0)
  })
  it('files: replace, move, and mixer values', () => {
    const files = ['a.mp3', 'b.mp3', 'c.mp3']
    expect(moveItem(files, 0, 1)).toEqual(['b.mp3', 'a.mp3', 'c.mp3'])
    expect(moveItem(files, 2, -1)).toEqual(['a.mp3', 'c.mp3', 'b.mp3'])
    expect(moveItem(files, 0, -1)).toEqual(files)
    expect(knobValue(withFiles(FILE, 'ui.tap', ['ui/x_01.mp3']), 'ui.tap', 'files')).toEqual(['ui/x_01.mp3'])
    expect(withMixValue({ buses: { sfx: 0 } }, 'buses', 'music', -10).buses).toEqual({ sfx: 0, music: -10 })
    expect(withMixValue({}, 'master', 'limiterDb', -2).master).toEqual({ limiterDb: -2 })
  })
})

describe('A / B', () => {
  const edited = withSoundValue(withSoundValue(FILE, 'seed.land', 'volumeDb', -12, FILE), 'ui.tap', 'pitch', 2, FILE)
  it('A = this sound as saved, everything else as edited', () => {
    const a = abConfig(edited, FILE, 'seed.land', 'A')
    expect(knobValue(a, 'seed.land', 'volumeDb')).toBe(-3)
    expect(knobValue(a, 'ui.tap', 'pitch')).toBe(2)
  })
  it('B = the edit', () => {
    expect(abConfig(edited, FILE, 'seed.land', 'B')).toEqual(edited)
  })
  it('both sides play the same one file', () => {
    const file = 'sfx/sfx_seed_land_02.mp3'
    const a = withOnlyFile(abConfig(edited, FILE, 'seed.land', 'A'), 'seed.land', file)
    const b = withOnlyFile(abConfig(edited, FILE, 'seed.land', 'B'), 'seed.land', file)
    expect(knobValue(a, 'seed.land', 'files')).toEqual([file])
    expect(knobValue(b, 'seed.land', 'files')).toEqual([file])
    expect(knobValue(a, 'seed.land', 'volumeDb')).toBe(-3)
    expect(knobValue(b, 'seed.land', 'volumeDb')).toBe(-12)
    expect(knobValue(edited, 'seed.land', 'files')).toHaveLength(2) // the edit itself keeps both files
  })
})

describe('the list', () => {
  it('groups by volume group (effects, menus, ambience, music), skipping notes', () => {
    const groups = soundGroups(FILE)
    expect(groups.map((g) => g.bus)).toEqual(['sfx', 'ui', 'ambience'])
    expect(groups[0].sounds.map((s) => s.name)).toEqual(['seed.land', 'boom'])
    expect(groups[0].sounds[1]).toMatchObject({ tier: 'big', files: ['stg/stg_boom_01.mp3'] })
  })
  it('the search box filters by name, group, file and help text (all words)', () => {
    const names = (q: string) => soundGroups(FILE, q).flatMap((g) => g.sounds.map((s) => s.name))
    expect(names('seed')).toEqual(['seed.land'])
    expect(names('ui')).toEqual(['ui.tap'])
    expect(names('ambience')).toEqual(['amb.night'])
    expect(names('stg_boom')).toEqual(['boom'])
    expect(names('lands')).toEqual(['seed.land'])
    expect(names('big')).toEqual(['boom'])
    expect(names('seed tap')).toEqual([])
  })
  it('knows each sound\'s feel tier', () => {
    expect(tierOf(FILE, 'boom')).toBe('big')
    expect(tierOf(FILE, 'seed.land')).toBeUndefined()
  })
})

describe('new files', () => {
  it('go in the folder the sound already uses, else its group\'s folder', () => {
    expect(folderFor({ files: ['stg/stg_boom_01.mp3'], bus: 'sfx' })).toBe('stg')
    expect(folderFor({ bus: 'ambience' })).toBe('amb')
    expect(folderFor({ bus: 'music', files: [] })).toBe('mus')
    expect(folderFor(undefined)).toBe('sfx')
  })
  it('are named category_object_action from the sound\'s name', () => {
    expect(stemFor('seed.land', 'sfx')).toBe('sfx_seed_land')
    expect(stemFor('tangle', 'sfx')).toBe('sfx_tangle')
    expect(stemFor('Reveal.Winner!', 'stg')).toBe('stg_reveal_winner')
    expect(stemFor('amb.night', 'amb')).toBe('amb_night') // no amb_amb_…
    expect(stemFor('ui.tap', 'ui')).toBe('ui_tap')
    expect(stemFor('ui', 'ui')).toBe('ui_ui')
  })
})

describe('credits', () => {
  it('CC0 and own work are green, no credit line', () => {
    expect(checkLicence('CC0')).toEqual({ light: '🟢', needsCredit: false })
    expect(checkLicence('own work').light).toBe('🟢')
    expect(creditEntry({ path: 'sfx/sfx_pop_01.mp3', source: 'Freesound — pop.wav', author: 'Ann', licence: 'CC0', url: 'https://x' })).toEqual({
      paths: ['public/audio/sfx/sfx_pop_01.mp3'], source: 'Freesound — pop.wav', author: 'Ann', licence: 'CC0', light: '🟢', url: 'https://x', credit: '',
    })
  })
  it('CC-BY is yellow with a credit line', () => {
    expect(checkLicence('CC-BY 4.0')).toEqual({ light: '🟡', needsCredit: true })
    expect(creditEntry({ path: 'ui/ui_tap_01.mp3', source: 'tap.wav', author: 'Bo', licence: 'CC-BY 4.0', url: '' }).credit).toBe('tap.wav by Bo, CC-BY 4.0')
  })
  it('non-commercial and no-derivatives are red, with a warning', () => {
    expect(checkLicence('CC-BY-NC 4.0')).toMatchObject({ light: '🔴' })
    expect(checkLicence('CC BY NC').warning).toMatch(/non-commercial/)
    expect(checkLicence('CC-BY-ND').light).toBe('🔴')
  })
  it('an unknown licence is yellow and says to check it', () => {
    expect(checkLicence('Sampling+').warning).toMatch(/check/)
  })
})

describe('the waveform', () => {
  it('peaks: the lowest and highest sample of each column', () => {
    expect(peaksOf([0, 0.5, -0.25, 0.1, -1, 0.2], 3)).toEqual([[0, 0.5], [-0.25, 0.1], [-1, 0.2]])
    expect(peaksOf([0.3], 2)).toEqual([[0, 0.3], [0, 0.3]]) // fewer samples than columns: each column shows its nearest
  })
  it('handles: trim end counts from the end, loop handles only for loops (loop end 0 = the end)', () => {
    const values = { trimStartMs: 20, trimEndMs: 100, loop: false, loopStartMs: 0, loopEndMs: 0 }
    expect(handlesFor(values, 1000)).toEqual([{ key: 'trimStartMs', ms: 20 }, { key: 'trimEndMs', ms: 900 }])
    expect(handlesFor({ ...values, loop: true, loopStartMs: 200 }, 1000).slice(2)).toEqual([{ key: 'loopStartMs', ms: 200 }, { key: 'loopEndMs', ms: 1000 }])
  })
  it('a drag picks the nearest handle, and lands on the slider\'s step', () => {
    const handles = handlesFor({ trimStartMs: 0, trimEndMs: 0, loop: false, loopStartMs: 0, loopEndMs: 0 }, 1000)
    expect(nearestHandle(handles, 3, 1000, 400)).toBe('trimStartMs')
    expect(nearestHandle(handles, 396, 1000, 400)).toBe('trimEndMs')
    expect(nearestHandle(handles, 200, 1000, 400)).toBeNull()
    expect(dragValue('trimStartMs', 43, 1000, 5)).toBe(45)
    expect(dragValue('trimEndMs', 880, 1000, 5)).toBe(120)
    expect(dragValue('loopEndMs', 5000, 1000, 10)).toBe(1000)
    expect(dragValue('trimStartMs', -20, 1000, 5)).toBe(0)
  })
})

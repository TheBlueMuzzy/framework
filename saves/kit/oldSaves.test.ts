import { describe, expect, it } from 'vitest'
import {
  checkDamagedSaves, checkFullStorage, checkGoldenSave, checkRoundTrip, goldenFileName, goldenSavesFor, goldenVersionOf, makeGoldenSave, missingGoldenVersions,
} from './oldSaves'
import { createSave, type Save } from './saves'

const quiet = () => {}
const choices = createSave({
  key: 'glyphtender:new-game', kind: 'settings', version: 2, onProblem: quiet, storage: null,
  fresh: { players: 2, twoLetterWords: false },
  upgrades: { 2: (v1: { players: number }) => ({ ...v1, twoLetterWords: false }) },
})

describe('golden save files', () => {
  it('are named after the key (odd characters → _) and the version', () => {
    expect(goldenFileName('glyphtender:new-game', 2)).toBe('glyphtender_new-game-v2.json')
    expect(goldenFileName('goops-progress', 1, 'before-the-module')).toBe('goops-progress-v1-before-the-module.json')
    expect(goldenVersionOf('glyphtender:new-game', './glyphtender_new-game-v12.json')).toBe(12)
    expect(goldenVersionOf('glyphtender:new-game', 'tests/saves/glyphtender_new-game-v1-old.json')).toBe(1)
    expect(goldenVersionOf('goops-progress', 'goops-progress-v1.json.bak')).toBeNull()
    expect(goldenVersionOf('goops', 'goops-progress-v1.json')).toBeNull() // another save's
  })

  it('missing versions are named; several files for one version count once', () => {
    expect(missingGoldenVersions('a:b', 3, ['a_b-v1.json', 'a_b-v1-old.json', 'a_b-v3.json'])).toEqual([2])
    expect(missingGoldenVersions('a:b', 1, [])).toEqual([1])
  })

  it('goldenSavesFor picks this save\'s files, oldest version first', () => {
    const files = { './x_y-v1.json': { stored: 1 }, './glyphtender_new-game-v2.json': { stored: 2 }, './glyphtender_new-game-v1.json': { stored: 1 } }
    expect(goldenSavesFor('glyphtender:new-game', files).map((g) => g.version)).toEqual([1, 2])
  })
})

describe('the checks the game\'s ready-made test runs', () => {
  it('a golden save from each version loads with the right values', () => {
    const v1 = { stored: { save: 'glyphtender:new-game', version: 1, savedAt: '', data: { players: 3, twoLetterWords: true } }, expect: { players: 3, twoLetterWords: false } }
    expect(checkGoldenSave(choices, v1)).toEqual([])
    const v2 = JSON.parse(makeGoldenSave(choices, { players: 4, twoLetterWords: true }, 'a v2 save'))
    expect(v2.stored).toMatchObject({ version: 2 })
    expect(checkGoldenSave(choices, v2)).toEqual([])
  })

  it('a golden save that no longer loads, or loads wrong, is named in plain words', () => {
    expect(checkGoldenSave(choices, { stored: 'garbage' })[0]).toContain('didn\'t load')
    expect(checkGoldenSave(choices, { stored: { save: 'glyphtender:new-game', version: 7, data: {} } })[0]).toContain('newer')
    const wrong = checkGoldenSave(choices, { stored: { save: 'glyphtender:new-game', version: 2, savedAt: '', data: { players: 2 } }, expect: { players: 3 } })
    expect(wrong).toEqual(['"players" loaded as 2, expected 3'])
  })

  it('round trip, damaged saves and full storage pass for a working save', () => {
    const sample = { players: 4, twoLetterWords: true }
    expect(checkRoundTrip(choices, sample)).toEqual([])
    expect(checkDamagedSaves(choices, sample)).toEqual([])
    expect(checkFullStorage(choices, sample)).toEqual([])
  })

  it('…and catch a save that loses data on the way', () => {
    const lossy = createSave({ key: 'x:lossy', kind: 'settings', version: 1, storage: null, onProblem: quiet, fresh: { a: 1, b: 2 }, clean: (d) => ({ ...d, b: 2 }) })
    expect(checkRoundTrip(lossy, { a: 5, b: 9 })[0]).toContain('loaded')
  })

  it('…and a save that throws', () => {
    const throwing = { ...choices, withStorage: () => ({ ...choices, load: () => { throw new Error('boom') }, save: () => { throw new Error('boom') }, key: 'x', report: choices.report }) } as unknown as Save<unknown>
    expect(checkDamagedSaves(throwing, {}).join('\n')).toContain('threw boom')
    expect(checkFullStorage(throwing, {}).join('\n')).toContain('threw boom')
  })

  it('slots are tested through one slot', () => {
    const slots = createSave({ key: 'x:slots', kind: 'slots', version: 1, storage: null, onProblem: quiet, fresh: { level: 1 } })
    expect(checkRoundTrip(slots, { level: 4 })).toEqual([])
    expect(checkDamagedSaves(slots, { level: 4 })).toEqual([])
  })
})

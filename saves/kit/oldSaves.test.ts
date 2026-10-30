import { describe, expect, it } from 'vitest'
import {
  checkDamagedSaves, checkFullStorage, checkGoldenSave, checkRoundTrip, checkRunEnds, goldenFileName, goldenSavesFor, goldenVersionOf, makeGoldenSave, missingGoldenVersions,
} from './oldSaves'
import { createRun, type Run } from './run'
import { createSave, type Save } from './saves'
import { memoryStorage, removeKey, type StorageLike } from './storage'

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

describe('runs (createRun)', () => {
  const matchRun = () => createRun({ key: 'glyphtender:run', version: 2, onProblem: quiet, storage: null, page: null,
    fresh: { turn: 0, scores: [0, 0] }, upgrades: { 2: (v1: { turn: number }) => ({ ...v1, scores: [0, 0] }) } })

  it('a run\'s golden saves, round trip, damaged saves and full storage go through its save', () => {
    const run = matchRun()
    const v1 = { stored: { save: 'glyphtender:run', version: 1, savedAt: '2026-10-20T09:00:00.000Z', data: { turn: 6 } }, expect: { turn: 6, scores: [0, 0] } }
    expect(checkGoldenSave(run.save, v1)).toEqual([])
    expect(checkGoldenSave(run.save, JSON.parse(makeGoldenSave(run.save, { turn: 7, scores: [3, 4] }, 'v2')))).toEqual([])
    expect(checkRoundTrip(run.save, { turn: 7, scores: [3, 4] })).toEqual([])
    expect(checkDamagedSaves(run.save, { turn: 7, scores: [3, 4] })).toEqual([])
    expect(checkFullStorage(run.save, { turn: 7, scores: [3, 4] })).toEqual([])
  })

  it('a run cleared at the end never comes back', () => {
    expect(checkRunEnds(matchRun(), { turn: 7, scores: [3, 4] })).toEqual([])
  })

  it('…and a run whose end() only wipes the newest copy is caught (its backup would come back)', () => {
    const real = matchRun()
    const leaky = {
      ...real,
      withStorage: (storage: StorageLike | null): Run<unknown> => ({ ...real.withStorage(storage), end: () => removeKey(storage, real.key) }),
    } as Run<unknown>
    const problems = checkRunEnds(leaky, { turn: 7, scores: [3, 4] })
    expect(problems.join(' | ')).toContain('left copies behind: glyphtender:run~1')
    expect(problems.join(' | ')).toContain('the finished run loads again')
  })
})

describe('a save from before the module that is plain text, not JSON (F166 — Glyphtender\'s tutorial "done")', () => {
  const tutorial = (oldSave?: (raw: unknown) => { version: number; data: unknown } | null) => createSave({
    key: 'glyphtender:tutorial', kind: 'progress', version: 1, fresh: { done: false }, onProblem: quiet, storage: null, oldSave,
  })
  const knowsDone = (raw: unknown) => (raw === 'done' ? { version: 1, data: { done: true } } : null)

  it('the stored text "done" reaches oldSave as that text and is adopted', () => {
    const save = tutorial(knowsDone).withStorage(memoryStorage({ 'glyphtender:tutorial': 'done' }))
    expect(save.load()).toEqual({ done: true })
    expect(save.report()).toMatchObject({ from: 'save', problems: [], note: null })
    expect(save.peek()).toMatchObject({ state: 'good', savedAt: '', data: { done: true } })
  })

  it('the first save after it keeps the old text as the newest backup', () => {
    const storage = memoryStorage({ 'glyphtender:tutorial': 'done' })
    const save = tutorial(knowsDone).withStorage(storage)
    expect(save.save({ done: true }).ok).toBe(true)
    expect(storage.data['glyphtender:tutorial~1']).toBe('done')
    expect(JSON.parse(storage.data['glyphtender:tutorial'])).toMatchObject({ save: 'glyphtender:tutorial', version: 1, data: { done: true } })
  })

  it('text oldSave doesn\'t know — or no oldSave at all, or one that throws — is still damaged, in the same words as before', () => {
    for (const save of [tutorial(knowsDone), tutorial(), tutorial(() => { throw new Error('boom') })]) {
      const placed = save.withStorage(memoryStorage({ 'glyphtender:tutorial': 'half-done' }))
      expect(placed.load()).toEqual({ done: false })
      expect(placed.report().problems).toEqual(['the save: it is cut off or isn\'t readable (not JSON)'])
    }
  })

  it('JSON values still reach oldSave parsed, exactly as before', () => {
    const seen: unknown[] = []
    const save = tutorial((raw) => { seen.push(raw); return knowsDone(raw) ?? (raw && typeof raw === 'object' ? { version: 1, data: raw } : null) })
    expect(save.withStorage(memoryStorage({ 'glyphtender:tutorial': '"done"' })).load()).toEqual({ done: true })
    expect(save.withStorage(memoryStorage({ 'glyphtender:tutorial': '{"done":true}' })).load()).toEqual({ done: true })
    expect(seen).toEqual(['done', { done: true }])
  })

  it('a golden save whose "stored" is text is put in storage as that exact text', () => {
    expect(checkGoldenSave(tutorial(knowsDone), { stored: 'done', expect: { done: true } })).toEqual([])
    expect(checkGoldenSave(tutorial(), { stored: 'done' })[0]).toContain('didn\'t load')
    // the value copied from DevTools as text (not pasted in as JSON) is the same save
    const asText = JSON.stringify({ save: 'glyphtender:tutorial', version: 1, savedAt: '', data: { done: true } })
    expect(checkGoldenSave(tutorial(), { stored: asText, expect: { done: true } })).toEqual([])
  })

  it('round trip, damaged saves and full storage still pass for a save with a text oldSave', () => {
    expect(checkRoundTrip(tutorial(knowsDone), { done: true })).toEqual([])
    expect(checkDamagedSaves(tutorial(knowsDone), { done: true })).toEqual([])
    expect(checkFullStorage(tutorial(knowsDone), { done: true })).toEqual([])
  })
})

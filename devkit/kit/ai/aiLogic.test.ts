// Runs in the framework (not copied into games): the AI tab's thinking.
import { describe, expect, it } from 'vitest'
import { BANTER_SECTION, aiSections, applyBanterLive, banterChanges, banterOf, copyPersonality, freeId, getAt, labelOf, lineKeys, listChanges, moveGoal, nextLineKey, searchAi, setAt, settingsName, steadyLabel, strayKeys, withLine, withBanter, withList, withRange, withSteady, withSuggestion } from './aiLogic'
import { sampleAi, bully, bullySuggestion } from './sampleAi.test'

describe('Suggest sliders → Apply (0.26.0)', () => {
  it('sets only the changed sliders on the personality as it is now — other unsaved edits stay', () => {
    const edited = { ...bully(), chattiness: 10, goals: ['SCORE', 'TRAP'] } // unsaved edits made after the suggestion started
    const next = withSuggestion(edited, bullySuggestion())
    expect(next.traits).toEqual({ aggression: { min: 60, max: 75 }, greed: { min: 30, max: 50 } })
    expect(next.steady).toEqual({ SCORE: 0.3 })
    expect(next.nudge).toBe(0.2) // not marked changed → left alone
    expect(next.chattiness).toBe(10)
    expect(next.goals).toEqual(['SCORE', 'TRAP'])
    expect(edited.traits.aggression).toEqual({ min: 80, max: 95 }) // the original is untouched
  })

  it('nothing suggested, or another personality\'s suggestion, changes nothing', () => {
    const b = bully()
    expect(withSuggestion(b, bullySuggestion({ suggested: null }))).toBe(b)
    expect(withSuggestion({ ...b, id: 'Scholar' }, bullySuggestion()).traits.aggression).toEqual({ min: 80, max: 95 })
  })
})

describe('AI tab logic', () => {
  it('a range keeps inside 0–100 and the moved end pushes the other', () => {
    expect(withRange(bully(), 'greed', -5, 120, 'min').traits.greed).toEqual({ min: 0, max: 100 })
    expect(withRange(bully(), 'greed', 70, 50, 'min').traits.greed).toEqual({ min: 70, max: 70 })
    expect(withRange(bully(), 'greed', 70, 50, 'max').traits.greed).toEqual({ min: 50, max: 50 })
  })

  it('steady: sets a goal (kept inside 0–1), clears one, and drops "steady" when none is left', () => {
    expect(withSteady(bully(), 'TRAP', 0.3).steady).toEqual({ SCORE: 0.6, TRAP: 0.3 })
    expect(withSteady(bully(), 'TRAP', 7).steady).toEqual({ SCORE: 0.6, TRAP: 1 })
    expect('steady' in withSteady(bully(), 'SCORE', undefined)).toBe(false)
    expect(steadyLabel(sampleAi().personalities, 'SCORE')).toBe('Always tries to score too')
    expect(steadyLabel(sampleAi().personalities, 'TRAP')).toBe('TRAP')
  })

  it("the game's settings files become sections like the Tuning tab's", () => {
    expect(settingsName('content/ai/goals.json')).toBe('goals')
    const section = aiSections(sampleAi()).find((s) => s.file === 'settings')!
    expect(section.title).toBe('AI: big moments')
    expect(section.note).toBe("Each goal's big-moment bar.")
    expect(section.fields!.map((f) => [f.file, f.path, f.label])).toEqual([['goals', 'bigAt.TRAP', 'Big moment: hunt (TRAP)'], ['goals', 'bigAt.SCORE', 'Big at score']])
  })

  it('moves a goal in the order; nonsense moves change nothing', () => {
    expect(moveGoal(['A', 'B', 'C'], 2, 0)).toEqual(['C', 'A', 'B'])
    expect(moveGoal(['A', 'B', 'C'], 0, 1)).toEqual(['B', 'A', 'C'])
    expect(moveGoal(['A', 'B'], 0, 5)).toEqual(['A', 'B'])
  })

  it('copies a personality fully under a free name', () => {
    const b = bully()
    const copy = copyPersonality(b, freeId('Bully', ['Bully', 'Bully2']))
    expect(copy.id).toBe('Bully3')
    copy.traits.greed.min = 1
    expect(b.traits.greed.min).toBe(30)
    expect(freeId('my new one!', [])).toBe('mynewone')
  })

  it('setAt makes missing objects and never touches the original', () => {
    const data = { ai: { personality: { Bully: { name: 'the Bully', bio: 'old' } } } }
    const next = setAt(data, ['ai', 'personality', 'Bully2', 'bio'], 'new')
    expect(getAt(next, ['ai', 'personality', 'Bully2', 'bio'])).toBe('new')
    expect(getAt(next, ['ai', 'personality', 'Bully', 'bio'])).toBe('old')
    expect(getAt(data, ['ai', 'personality', 'Bully2'])).toBeUndefined()
  })

  it('a saved file keeps its notes', () => {
    const ai = sampleAi()
    const saved = withList(ai.personalities, [])
    expect(saved._help).toBe(ai.personalities.data._help)
    expect(saved._sections).toBe(ai.personalities.data._sections)
    expect(saved.personalities).toEqual([])
  })

  it('lists changes in plain words', () => {
    const before = [bully()]
    const after = [withRange(bully(), 'greed', 40, 50, 'min'), { ...bully(), id: 'Bully2' }]
    expect(listChanges(before, after)).toEqual(['Bully: traits.greed.min 30 → 40', expect.stringMatching(/^new: Bully2/)])
  })

  it('labels come from _labels, else from the key', () => {
    const ai = sampleAi()
    expect(labelOf(ai.personalities, 'traits.aggression')).toBe('Aggression → TRAP')
    expect(labelOf(ai.skills, 'beliefNoise')).toBe('Belief noise')
  })

  it('sections come from the files (+ bio / watch / check) and the search finds settings inside them', () => {
    const ai = sampleAi()
    const sections = aiSections(ai)
    // shifts isn't in the sample's _sections, so it gets the "— more" section
    expect(sections.map((s) => s.title)).toEqual(['AI: who it is', 'AI: traits', 'AI: banter, nerve & words', 'AI: personality — more', 'AI: bio', 'AI: big moments', 'AI: skill', 'AI: watch a game', 'AI: Personality Check'])
    const nerve = searchAi(sections, 'nerve')
    expect(nerve.map((s) => s.title)).toEqual(['AI: banter, nerve & words'])
    expect(searchAi(sections, 'trap')[0].items.map((i) => i.key)).toEqual(['traits.aggression'])
    expect(searchAi(sections, 'wobble').map((s) => s.title)).toEqual(['AI: skill'])
  })
})

describe('AI tab logic — banter lines (0.24.0)', () => {
  const lines = () => ({ Bully: { won: 'Too easy.', won_3: 'Again?', won_2: 'Next!', wonder: 'stray', lost: 'Rigged.' } })
  it('copies the lines, lists a moment\'s keys in order, picks the next free key', () => {
    expect(banterOf({ banter: { Bully: { won: 'Hi', bad: 3 }, odd: 'x' } }, ['banter'])).toEqual({ Bully: { won: 'Hi' } })
    expect(banterOf({}, ['banter'])).toEqual({})
    expect(lineKeys(lines(), 'Bully', 'won')).toEqual(['won', 'won_2', 'won_3'])
    expect(nextLineKey(lines(), 'Bully', 'won')).toBe('won_4')
    expect(nextLineKey(lines(), 'Bully', 'gotHit')).toBe('gotHit')
    expect(nextLineKey({ Bully: { won_2: 'x' } }, 'Bully', 'won')).toBe('won')
    expect(strayKeys(lines(), 'Bully', ['won', 'lost'])).toEqual(['wonder'])
  })
  it('withLine sets or removes one line without touching the original', () => {
    const before = lines()
    const after = withLine(before, 'Bully', 'won', 'Is that all?')
    expect([before.Bully.won, after.Bully.won]).toEqual(['Too easy.', 'Is that all?'])
    expect(withLine(before, 'Bully', 'lost', undefined).Bully).not.toHaveProperty('lost')
    expect(withLine(before, 'Shy', 'won', 'Oh.').Shy).toEqual({ won: 'Oh.' })
  })
  it('applyBanterLive edits the game\'s own object in place (the same object it reads from), other keys untouched', () => {
    const game: Record<string, unknown> = { title: 'Game', banter: { Bully: { won: 'Too easy.', lost: 'Rigged.' }, Gone: { won: 'x' } } }
    const held = game.banter as Record<string, Record<string, string>>
    const bullyLines = held.Bully
    applyBanterLive(game, ['banter'], { Bully: { won: 'Next!' }, Shy: { gotHit: 'Oh.' } })
    expect(game.banter).toBe(held) // (the same object: the game's lines() sees it)
    expect(held.Bully).toBe(bullyLines)
    expect(held).toEqual({ Bully: { won: 'Next!' }, Shy: { gotHit: 'Oh.' } })
    expect(game.title).toBe('Game')
    const empty: Record<string, unknown> = {}
    applyBanterLive(empty, ['ai', 'banter'], { Bully: { won: 'Hi' } })
    expect(empty).toEqual({ ai: { banter: { Bully: { won: 'Hi' } } } })
  })
  it('applyBanterLive and withBanter only ever touch the lines: a "_help" note or a non-text entry in the file stays (review fix)', () => {
    const file = () => ({ title: 'Game', banter: { _help: 'Bots\' lines.', Bully: { won: 'Too easy.', _note: { keep: true }, moods: ['a'] }, Gone: { won: 'x' } } })
    const game: Record<string, unknown> = file()
    applyBanterLive(game, ['banter'], { Bully: { won: 'Next!' } })
    expect(game.banter).toEqual({ _help: 'Bots\' lines.', Bully: { won: 'Next!', _note: { keep: true }, moods: ['a'] } })
    const original = file()
    const saved = withBanter(original, ['banter'], { Bully: { lost: 'Rigged.' } })
    expect(saved).toEqual({ title: 'Game', banter: { _help: 'Bots\' lines.', Bully: { lost: 'Rigged.', _note: { keep: true }, moods: ['a'] } } })
    expect(original).toEqual(file()) // (the original is untouched)
    expect(withBanter({}, ['ai', 'banter'], { Bully: { won: 'Hi' } })).toEqual({ ai: { banter: { Bully: { won: 'Hi' } } } })
  })
  it('lists changes for Copy for Claude, and the banter section is searchable by moment', () => {
    expect(banterChanges({ Bully: { won: 'A', lost: 'B' } }, { Bully: { won: 'C', gotHit: 'D' } })).toEqual([
      'banter.Bully.won: "A" → "C"', 'banter.Bully.lost: "B" → (removed)', 'banter.Bully.gotHit: (new) → "D"',
    ])
    const ai = sampleAi({ banter: { path: 'content/text/en.json', data: {}, moments: ['won', 'gotHit'], describe: { won: 'the game ended and it won' } } })
    const section = aiSections(ai).find((s) => s.title === BANTER_SECTION)!
    expect(section.items.map((i) => i.label)).toEqual(['Banter: what it says at each moment', 'won — the game ended and it won', 'gotHit'])
    expect(searchAi(aiSections(ai), 'ended').map((s) => s.title)).toEqual([BANTER_SECTION])
  })
})

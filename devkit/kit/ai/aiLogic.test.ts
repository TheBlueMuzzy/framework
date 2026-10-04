// Runs in the framework (not copied into games): the AI tab's thinking.
import { describe, expect, it } from 'vitest'
import { aiSections, copyPersonality, freeId, getAt, labelOf, listChanges, moveGoal, searchAi, setAt, withList, withRange } from './aiLogic'
import { sampleAi, bully } from './sampleAi.test'

describe('AI tab logic', () => {
  it('a range keeps inside 0–100 and the moved end pushes the other', () => {
    expect(withRange(bully(), 'greed', -5, 120, 'min').traits.greed).toEqual({ min: 0, max: 100 })
    expect(withRange(bully(), 'greed', 70, 50, 'min').traits.greed).toEqual({ min: 70, max: 70 })
    expect(withRange(bully(), 'greed', 70, 50, 'max').traits.greed).toEqual({ min: 50, max: 50 })
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
    expect(sections.map((s) => s.title)).toEqual(['AI: who it is', 'AI: traits', 'AI: banter, nerve & words', 'AI: personality — more', 'AI: bio', 'AI: skill', 'AI: watch a game', 'AI: Personality Check'])
    const nerve = searchAi(sections, 'nerve')
    expect(nerve.map((s) => s.title)).toEqual(['AI: banter, nerve & words'])
    expect(searchAi(sections, 'trap')[0].items.map((i) => i.key)).toEqual(['traits.aggression'])
    expect(searchAi(sections, 'wobble').map((s) => s.title)).toEqual(['AI: skill'])
  })
})

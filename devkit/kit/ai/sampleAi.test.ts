// Test data for the AI tab's tests (framework only — named .test. so the installer never copies it into a game;
// it has one small test of its own at the bottom, so vitest is happy when it runs it).
// A small game with two personalities and two skills, shaped like Glyphtender's content/ai/ files.
import { expect, it } from 'vitest'
import type { AiPersonality, AiTuneResult, DevKitAi } from './aiTypes'

/** A tuner result for the Bully (the AI kit's shape, 0.26.0): aggression 80–95 → 60–75, steady.SCORE 0.6 → 0.3. */
export function bullySuggestion(over: Partial<AiTuneResult> = {}): AiTuneResult {
  const suggested = { ...bully(), traits: { ...bully().traits, aggression: { min: 60, max: 75 } }, steady: { SCORE: 0.3 }, nudge: 0.9 }
  return {
    personality: 'Bully', verdict: 'better', message: 'Suggested: 1 → 2 of 2 targets green on 24 fresh games.', suggested,
    sliders: [
      { path: 'traits.aggression', from: '80–95', to: '60–75', changed: true },
      { path: 'traits.greed', from: '30–50', to: '30–50', changed: false },
      { path: 'nudge', from: '0.2', to: '0.9', changed: false }, // (not changed: never applied, whatever suggested says)
      { path: 'steady.SCORE', from: '0.6', to: '0.3', changed: true },
    ],
    targets: [{ label: 'hems rivals in', meter: 'tangles', wants: '≥ 0.6', before: { measured: 0.4, pass: false }, after: { measured: 0.7, pass: true } }],
    cantReach: [], others: [], tries: 9, games: 156, seconds: 3.2, settings: { tuneFreshGames: 24 }, ...over,
  }
}

export const bully = (): AiPersonality => ({
  id: 'Bully',
  traits: { aggression: { min: 80, max: 95 }, greed: { min: 30, max: 50 } },
  goals: ['TRAP', 'SCORE'],
  nudge: 0.2,
  focus: 0.8,
  steady: { SCORE: 0.6 },
  shifts: [{ reading: 'myDanger', from: 5, full: 10, trait: 'greed', by: 20 }],
  chattiness: 70,
  extras: { nerve: 6 },
})

const scholar = (): AiPersonality => ({ ...bully(), id: 'Scholar', goals: ['SCORE', 'TRAP'], traits: { aggression: { min: 10, max: 20 }, greed: { min: 80, max: 95 } } })

export function sampleAi(extra: Partial<DevKitAi> = {}): DevKitAi {
  return {
    personalities: {
      path: 'content/ai/personalities.json',
      listKey: 'personalities',
      data: {
        _help: { 'traits.aggression': 'TRAP — hem rivals in.', 'extras.nerve': 'How far ahead before it calls it.', 'steady.SCORE': 'Always tries to score a bit.' },
        _labels: { 'traits.aggression': 'Aggression → TRAP', 'extras.nerve': 'Calls it when this far ahead', 'steady.SCORE': 'Always tries to score too' },
        _sections: { 'AI: who it is': ['id', 'goals', 'nudge', 'focus', 'steady'], 'AI: traits': ['traits'], 'AI: banter, nerve & words': ['chattiness', 'extras'] },
        personalities: [bully(), scholar()],
      },
    },
    skills: {
      path: 'content/ai/skills.json',
      listKey: 'skills',
      data: {
        _sections: { 'AI: skill': ['id', 'candidates', 'wobble', 'beliefNoise'] },
        skills: [
          { id: 'Apprentice', candidates: 150, wobble: 0.3, beliefNoise: 0.6 },
          { id: 'Archmage', candidates: 800, wobble: 0, beliefNoise: 0.1 },
        ],
      },
    },
    bios: {
      path: 'content/text/en.json',
      data: { ai: { personality: { Bully: { name: 'the Bully', bio: 'Loves a chase.' }, Scholar: { name: 'the Scholar', bio: 'Long words.' } } } },
      at: (id) => ['ai', 'personality', id, 'bio'],
      nameAt: (id) => ['ai', 'personality', id, 'name'],
      nameFor: (id) => `the ${id}`,
    },
    // The game's goal settings: each goal's big-moment bar (like Glyphtender's content/ai/goals.json)
    settings: [
      {
        path: 'content/ai/goals.json',
        data: {
          _help: { _file: 'Each goal\'s big-moment bar.', 'bigAt.TRAP': 'Hunting: 55 ≈ a tangle.' },
          _labels: { 'bigAt.TRAP': 'Big moment: hunt (TRAP)' },
          _sections: { 'AI: big moments': ['bigAt'] },
          _ranges: { 'bigAt.TRAP': [0, 100, 1] },
          bigAt: { TRAP: 55, SCORE: 17 },
        },
      },
    ],
    validate: (p) => (p.traits.greed.min > 90 ? [`${p.id}: greed starts too high (test rule)`] : []),
    watch: () => () => {},
    runCheck: async () => '<p>report</p>',
    ...extra,
  }
}

// (the one test here: the sample itself is sound)
it('sample AI data has two personalities', () => expect(sampleAi().personalities.data.personalities).toHaveLength(2))

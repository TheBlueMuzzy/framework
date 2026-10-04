// Test data for the AI tab's tests (framework only — named .test. so the installer never copies it into a game;
// it has one small test of its own at the bottom, so vitest is happy when it runs it).
// A small game with two personalities and two skills, shaped like Glyphtender's content/ai/ files.
import { expect, it } from 'vitest'
import type { AiPersonality, DevKitAi } from './aiTypes'

export const bully = (): AiPersonality => ({
  id: 'Bully',
  traits: { aggression: { min: 80, max: 95 }, greed: { min: 30, max: 50 } },
  goals: ['TRAP', 'SCORE'],
  nudge: 0.2,
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
        _help: { 'traits.aggression': 'TRAP — hem rivals in.', 'extras.nerve': 'How far ahead before it calls it.' },
        _labels: { 'traits.aggression': 'Aggression → TRAP', 'extras.nerve': 'Calls it when this far ahead' },
        _sections: { 'AI: who it is': ['id', 'goals', 'nudge'], 'AI: traits': ['traits'], 'AI: banter, nerve & words': ['chattiness', 'extras'] },
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
    },
    validate: (p) => (p.traits.greed.min > 90 ? [`${p.id}: greed starts too high (test rule)`] : []),
    watch: () => () => {},
    runCheck: async () => '<p>report</p>',
    ...extra,
  }
}

// (the one test here: the sample itself is sound)
it('sample AI data has two personalities', () => expect(sampleAi().personalities.data.personalities).toHaveLength(2))

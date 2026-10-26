// THE COMPUTER OPPONENTS — a personality + a skill (content/ai/) on the AI brain, through the plug (./plug.ts).
// Pure: the same code plays on the phone, in the tests and on the online server (party/rules.ts).
import personalitiesFile from '../../content/ai/personalities.json'
import skillsFile from '../../content/ai/skills.json'
import opponentsFile from '../../content/ai/opponents.json'
import { makeBrain } from './kit/brain'
import type { Personality, Skill } from './kit/types'
import { plug } from './plug'
import type { Action, View } from '../game/rules'

export interface Opponent {
  personality: string
  skill: string
}

export const opponents = (): Opponent[] => opponentsFile.opponents
export const onlineOpponent = (): Opponent => opponentsFile.online

export const personalityOf = (id: string): Personality => {
  const found = (personalitiesFile.personalities as Personality[]).find((p) => p.id === id)
  if (!found) throw new Error(`No personality "${id}" in content/ai/personalities.json`)
  return found
}

const skillOf = (id: string): Skill => {
  const found = (skillsFile.skills as Skill[]).find((s) => s.id === id)
  if (!found) throw new Error(`No skill "${id}" in content/ai/skills.json`)
  return found
}

/** One move for this opponent: the brain is made fresh each time, so an edit in the Dev Kit's AI tab counts at once. */
export function botMove(opponent: Opponent, view: View, seat: number, rng: number): { action: Action; rng: number; note: string } {
  const brain = makeBrain(plug, personalityOf(opponent.personality), skillOf(opponent.skill))
  const { action, rng: next, decision } = brain.decide(view, seat, rng)
  return { action, rng: next, note: decision.note }
}

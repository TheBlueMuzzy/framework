// EVERYTHING THE GAME REMEMBERS — every save goes through the saves module (src/saves), never localStorage itself.
// Each save's key starts with the game's name. A default change that should reach old saves = a new version + an
// upgrade step (never just a new `fresh`), and a golden copy per version in tests/saves/ (tests/saves/saves.test.ts).
import { createRun, createSave } from '../saves'
import { EMOTE_SAVE } from '../emotes'
import { BANTER_SAVE } from '../ai/kit/save'
import text from '../../content/text/en.json'
import { fill, type SettingsValues } from '../ui/kit'
import { personalityName } from '../ui/names'
import type { Opponent } from '../ai/bots'
import type { MoveRecord } from '../table/core'
import type { Action, Setup } from './rules'

/** The player's Settings (the UI kit's Settings screen loads and saves through this). Missing rows = their defaults. */
export const settingsSave = createSave<SettingsValues>({
  key: 'turn-based-starter:settings',
  kind: 'settings',
  version: 1,
  fresh: {},
})

/** Games played against each opponent, for the results screen. Two devices' counts add up. */
export interface Progress {
  wins: number
  losses: number
  draws: number
}
export const progressSave = createSave<Progress>({
  key: 'turn-based-starter:progress',
  kind: 'progress',
  version: 1,
  fresh: { wins: 0, losses: 0, draws: 0 },
  fields: { wins: 'add-up', losses: 'add-up', draws: 'add-up' },
})

/** A game against the computer in progress: Continue on the main menu brings it back (rebuilt from its moves). */
export interface MatchRun {
  opponent: Opponent
  record: MoveRecord<Setup, Action>
}
export const matchRun = createRun<MatchRun>({
  key: 'turn-based-starter:run',
  version: 1,
  fresh: { opponent: { personality: 'careful', skill: 'sharp' }, record: { setup: { firstSeat: 0 }, moves: [] } },
  // Continue's second line: "Move 4 vs Careless Cass"
  summary: (run) => fill(text.mainMenu.continueLine, { n: run.record.moves.length + 1, name: personalityName(run.opponent.personality) }),
})

/** The emotes module's: the "Hide everyone's emotes" switch + this match's mutes. */
export const emoteSave = createSave({ ...EMOTE_SAVE, key: 'turn-based-starter:emotes', version: 1 })

/** The AI module's: the "Bot chatter" level. */
export const banterSave = createSave({ ...BANTER_SAVE, key: 'turn-based-starter:banter', version: 1 })

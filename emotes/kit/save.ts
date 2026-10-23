// WHAT IS KEPT — the "Hide everyone's emotes" switch and the mutes of the match being played, through the saves
// module, like every save (a reload or a Rejoin keeps them; a new match starts clean, like Hearthstone and LoR).
// No import of the saves module here, so a game without it still builds: the game makes the save itself, in its own
// code (so check:framework's Saves part sees it and asks for its golden save):
//   import { createSave } from './saves'
//   import { EMOTE_SAVE } from './emotes'
//   const emoteSave = createSave({ ...EMOTE_SAVE, key: 'mygame:emotes', version: 1 })   // version = EMOTE_SAVE.version
//   const emotes = createEmotes({ settings: emotesJson, words: text.emotes, save: emoteSave, mine: ['seat-1'] })
// Golden save: tests/saves/mygame_emotes-v1.json (the installer writes it once) and list emoteSave in tests/saves/saves.test.ts.

export interface EmoteSaveData {
  /** The Settings switch: everyone's emotes but your own are hidden. */
  hideAll: boolean
  /** Which match the mutes belong to ('' = a local game). */
  match: string
  /** The seats this player muted in that match. */
  seats: string[]
}

/** The smallest part of a saves-module save the emotes module uses (createSave gives all of it). */
export interface EmoteSaveLike {
  load(): EmoteSaveData
  save(data: EmoteSaveData): unknown
  /** null = nothing saved yet (a new player: the switch starts at content/emotes.json mutedByDefault). */
  peek?(): unknown
  readonly version?: number
}

const MAX_MUTES = 16 // more seats than any table has

/** The save's options for createSave, all but its key. Bump `version` (and add an upgrade) when the shape changes. */
export const EMOTE_SAVE = {
  kind: 'settings' as const,
  version: 1,
  fresh: { hideAll: false, match: '', seats: [] } as EmoteSaveData,
  /** A value out of shape → the fresh one (a hand-edited or damaged save never breaks the game). */
  clean: (data: EmoteSaveData): EmoteSaveData => ({
    hideAll: data.hideAll === true,
    match: typeof data.match === 'string' ? data.match.slice(0, 64) : '',
    seats: Array.isArray(data.seats) ? [...new Set(data.seats.filter((s): s is string => typeof s === 'string' && s.length > 0 && s.length <= 64))].slice(0, MAX_MUTES) : [],
  }),
}

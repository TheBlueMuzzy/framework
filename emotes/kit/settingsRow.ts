// THE SETTINGS ROW — "Hide everyone's emotes" for the UI kit's Settings (content/ui/settings.json). The UI kit draws it
// (a heading + a plain toggle), so this part needs nothing from the UI kit.
// Paste EMOTE_SETTINGS_ROWS into a tab's "rows" (Game or Sound), then:
//   applyEmoteSetting(emotes, loadSettings(settingsJson))                     // at start-up (UI kit's loadSettings)
//   <Settings schema={settingsJson} onChange={(values) => applyEmoteSetting(emotes, values)} … />   // when it's flipped
// The row's starting value is content/emotes.json "mutedByDefault" (emoteSettingsRows(config) writes it in).
import type { EmotesConfig } from './config'
import type { Emotes } from './emotes'

export const EMOTE_SETTING = 'hideEmotes'

export const EMOTE_SETTINGS_ROWS = [
  { id: 'secEmotes', type: 'heading', label: 'Emotes' },
  {
    id: EMOTE_SETTING, type: 'toggle', label: 'Hide everyone\'s emotes', default: false,
    detail: 'Opponents\' phrases and bot chatter won\'t show.',
  },
] as const

/** The rows with the switch starting at the game's mutedByDefault. */
export function emoteSettingsRows(config: Pick<EmotesConfig, 'mutedByDefault'>) {
  return EMOTE_SETTINGS_ROWS.map((row) => (row.id === EMOTE_SETTING ? { ...row, default: config.mutedByDefault } : row))
}

/** The Settings values → the module. A missing value leaves the switch as it is (the saved choice). */
export function applyEmoteSetting(emotes: Pick<Emotes, 'setHideAll'>, values: Record<string, unknown>) {
  if (typeof values[EMOTE_SETTING] === 'boolean') emotes.setHideAll(values[EMOTE_SETTING] as boolean)
}

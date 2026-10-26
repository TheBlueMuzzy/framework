// THE PLAYER'S SETTINGS — rows from content/ui/settings.json (the UI kit's Settings screen draws them), kept with the
// saves module (settingsSave). applySettings passes every row on to the module or code that reads it — at start-up
// and every time the player changes one. A row that's switched on must be read somewhere (check:framework checks it).
import settingsJson from '../../content/ui/settings.json'
import { applyAccessibility, defaultValues, type SettingsSchema, type SettingsValues } from '../ui/kit'
import { applyAudioSettings, getAudio } from '../audio'
import { applyCrashSetting } from '../crashes'
import { applyEmoteSetting } from '../emotes'
import { applyBanterSetting } from '../ai/kit/settingsRow'
import { banter, emotes } from './table'
import { settingsSave } from './saves'

export const settingsSchema = settingsJson as SettingsSchema

/** The player's settings right now: their saved choices on top of every row's default. */
export const currentSettings = (): SettingsValues => ({ ...defaultValues(settingsSchema), ...settingsSave.load() })

/** Bot speed (Settings → Gameplay): Slow · Normal · Fast · Instant — the bots read it before every move. */
export const botSpeed = (): string => String(currentSettings().botSpeed)

export function applySettings(values: SettingsValues) {
  applyAccessibility(values) // text size + reduce motion (the UI kit)
  const audio = getAudio()
  if (audio) applyAudioSettings(audio, values) // the Audio tab
  applyCrashSetting(values) // "Send crash reports"
  applyEmoteSetting(emotes, values) // "Hide everyone's emotes"
  applyBanterSetting(banter, values) // "Bot chatter"
}

// THE PLAYER'S SETTINGS — rows from content/ui/settings.json (the UI kit's Settings screen draws them), kept with the
// saves module (settingsSave). applySettings passes every row on to the module or code that reads it — at start-up
// and every time the player changes one. A row that's switched on must be read somewhere (check:framework checks it).
import settingsJson from '../../content/ui/settings.json'
import { applyAccessibility, defaultValues, liveSetting, withFullscreenDefault, type SettingsSchema, type SettingsValues } from '../ui/kit'
import { applyAudioSettings, getAudio } from '../audio'
import { applyCrashSetting } from '../crashes'
import { settingsSave } from './saves'

// Gameplay → Full screen starts on for phones, off for computers (the UI kit's Settings goes in and out itself; a phone
// goes full screen on its first tap — startFullscreen in main.tsx)
export const settingsSchema = withFullscreenDefault(settingsJson as SettingsSchema)

/** The player's settings right now: their saved choices on top of every row's default. */
export const currentSettings = (): SettingsValues => ({ ...defaultValues(settingsSchema), ...settingsSave.load() })

/** Bot speed (Settings → Gameplay): Slow · Normal · Fast · Instant — the bots read botSpeed.get() before every move.
 *  A live setting (UI kit 0.42.0): it follows the Settings screen the moment the row changes, and starts from the save. */
export const botSpeed = liveSetting(settingsSchema, (values) => String(values.botSpeed), { load: () => settingsSave.load() })

export function applySettings(values: SettingsValues) {
  applyAccessibility(values) // text size + reduce motion (the UI kit)
  const audio = getAudio()
  if (audio) applyAudioSettings(audio, values) // the Audio tab
  applyCrashSetting(values) // "Send crash reports"
}

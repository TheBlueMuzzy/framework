// THE EMOTES MODULE — import from 'src/emotes'. README: framework/emotes/README.md
export { createEmotes, type Emotes, type EmotesOptions, type EmoteMessage, type SendResult } from './emotes'
export { createBucket, type Bucket, type BucketLimits } from './bucket'
export { readEmotesConfig, looserServer, DEFAULT_EMOTES_CONFIG, PHRASE_ID, BANTER_ID, MAX_PHRASES, type EmotesConfig, type EmoteLimits, type EmoteServerLimits } from './config'
export { EMOTE_SAVE, type EmoteSaveData, type EmoteSaveLike } from './save'
export { EMOTE_SETTING, EMOTE_SETTINGS_ROWS, emoteSettingsRows, applyEmoteSetting } from './settingsRow'
// The bubbles, the picker and the mute menu are in ./ui/EmoteLayer (only in games with the UI kit — import them from there).

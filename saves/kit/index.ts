// THE SAVES MODULE — import from 'src/saves'. README: framework/saves/README.md
export { createSave, backupKey, damagedKey, NOTES, type Save, type SlotSaves, type SaveKind, type SaveOptions, type SaveRecord, type SaveResult, type SavePeek, type LoadReport, type Upgrade } from './saves'
export { createRun, continueLine, timeAgo, RUN_WORDS, type Run, type RunOptions, type PendingRun, type ResumeResult } from './run'
export { recordRun, addRunMove, replayRun, sameResult, dailySeed, utcDay, REPLAY_WORDS, type RunRecord, type RunMove, type MoveBy, type ReplayRules, type ReplayResult } from './replay'
export { mergeRecords, deviceId, FIELD_RULES, EARLIER, type FieldRule, type FieldRules } from './progress'
export { fillMissing, copyData } from './fill'
export { browserStorage, memoryStorage, isFullError, type StorageLike, type MemoryStorage } from './storage'
export { makeSaveCode, readSaveCode, saveFileName, downloadSaveFile, readSaveFile, copyText, gameLabel, CODE_WORDS, SAVE_CODE_FORMAT, type CodeResult } from './saveCode'
export { makeLinkCode, loadLinkCode, deleteLinkCode, linkCodeHere, cloudAddress, CLOUD_WORDS, CLOUD_PORT, type CloudOptions, type LinkResult } from './cloud'
export { handleCloud, memoryCloudRows, readLinkCode, showLinkCode, newLinkCode, LINK_ALPHABET, type CloudRows, type CloudContext } from './cloudRoutes'
export { checkSaveHealth, askToKeepSaves, healthLine, browserEnv, HEALTH_WORDS, type SaveHealth, type SaveWarning, type WarningId, type HealthEnv } from './health'
export { createBackupNudge, NUDGE_WORDS, type BackupNudge } from './nudge'
export { SAVE_SETTINGS_ROWS, SAVE_CODE_ROW, SAVE_HEALTH_ROW } from './settingsRow'
// The Settings → "Save code" screen is in ./ui/SaveCodePanel, and the main menu's Continue in ./ui/useContinue
// (only in games with the UI kit — import them from there).
export { setSavesConfig, savesConfig, readSavesConfig, DEFAULT_SAVES_CONFIG, type SavesConfig, type NudgeConfig, type CloudConfig } from './config'

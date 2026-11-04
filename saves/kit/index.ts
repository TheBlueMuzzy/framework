// THE SAVES MODULE — import from 'src/saves'. README: framework/saves/README.md
export { createSave, backupKey, damagedKey, NOTES, type Save, type SlotSaves, type SaveKind, type SaveOptions, type SaveRecord, type SaveResult, type SavePeek, type LoadReport, type Upgrade } from './saves'
export { createRun, continueLine, timeAgo, RUN_WORDS, type Run, type RunOptions, type PendingRun, type ResumeResult } from './run'
export { mergeRecords, deviceId, FIELD_RULES, EARLIER, type FieldRule, type FieldRules } from './progress'
export { fillMissing, copyData } from './fill'
export { browserStorage, memoryStorage, isFullError, setSavesStorage, savesStorage, savesOnNativeStorage, switchedStorage, type StorageLike, type MemoryStorage } from './storage'
// The main menu's Continue is in ./ui/useContinue (only in games with the UI kit — import it from there).
export { setSavesConfig, savesConfig, readSavesConfig, DEFAULT_SAVES_CONFIG, type SavesConfig } from './config'

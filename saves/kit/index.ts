// THE SAVES MODULE — import from 'src/saves'. README: framework/saves/README.md
export { createSave, backupKey, damagedKey, NOTES, type Save, type SlotSaves, type SaveKind, type SaveOptions, type SaveRecord, type SaveResult, type LoadReport, type Upgrade } from './saves'
export { mergeRecords, deviceId, FIELD_RULES, EARLIER, type FieldRule, type FieldRules } from './progress'
export { fillMissing, copyData } from './fill'
export { browserStorage, memoryStorage, isFullError, type StorageLike, type MemoryStorage } from './storage'
export { setSavesConfig, savesConfig, readSavesConfig, DEFAULT_SAVES_CONFIG, type SavesConfig, type NudgeConfig } from './config'

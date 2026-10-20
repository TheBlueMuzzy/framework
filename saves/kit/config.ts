// CONTENT/SAVES.JSON — the few knobs a designer tunes: how many backup copies, when to nudge "back up your save",
// and which lines of game code may still use the browser's storage directly (checked by check:framework).
// A bad value never crashes the game: it gives ONE console warning and the default is used instead.

export interface NudgeConfig {
  /** Progress points (the game decides what one is: a finished game, a level, an unlock) since the last save code
   *  before the "back up your save" nudge shows. 0 = never nudge. */
  afterProgress: number
  /** At least this many days between two nudges. */
  minDaysBetween: number
  /** true = only nudge when the browser might wipe saves (Safari, a private window, the itch.io frame…). */
  onlyWhenAtRisk: boolean
}

export interface SavesConfig {
  /** Older copies kept beside each save (0–5). A broken save falls back to the newest good one. */
  backups: number
  nudge: NudgeConfig
}

export const DEFAULT_SAVES_CONFIG: SavesConfig = {
  backups: 2,
  nudge: { afterProgress: 10, minDaysBetween: 7, onlyWhenAtRisk: false },
}

const inRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

/** Any JSON (content/saves.json) → a complete config. Odd values → the default, with one warning each. */
export function readSavesConfig(json: unknown, warn: (message: string) => void = console.warn): SavesConfig {
  const file = (json && typeof json === 'object' ? json : {}) as { backups?: unknown; nudge?: Record<string, unknown> }
  const nudge = file.nudge && typeof file.nudge === 'object' ? file.nudge : {}
  const pick = <T>(name: string, value: unknown, ok: (v: unknown) => v is T, fallback: T): T => {
    if (value === undefined) return fallback
    if (ok(value)) return value
    warn(`content/saves.json: "${name}" is ${JSON.stringify(value)} — using ${JSON.stringify(fallback)} instead.`)
    return fallback
  }
  const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
  return {
    backups: Math.round(pick('backups', file.backups, (v): v is number => inRange(v, 0, 5), DEFAULT_SAVES_CONFIG.backups)),
    nudge: {
      afterProgress: pick('nudge.afterProgress', nudge.afterProgress, (v): v is number => inRange(v, 0, 100000), DEFAULT_SAVES_CONFIG.nudge.afterProgress),
      minDaysBetween: pick('nudge.minDaysBetween', nudge.minDaysBetween, (v): v is number => inRange(v, 0, 365), DEFAULT_SAVES_CONFIG.nudge.minDaysBetween),
      onlyWhenAtRisk: pick('nudge.onlyWhenAtRisk', nudge.onlyWhenAtRisk, isBool, DEFAULT_SAVES_CONFIG.nudge.onlyWhenAtRisk),
    },
  }
}

// The game's config, set once at start-up (setSavesConfig(savesJson)). Until then, the defaults.
let current: SavesConfig = DEFAULT_SAVES_CONFIG

/** Once at start-up: `setSavesConfig(savesJson)` (import savesJson from '../content/saves.json'). */
export function setSavesConfig(json: unknown): SavesConfig {
  current = readSavesConfig(json)
  return current
}

export const savesConfig = (): SavesConfig => current

// CONTENT/SAVES.JSON — the few knobs a designer tunes: how many backup copies, and which lines of game code may still
// use the browser's storage directly (checked by check:framework). (0.8.0, F186: the "back up your save" nudge, the
// link-code cloud and the leaderboard were archived with their settings — git tag archive/saves-0.7.0. An older
// content/saves.json that still has "nudge" / "cloud" / "board" loads fine: they're ignored.)
// A bad value never crashes the game: it gives ONE console warning and the default is used instead.

export interface SavesConfig {
  /** Older copies kept beside each save (0–5). A broken save falls back to the newest good one. */
  backups: number
}

export const DEFAULT_SAVES_CONFIG: SavesConfig = {
  backups: 2,
}

const inRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

/** Any JSON (content/saves.json) → a complete config. Odd values → the default, with one warning each. */
export function readSavesConfig(json: unknown, warn: (message: string) => void = console.warn): SavesConfig {
  const file = (json && typeof json === 'object' ? json : {}) as { backups?: unknown }
  const pick = <T>(name: string, value: unknown, ok: (v: unknown) => v is T, fallback: T): T => {
    if (value === undefined) return fallback
    if (ok(value)) return value
    warn(`content/saves.json: "${name}" is ${JSON.stringify(value)} — using ${JSON.stringify(fallback)} instead.`)
    return fallback
  }
  return {
    backups: Math.round(pick('backups', file.backups, (v): v is number => inRange(v, 0, 5), DEFAULT_SAVES_CONFIG.backups)),
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

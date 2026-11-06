// A LIVE SETTING (0.42.0, F191) — one of the game's own Settings rows, read by the game and followed the moment the
// Settings screen changes it (no onChange wiring). One line per setting:
//   export const gooStyle = liveSetting(settingsJson, (v) => (v.gooStyle === 'Particle' ? 'particle' : 'jelly'))
//   gooStyle.get()               — the value right now (game code, every frame if it likes)
//   useLiveSetting(gooStyle)     — the same in a component: it redraws when the value changes
//   gooStyle.subscribe(fn)       — be told when it changes (returns "stop telling me")
// The mapper gets every row's value (saved, or the row's default) and returns what the game needs — a word, a number,
// or an object built from several rows. It starts from the kit's settings storage, so the value survives a reload;
// a game that saves its settings itself passes the same load it gives <Settings>: liveSetting(json, map, { load }).
import { useSyncExternalStore } from 'react'
import { loadSettings, onSettingsChange, settingsStorageKey, type SettingsSchema, type SettingsValues } from './Settings'

export type LiveSetting<T> = { get: () => T; subscribe: (listener: () => void) => () => void }
type Where = { storageKey?: string; load?: () => SettingsValues | null }

export function liveSetting<T>(schema: SettingsSchema, map: (values: SettingsValues) => T, where: Where = {}): LiveSetting<T> {
  let current = map(loadSettings(schema, where.storageKey ?? settingsStorageKey(), where.load))
  const listeners = new Set<() => void>()
  onSettingsChange((values) => {
    const next = map(values)
    if (same(next, current)) return // keep the SAME value, so React doesn't redraw for nothing
    current = next
    listeners.forEach((listener) => listener())
  })
  return {
    get: () => current,
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

/** A component that shows a live setting: redraws when (and only when) the value changes. */
export function useLiveSetting<T>(setting: LiveSetting<T>): T {
  return useSyncExternalStore(setting.subscribe, setting.get, setting.get)
}

// The same value: equal words/numbers, or two objects whose every field is equal (a mapper that builds an object
// builds a new one each time).
function same(a: unknown, b: unknown) {
  if (Object.is(a, b)) return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
  const [fieldsA, fieldsB] = [a as Record<string, unknown>, b as Record<string, unknown>]
  const keys = Object.keys(fieldsA)
  return keys.length === Object.keys(fieldsB).length && keys.every((key) => Object.is(fieldsA[key], fieldsB[key]))
}

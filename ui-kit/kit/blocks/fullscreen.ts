// FULL SCREEN ON PHONES (F192 — from Glyphtender's src/ui/fullscreen.ts, Muzzy 2026-10-03: "I send these links out to
// test with friends… I want them to experience the game as it is meant to be experienced").
// Switched per game by its Settings row: content/ui/settings.json Display → "fullscreen" (a toggle) — and, for iPhone,
// "fullscreenTip" (an info row: "Share → Add to Home Screen"). No row (or "on": false) = the game never goes full screen.
// A browser only goes full screen from a tap or a click, never by itself as the page opens. So:
//   phones & tablets (touch): with the row on (the default there — withFullscreenDefault), the first tap goes full
//     screen, and so does the next tap after leaving it (the phone's back gesture). Turn it off to stay in the browser.
//   computers: never by themselves — only the Settings toggle (or a game's own button: setFullscreen). Esc leaves,
//     which turns the setting off, so Settings never says "on" in a window.
//   iPhone: Safari can't make a page full screen; "Add to Home Screen" opens it like an app, with no browser bars.
//     Settings shows that tip instead of the toggle (hiddenFullscreenRows).
//   installed (opened from the home screen): already without browser bars — both rows are hidden.
// Once full screen, a game with content/ui/style.json "orientation" asks the phone to hold that way (Android Chrome
// does; elsewhere the browser says no and the "turn your phone" card covers it — UprightCard).
// Wiring (the turn-based starter):
//   settingsSchema = withFullscreenDefault(settingsJson)                    on for phones, off for computers
//   startFullscreen({ load: currentSettings, save: settingsSave.save })     once, at start-up
// The Settings screen does the rest itself: flipping the row is a tap, so it goes in / comes out at once.
import { useSyncExternalStore } from 'react'
import { gameOrientation } from '../orientation'
import { settingsStorageKey, type SettingsSchema, type SettingsValues } from './Settings'

type FsDocument = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> }
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
const doc = () => document as FsDocument
const media = (query: string) => typeof matchMedia === 'function' && matchMedia(query).matches

const fullscreenNow = () => typeof document !== 'undefined' && Boolean(doc().fullscreenElement || doc().webkitFullscreenElement)

/** This browser can make the page full screen (false on iPhone Safari). */
export const canFullscreen = () => typeof document !== 'undefined' && Boolean(doc().fullscreenEnabled || doc().webkitFullscreenEnabled)

/** Opened from the home screen (installed): there are no browser bars to hide. (A page made full screen ALSO matches
 *  display-mode: fullscreen in Chrome, so that one only counts when the page itself isn't full screen.) */
export const isInstalled = () => media('(display-mode: standalone)') || (media('(display-mode: fullscreen)') && !fullscreenNow())
  || (typeof navigator !== 'undefined' && (navigator as Navigator & { standalone?: boolean }).standalone === true)

/** A phone or tablet: touch, no mouse. */
export const isTouchDevice = () => media('(pointer: coarse)') && !media('(any-pointer: fine)')

// Is the page full screen right now (a game's own Full screen button can follow it), and how many times the setting was
// saved from here (a computer's Esc) — an open Settings re-reads its values then, so it never saves an old "on" back.
let state = { on: fullscreenNow(), resaved: 0 }
const listeners = new Set<() => void>()
function setState(next: Partial<typeof state>) {
  state = { ...state, ...next }
  for (const listener of listeners) listener()
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
/** { on, resaved } — on: the page is full screen now. */
export const useFullscreen = () => useSyncExternalStore(subscribe, () => state, () => state)

export function enterFullscreen() {
  if (fullscreenNow() || !canFullscreen()) return
  const root = document.documentElement as FsElement
  const go = root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen?.()
  go?.then(holdTheGameWay).catch(() => { /* the browser said no (not from a tap): the next tap tries again */ })
}

export function exitFullscreen() {
  if (!fullscreenNow()) return
  const go = document.exitFullscreen ? document.exitFullscreen() : doc().webkitExitFullscreen?.()
  go?.catch(() => {})
}

// A portrait (or landscape) game, once full screen: ask the phone to hold the screen that way. Android Chrome does;
// iPhone, plain browser tabs and desktops can't lock — there the "turn your phone" card tells the player instead.
type Lockable = ScreenOrientation & { lock?: (to: 'portrait' | 'landscape') => Promise<void> }
function holdTheGameWay() {
  const way = gameOrientation()
  if (way === 'any') return
  try {
    ;(screen.orientation as Lockable | undefined)?.lock?.(way)?.catch(() => { /* not allowed here: fine */ })
  } catch { /* (not allowed here) */ }
}

/** The settings list with the Full screen row's default for this device: on for phones & tablets, off for computers. */
export function withFullscreenDefault(schema: SettingsSchema): SettingsSchema {
  const touch = isTouchDevice()
  return { ...schema, tabs: schema.tabs.map((tab) => ({ ...tab, rows: tab.rows.map((row) => (row.id === 'fullscreen' ? { ...row, default: touch } : row)) })) }
}

/** Settings rows to hide on this device: the toggle where it can't work, the iPhone tip where it isn't needed.
 *  (The Settings screen hides them itself.) */
export function hiddenFullscreenRows(): string[] {
  if (isInstalled()) return ['fullscreen', 'fullscreenTip']
  return canFullscreen() ? ['fullscreenTip'] : ['fullscreen']
}

let wanted = false // Settings → Full screen
// The saved settings, as they are now, and how to save them (startFullscreen) — the kit's own browser slot by default
let load: () => SettingsValues = () => {
  try { return JSON.parse(localStorage.getItem(settingsStorageKey()) ?? '{}') ?? {} } catch { return {} }
}
let save: (values: SettingsValues) => void = (values) => {
  try { localStorage.setItem(settingsStorageKey(), JSON.stringify(values)) } catch { /* not remembered, still works */ }
}

/** Settings changed (or loaded): Full screen on → go now (this is a tap), off → leave. Other rows never touch it.
 *  (The Settings screen calls it on every change.) */
export function fullscreenSetting(values: SettingsValues, changed?: string) {
  wanted = values.fullscreen === true
  if (changed !== 'fullscreen') return
  if (wanted) enterFullscreen()
  else exitFullscreen()
}

/** A game's own Full screen button: the same as flipping the Settings toggle (saved, so Settings shows it too). */
export function setFullscreen(on: boolean) {
  const next = { ...load(), fullscreen: on }
  save(next)
  fullscreenSetting(next, 'fullscreen')
}

let stop = () => {}
/** Once, at start-up: follow the page going in and out of full screen, and on phones go full screen on a tap.
 *  load = the player's saved settings as they are now; save = how the game saves them (both: the kit's own browser
 *  slot when left out — pass the same ones as <Settings load save>). */
export function startFullscreen(options: { load?: () => SettingsValues; save?: (values: SettingsValues) => void } = {}) {
  stop()
  if (options.load) load = options.load
  if (options.save) save = options.save
  wanted = load().fullscreen === true
  const changed = () => {
    setState({ on: fullscreenNow() })
    // A computer's Esc leaves full screen: the setting follows, so Settings never says "on" in a window
    if (!fullscreenNow() && wanted && !isTouchDevice()) {
      wanted = false
      save({ ...load(), fullscreen: false })
      setState({ resaved: state.resaved + 1 })
    }
  }
  // (pointerup: a tap counts as permission to go full screen — capture, so it runs before the game handles the tap)
  const onTap = () => { if (wanted) enterFullscreen() }
  const tapsToo = isTouchDevice() && !isInstalled() && canFullscreen()
  document.addEventListener('fullscreenchange', changed)
  document.addEventListener('webkitfullscreenchange', changed)
  if (tapsToo) window.addEventListener('pointerup', onTap, { capture: true })
  stop = () => {
    document.removeEventListener('fullscreenchange', changed)
    document.removeEventListener('webkitfullscreenchange', changed)
    window.removeEventListener('pointerup', onTap, { capture: true })
    stop = () => {}
  }
}

/** Undo startFullscreen (tests; a game never needs it). */
export const stopFullscreen = () => stop()

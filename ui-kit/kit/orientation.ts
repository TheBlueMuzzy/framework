// THE GAME'S ORIENTATION (F192) — content/ui/style.json "orientation", remembered by applyStyle so the kit's
// phone pieces can read it: the "turn your phone" card (blocks/upright.tsx) and the screen lock once full screen
// (blocks/fullscreen.ts). "any" (or not set) = the game plays either way: no card, no lock.
// The same values the page check reads (conformance.mjs ORIENTATIONS).
export type Orientation = 'any' | 'portrait' | 'landscape'

let current: Orientation = 'any'

/** applyStyle calls this with style.json's value; a value the kit doesn't know counts as "any". */
export function setGameOrientation(value: unknown) {
  current = value === 'portrait' || value === 'landscape' ? value : 'any'
}

export const gameOrientation = (): Orientation => current

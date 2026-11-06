// SPOTLIGHT MATHS — the dim with holes (plain maths, no page needed; tested in spotlight.test.tsx).
// The component is in spotlight.tsx. From Goops' lesson spotlight (src/game/lessons/spotlightMath.ts, F32).
import type { CalloutBox } from './callout'

export const growBox = (b: CalloutBox, by: number): CalloutBox => ({ left: b.left - by, top: b.top - by, right: b.right + by, bottom: b.bottom + by })
/** The part of a box inside another (e.g. inside the window); null when nothing of it is inside. */
export function clipBox(b: CalloutBox, to: CalloutBox): CalloutBox | null {
  const out = { left: Math.max(b.left, to.left), top: Math.max(b.top, to.top), right: Math.min(b.right, to.right), bottom: Math.min(b.bottom, to.bottom) }
  return out.right > out.left && out.bottom > out.top ? out : null
}
/** One box round all of them (Spotlight outline "joined"). */
export const joinBoxes = (boxes: CalloutBox[]): CalloutBox | null => boxes.length ? boxes.reduce((a, b) => ({
  left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) })) : null
const inside = (x: number, y: number, b: CalloutBox) => x > b.left && x < b.right && y > b.top && y < b.bottom
const half = (n: number) => Math.round(n * 2) / 2

/** The rectangles of a w × h screen NOT covered by any of the boxes: cut along every box edge, so they never overlap
 *  each other, whatever the boxes do (two holes that overlap stay one hole — an even-odd path would dim the overlap again). */
export function outsideRects(boxes: CalloutBox[], w: number, h: number): CalloutBox[] {
  const clampX = (x: number) => Math.max(0, Math.min(w, x)), clampY = (y: number) => Math.max(0, Math.min(h, y))
  const xs = [...new Set([0, w, ...boxes.flatMap((b) => [clampX(b.left), clampX(b.right)])])].sort((a, b) => a - b)
  const ys = [...new Set([0, h, ...boxes.flatMap((b) => [clampY(b.top), clampY(b.bottom)])])].sort((a, b) => a - b)
  const out: CalloutBox[] = []
  for (let j = 0; j < ys.length - 1; j++) {
    const top = ys[j], bottom = ys[j + 1]
    let start: number | null = null
    for (let i = 0; i < xs.length - 1; i++) {
      const covered = boxes.some((b) => inside((xs[i] + xs[i + 1]) / 2, (top + bottom) / 2, b))
      if (!covered && start === null) start = xs[i]
      const last = i === xs.length - 2
      if ((covered || last) && start !== null) {
        const end = covered ? xs[i] : xs[i + 1]
        if (end > start && bottom > top) out.push({ left: start, top, right: end, bottom })
        start = null
      }
    }
  }
  return out
}

/** outsideRects as a CSS clip-path (it also shapes where taps land). Everything covered → nothing left. */
export function outsidePath(boxes: CalloutBox[], w: number, h: number): string {
  const parts = outsideRects(boxes, w, h).map((b) => `M${half(b.left)} ${half(b.top)}H${half(b.right)}V${half(b.bottom)}H${half(b.left)}Z`)
  return parts.length ? `path("${parts.join('')}")` : 'inset(50%)'
}

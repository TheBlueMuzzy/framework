// CALLOUT MATHS — where a Callout's bubble and pointer go (plain maths, no page needed), its types and words.
// The component itself is in teach.tsx.
export type CalloutPoint = { x: number; y: number }
/** A box on screen, in page px (left / top / right / bottom), e.g. from getBoundingClientRect(). */
export type CalloutBox = { left: number; top: number; right: number; bottom: number }
export type CalloutTarget = Element | string | CalloutPoint | CalloutBox | null | undefined
export type CalloutSide = 'top' | 'bottom' | 'left' | 'right'
export type CalloutPlacement = 'auto' | CalloutSide
type Box = CalloutBox
type Size = { width: number; height: number }
export type CalloutSpot = { side: CalloutSide; x: number; y: number; tipX: number; tipY: number }

const opposite: Record<CalloutSide, CalloutSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
const across: Record<CalloutSide, CalloutSide[]> = { top: ['right', 'left'], bottom: ['right', 'left'], left: ['top', 'bottom'], right: ['top', 'bottom'] }
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(value, Math.max(low, high)))

// WHERE THE BUBBLE GOES — plain maths, no page needed (tested in teach.test.tsx).
// target: the rectangle to point at (already grown by the spotlight's room) · size: the bubble · frame: the room it
// may use (window or game picture, minus the edge room) · distance: target edge → bubble edge (the pointer sits in it)
// · tipInset: how close to a corner the pointer may go. Returns the bubble's top-left and the pointer's spot on its edge.
export function placeCallout(target: Box, size: Size, frame: Box, distance: number, placement: CalloutPlacement = 'auto', tipInset = 0): CalloutSpot {
  const order: CalloutSide[] = placement === 'auto' ? ['top', 'bottom', 'right', 'left'] : [placement, opposite[placement], ...across[placement]]
  // Room left over on each side once the bubble is in it (below 0 = doesn't fit)
  const spare = (side: CalloutSide) => {
    if (side === 'top') return target.top - frame.top - distance - size.height
    if (side === 'bottom') return frame.bottom - target.bottom - distance - size.height
    if (side === 'left') return target.left - frame.left - distance - size.width
    return frame.right - target.right - distance - size.width
  }
  const centreX = (target.left + target.right) / 2, centreY = (target.top + target.bottom) / 2
  // Can the pointer reach straight at the target's middle from this side? (Not when the target sits so close to a
  // frame edge that the pointer would have to go round the bubble's corner.)
  const aims = (side: CalloutSide) => side === 'top' || side === 'bottom'
    ? centreX >= frame.left + tipInset && centreX <= frame.right - tipInset
    : centreY >= frame.top + tipInset && centreY <= frame.bottom - tipInset
  // The first side it fits on with the pointer aimed straight; then the first it fits on at all; when none fits,
  // the side with the most room (it may then have to overlap)
  const side = order.find((s) => spare(s) >= 0 && aims(s)) ?? order.find((s) => spare(s) >= 0)
    ?? order.reduce((best, s) => (spare(s) > spare(best) ? s : best))
  const fitX = (x: number) => clamp(x, frame.left, frame.right - size.width)
  const fitY = (y: number) => clamp(y, frame.top, frame.bottom - size.height)
  let x: number, y: number
  if (side === 'top' || side === 'bottom') {
    x = fitX(centreX - size.width / 2)
    y = fitY(side === 'top' ? target.top - distance - size.height : target.bottom + distance)
  } else {
    y = fitY(centreY - size.height / 2)
    x = fitX(side === 'left' ? target.left - distance - size.width : target.right + distance)
  }
  // The pointer: on the edge facing the target, aimed at the middle of the target's facing edge
  const vertical = side === 'top' || side === 'bottom'
  const tipX = vertical ? clamp(centreX - x, tipInset, size.width - tipInset) : side === 'left' ? size.width : 0
  const tipY = vertical ? (side === 'top' ? size.height : 0) : clamp(centreY - y, tipInset, size.height - tipInset)
  return { side, x, y, tipX, tipY }
}

/** "Keep clear" (0.43.0): the play area the bubble should cover as little of, and the live spot (what the player is
 *  working on right now — the glowing hex, the piece in hand) it should stay away from. Each one an Element, a CSS
 *  selector (looked up every frame) or a screen box. `avoid` = more things it must not cover, like the live spot (the
 *  other things a Spotlight lights — the button the step is about). */
export type CalloutKeepClear = { area: CalloutTarget; live?: CalloutTarget; avoid?: CalloutTarget[] }

// KEEP CLEAR — Glyphtender's tutorial rule (src/tutorial/tipsPlace.ts, made general): the bubble covers as little of
// the play area as it can. Of the sides it fits on (placeCallout's own flips and shifts), it picks — in this order of
// importance — one that doesn't cover the live spot or anything in `avoid` (on each side it first slides along, the
// pointer still on the target, to get off them; when no side is clear, the least covered), one that isn't toward the
// live spot (when the live spot isn't the target itself), the one covering the least of the play area (so: toward the
// area's nearer edge), and last the usual order: toward the nearer top / bottom edge, the other one, toward the nearer
// left / right edge, the other one.
export function placeKeepingClear(target: Box, size: Size, frame: Box, distance: number, area: Box, live: Box | null = null, tipInset = 0, avoid: Box[] = []): CalloutSpot {
  const keepOff = live ? [live, ...avoid] : avoid
  const midY = (b: Box) => (b.top + b.bottom) / 2, midX = (b: Box) => (b.left + b.right) / 2
  const vertical: CalloutSide = midY(target) < midY(area) ? 'top' : 'bottom'
  const sideways: CalloutSide = midX(target) < midX(area) ? 'left' : 'right'
  const order: CalloutSide[] = [vertical, opposite[vertical], sideways, opposite[sideways]]
  // Toward the live spot = its middle lies past the target's edge on that side (a live spot that is the target, or
  // sits inside it, is toward no side)
  const toward = (side: CalloutSide) => !!live && (side === 'top' ? midY(live) < target.top : side === 'bottom' ? midY(live) > target.bottom
    : side === 'left' ? midX(live) < target.left : midX(live) > target.right)
  const shared = (a: Box, b: Box) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  const boxOf = (s: CalloutSpot) => ({ left: s.x, top: s.y, right: s.x + size.width, bottom: s.y + size.height })
  const covered = (s: CalloutSpot) => keepOff.reduce((sum, k) => sum + shared(boxOf(s), k), 0)
  // Slide along its side (inside the frame, the pointer still reaching the target) to just past each thing it covers;
  // the smallest slide that clears them all — else it stays put
  const slideOff = (s: CalloutSpot): CalloutSpot => {
    if (!covered(s)) return s
    const along = s.side === 'top' || s.side === 'bottom'
    const aim = along ? midX(target) : midY(target), length = along ? size.width : size.height
    const [low, high] = along ? [frame.left, frame.right - length] : [frame.top, frame.bottom - length]
    const at = along ? s.x : s.y
    const tries = keepOff.flatMap((k) => (along ? [k.left - length, k.right] : [k.top - length, k.bottom]))
      .filter((p) => p >= low && p <= high && aim - p >= tipInset && aim - p <= length - tipInset)
      .map((p) => (along ? { ...s, x: p, tipX: aim - p } : { ...s, y: p, tipY: aim - p }))
      .filter((t) => !covered(t))
      .sort((a, b) => Math.abs((along ? a.x : a.y) - at) - Math.abs((along ? b.x : b.y) - at))
    return tries[0] ?? s
  }
  const ranked = order.map((side, i) => ({ side, i, spot: placeCallout(target, size, frame, distance, side, tipInset) }))
    .filter(({ side, spot }) => spot.side === side) // it really fits there (else placeCallout moved it: that side gets its own turn)
    .map(({ side, i, spot: first }) => {
      const spot = slideOff(first), box = boxOf(spot)
      return { spot, rank: [Math.round(covered(spot)), toward(side) ? 1 : 0, Math.round(shared(box, area)), i] }
    })
    .sort((a, b) => a.rank.reduce((d, n, k) => d || n - b.rank[k], 0))
  return ranked[0]?.spot ?? placeCallout(target, size, frame, distance, order[0], tipInset)
}

export const calloutWords = { label: 'Tip' }

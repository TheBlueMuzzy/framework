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
 *  selector (looked up every frame) or a screen box. */
export type CalloutKeepClear = { area: CalloutTarget; live?: CalloutTarget }

// KEEP CLEAR — Glyphtender's tutorial rule (src/tutorial/tipsPlace.ts, made general): the bubble covers as little of
// the play area as it can. Of the sides it fits on (placeCallout's own flips and shifts), it picks — in this order of
// importance — one that doesn't cover the live spot, one that isn't toward the live spot (when the live spot isn't the
// target itself), the one covering the least of the play area (so: toward the area's nearer edge), and last the usual
// order: toward the nearer top / bottom edge, the other one, toward the nearer left / right edge, the other one.
export function placeKeepingClear(target: Box, size: Size, frame: Box, distance: number, area: Box, live: Box | null = null, tipInset = 0): CalloutSpot {
  const midY = (b: Box) => (b.top + b.bottom) / 2, midX = (b: Box) => (b.left + b.right) / 2
  const vertical: CalloutSide = midY(target) < midY(area) ? 'top' : 'bottom'
  const sideways: CalloutSide = midX(target) < midX(area) ? 'left' : 'right'
  const order: CalloutSide[] = [vertical, opposite[vertical], sideways, opposite[sideways]]
  // Toward the live spot = its middle lies past the target's edge on that side (a live spot that is the target, or
  // sits inside it, is toward no side)
  const toward = (side: CalloutSide) => !!live && (side === 'top' ? midY(live) < target.top : side === 'bottom' ? midY(live) > target.bottom
    : side === 'left' ? midX(live) < target.left : midX(live) > target.right)
  const shared = (a: Box, b: Box) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  const ranked = order.map((side, i) => ({ side, i, spot: placeCallout(target, size, frame, distance, side, tipInset) }))
    .filter(({ side, spot }) => spot.side === side) // it really fits there (else placeCallout moved it: that side gets its own turn)
    .map(({ side, i, spot }) => {
      const box = { left: spot.x, top: spot.y, right: spot.x + size.width, bottom: spot.y + size.height }
      return { spot, rank: [live && shared(box, live) > 0 ? 1 : 0, toward(side) ? 1 : 0, Math.round(shared(box, area)), i] }
    })
    .sort((a, b) => a.rank.reduce((d, n, k) => d || n - b.rank[k], 0))
  return ranked[0]?.spot ?? placeCallout(target, size, frame, distance, order[0], tipInset)
}

export const calloutWords = { label: 'Tip' }

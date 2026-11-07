// TEACH — the parts a tutorial is built from: Callout (a speech bubble pointing at something; its maths in
// callout.ts) and the tips memory (tips.ts: which one-time tips a player has seen, and the Tips on / off switch).
// They know nothing about any game: the game decides WHEN a callout shows and what it says.
//
// <Callout target="#plant" text="Happy? Tap Plant." onDismiss={hide} />
//   target     an Element, a CSS selector (looked up every frame, so it can appear later), a screen point { x, y }
//              or a screen box { left, top, right, bottom }
//   placement  'auto' (default: above, else below, right, left) or a side to try first — it flips / shifts to fit
//   keepClear  { area, live? } (0.43.0), instead of placement: covers as little of the play area as it can — away from
//              the live spot, toward the area's nearer edge (Glyphtender's rule, callout.ts placeKeepingClear); still fits
//   title      a bold line above the text · action  a button label ("Got it") — then only the button closes it
//   dim        darkens everything but the target (a cut-out spotlight; taps still reach the target through the hole)
//   pulse      the target glows · dimAmount  how dark the dim is, 0–1 (default 0.65)
//   onDismiss  a tap on the callout (no action button) or on the action button
//   onOutsideTap  a tap on the dim around the target (default: onDismiss when there's no action button)
// It sits above everything (a popover in the top layer), inside the window — or the game picture when the game
// sets --kit-frame-w / --kit-frame-h — with the kit's edge room, and never covers its target.
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Row, Stack } from '../layout'
import { Button, Text } from '../controls'
import { besideWidths, calloutWords, placeCallout, placeKeepingClear, type CalloutKeepClear, type CalloutPlacement, type CalloutSide, type CalloutTarget } from './callout'
import { focusRing } from '../keysOrPad'

type Box = { left: number; top: number; right: number; bottom: number }
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(value, Math.max(low, high)))

/** The target's rectangle on screen right now, or null when it isn't there (not on the page, or hidden). A target is
 *  an Element, a CSS selector (looked up now), a screen point { x, y } or a screen box { left, top, right, bottom }. */
export function targetBox(target: CalloutTarget): Box | null {
  if (!target) return null
  if (typeof target === 'object' && !(target instanceof Element)) {
    // a box first: a DOMRect (getBoundingClientRect) has x AND left
    if ('left' in target) return { left: target.left, top: target.top, right: target.right, bottom: target.bottom }
    return { left: target.x, top: target.y, right: target.x, bottom: target.y }
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el || !el.isConnected) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null // display: none
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
}

export type CalloutProps = {
  target: CalloutTarget; text: ReactNode; title?: ReactNode
  action?: string; placement?: CalloutPlacement
  onDismiss?: () => void; onOutsideTap?: () => void
  dim?: boolean; pulse?: boolean; dimAmount?: number
  label?: string // what a screen reader calls it when it has no title (default "Tip")
  keepClear?: CalloutKeepClear // cover as little of a play area as it can, away from a live spot (0.43.0)
}

// Every side's order to try, first to last (placeCallout's own order)
const sidesFor = (placement: CalloutPlacement): CalloutSide[] => placement === 'auto' ? ['top', 'bottom', 'right', 'left']
  : ({ top: ['top', 'bottom', 'right', 'left'], bottom: ['bottom', 'top', 'right', 'left'], left: ['left', 'right', 'top', 'bottom'], right: ['right', 'left', 'top', 'bottom'] } as const)[placement].slice()
const overlaps = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
const overlapArea = (a: Box, b: Box) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))

/** What the frame loop of a pointing bubble reads each frame (kept in a ref, so a new render never restarts it). */
export type CalloutPlaceInput = {
  target: CalloutTarget; placement: CalloutPlacement
  /** A CSS selector of things the bubble must not cover (the HUD); one that holds the target itself doesn't count. */
  avoid?: string
  /** Cover as little of a play area as it can, away from a live spot (0.43.0) — `placement` is then not used. */
  keepClear?: CalloutKeepClear
}

/** THE POINTING BUBBLE'S PLACEMENT — shared by Callout and TalkingBubble (same intention: words
 *  pointing at a thing → same maths). `layer` is a .kit-callout-layer holding a .kit-callout-frame; `bubble` a
 *  .kit-callout holding a .kit-callout-tip. Every frame while mounted (the target may move, scroll, resize or appear
 *  late) it writes the layer's --kit-callout-* variables, data-side and data-ready — only when something changed. */
export function useCalloutPlace(layer: RefObject<HTMLDivElement | null>, bubble: RefObject<HTMLDivElement | null>, now: RefObject<CalloutPlaceInput>) {
  useLayoutEffect(() => {
    let frame = 0, last = '', fitFor = ''
    const tellStuck = stuckTeller()
    const place = () => {
      const el = layer.current, box = bubble.current
      if (!el || !box) return
      const room = el.querySelector<HTMLElement>('.kit-callout-frame')
      const tip = box.querySelector<HTMLElement>('.kit-callout-tip')
      const found = targetBox(now.current.target)
      if (!room || !tip || !found) {
        if (last !== 'gone') { el.removeAttribute('data-ready'); last = 'gone' }
        return
      }
      // The room it may use: the frame element (window or game picture) minus its padding (the kit's edge room + safe areas)
      const r = room.getBoundingClientRect(), pad = getComputedStyle(room)
      const frameBox = { left: r.left + parseFloat(pad.paddingLeft), top: r.top + parseFloat(pad.paddingTop),
        right: r.right - parseFloat(pad.paddingRight), bottom: r.bottom - parseFloat(pad.paddingBottom) }
      const space = parseFloat(pad.columnGap) || 0 // the spotlight's room round the target (gap-s)
      const hole = { left: found.left - space, top: found.top - space, right: found.right + space, bottom: found.bottom + space }
      const tipSize = tip.offsetWidth, reach = tipSize * Math.SQRT1_2 // a turned square sticks out half its diagonal
      // Keep clear (0.43.0): covering as little of the play area as it can, away from the live spot; else the asked side
      const keep = now.current.keepClear, area = keep && targetBox(keep.area)
      // Narrower to fit beside (0.43.1, F201): worked out again only when the room, the target or the area changes
      const fitKey = area ? [frameBox, hole, area].flatMap((b) => [b.left, b.top, b.right, b.bottom]).map(Math.round).join() : ''
      const refit = fitKey !== fitFor
      if (refit) { fitFor = fitKey; box.style.removeProperty('--kit-callout-fit-w') }
      const measure = () => ({ width: box.offsetWidth, height: box.offsetHeight })
      let size = measure()
      // The pointer stays off the rounded corners: the corner's curve, plus half the pointer's width
      const radius = parseFloat(getComputedStyle(box).borderTopLeftRadius) || 0
      const insetFor = (s: typeof size) => Math.min(Math.min(s.width, s.height) / 2, radius + reach)
      let tipInset = insetFor(size)
      const distance = reach + tipSize * 0.25
      // (what it keeps off gets the same room round it as the target: a Spotlight's hole round it, and its outline)
      const keepOff = (keep?.avoid ?? []).flatMap((t) => { const b = targetBox(t); return b ? [{ left: b.left - space, top: b.top - space, right: b.right + space, bottom: b.bottom + space }] : [] })
      const keepClearAt = (s: typeof size) => placeKeepingClear(hole, s, frameBox, distance, area!, targetBox(keep!.live), insetFor(s), keepOff)
      let spot = area ? keepClearAt(size) : placeCallout(hole, size, frameBox, distance, now.current.placement, tipInset)
      // At its own width it covers the play area (no side holds it — a board as tall as the screen): it tries the room
      // beside the target, never narrower than 8em, and keeps the width covering the least (besideWidths)
      if (area && refit) {
        // (the area with the pointer's room round it: a bubble squeezed against the area points INTO it)
        const roomy = { left: area.left - distance, top: area.top - distance, right: area.right + distance, bottom: area.bottom + distance }
        const coverOf = (s: typeof spot, z: typeof size) => overlapArea({ left: s.x, top: s.y, right: s.x + z.width, bottom: s.y + z.height }, roomy)
        let best = { spot, size, cover: coverOf(spot, size), width: 0 }
        const least = parseFloat(getComputedStyle(box).fontSize) * 8
        for (const width of best.cover > 0 ? besideWidths(hole, frameBox, distance, size.width, least) : []) {
          box.style.setProperty('--kit-callout-fit-w', `${width}px`)
          const narrow = measure(), at = keepClearAt(narrow), cover = coverOf(at, narrow)
          if (cover < best.cover) best = { spot: at, size: narrow, cover, width }
        }
        if (best.width) box.style.setProperty('--kit-callout-fit-w', `${best.width}px`)
        else box.style.removeProperty('--kit-callout-fit-w')
        ;({ spot, size } = best)
        tipInset = insetFor(size)
      }
      // Clear of the HUD: the first side (in the usual order) where it fits without covering anything to avoid
      const avoid = now.current.avoid ? avoidBoxes(now.current.avoid, now.current.target, box) : []
      const spotBox = (s: typeof spot) => ({ left: s.x, top: s.y, right: s.x + size.width, bottom: s.y + size.height })
      const covers = (s: typeof spot) => avoid.some((a) => overlaps(spotBox(s), a.box))
      if (avoid.length && covers(spot)) {
        const sides = sidesFor(now.current.placement)
        // No clear side next to the target (two seats side by side, both talking): one step further out on a side,
        // then two — a second bubble stacks past the first instead of on top of it (the pointer still aims at its seat)
        const tries = [0, 1, 2].flatMap((step) => sides.map((side) => ({ side, extra: step * ((side === 'top' || side === 'bottom' ? size.height : size.width) + space) })))
        const clear = tries.map(({ side, extra }) => placeCallout(hole, size, frameBox, distance + extra, side, tipInset))
          .find((s, i) => s.side === tries[i].side && !covers(s))
        if (clear) spot = clear
      }
      // Never off the window or game picture itself (0.35.4, F147): a bubble wider than its room (a TalkingBubble's room
      // shrinks by its waves' reach) was pinned at the room's left and ran past the right edge — it uses the edge room
      // (down to the spotlight's gap) instead, the pointer still aimed at the target
      const hard = { left: r.left + space, right: r.right - space }
      if (size.width > frameBox.right - frameBox.left && hard.right - hard.left >= size.width) {
        const x = Math.min(Math.max(spot.x, hard.left), hard.right - size.width)
        const vertical = spot.side === 'top' || spot.side === 'bottom'
        spot = { ...spot, x, tipX: vertical ? Math.min(Math.max(spot.tipX - (x - spot.x), tipInset), size.width - tipInset) : spot.tipX }
      }
      // No side kept it clear (F130): it covers what it was told to avoid — said once in dev, so it gets fixed on purpose
      const covered = avoid.filter((a) => overlaps(spotBox(spot), a.box))
      tellStuck(covered.length > 0, () => stuckLine(bubbleName(box, now.current.target), covered.map((a) => nameOf(a.el))))
      // The pointer sits inside the bubble's border box; its centre goes on the middle of the border line
      const border = (box.offsetWidth - box.clientWidth) / 2
      const tipX = spot.tipX - border + (spot.side === 'left' ? -border / 2 : spot.side === 'right' ? border / 2 : 0)
      const tipY = spot.tipY - border + (spot.side === 'top' ? -border / 2 : spot.side === 'bottom' ? border / 2 : 0)
      const key = [spot.x, spot.y, tipX, tipY, spot.side, hole.left, hole.top, hole.right, hole.bottom].map((n) => (typeof n === 'number' ? Math.round(n * 2) / 2 : n)).join()
      if (key === last) return
      last = key
      const set = (name: string, px: number) => el.style.setProperty(name, `${px}px`)
      set('--kit-callout-x', spot.x); set('--kit-callout-y', spot.y)
      set('--kit-callout-tip-x', tipX); set('--kit-callout-tip-y', tipY)
      set('--kit-hole-l', hole.left); set('--kit-hole-t', hole.top); set('--kit-hole-r', hole.right); set('--kit-hole-b', hole.bottom)
      el.setAttribute('data-side', spot.side)
      el.setAttribute('data-ready', '')
    }
    const loop = () => { place(); frame = schedule(loop) }
    place()
    frame = schedule(loop)
    return () => cancel(frame)
  }, [layer, bubble, now])
}

// The boxes of what a bubble must stay off (visible ones only), minus any that hold the target (its own seat's HUD)
// and the bubble itself (a selector like .kit-talk names it too)
function avoidBoxes(selector: string, target: CalloutTarget, self: Element): { el: Element; box: Box }[] {
  const targetEl = typeof target === 'string' ? document.querySelector(target) : target instanceof Element ? target : null
  return [...document.querySelectorAll(selector)]
    .filter((el) => el !== self && !(targetEl && el.contains(targetEl)))
    .filter((el) => getComputedStyle(el).visibility !== 'hidden')
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 0 && r.height > 0)
    .map(({ el, r }) => ({ el, box: { left: r.left, top: r.top, right: r.right, bottom: r.bottom } }))
}

// What a person would call a piece in a warning: its label, else its words as shown, else its class
function nameOf(el: Element): string {
  const words = (el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.textContent || '').replace(/\s+/g, ' ').trim()
  if (words) return words.length > 30 ? `${words.slice(0, 29)}…` : words
  return el.classList[0] ? `.${el.classList[0]}` : el.tagName.toLowerCase()
}

// Which part the bubble is, and what it points at: 'TalkingBubble at "The Veteran"'
const PARTS: [string, string][] = [['kit-talk', 'TalkingBubble']]
function bubbleName(box: Element, target: CalloutTarget): string {
  const part = PARTS.find(([cls]) => box.classList.contains(cls))?.[1] ?? 'Callout'
  const el = typeof target === 'string' ? document.querySelector(target) : target instanceof Element ? target : null
  return el ? `${part} at "${nameOf(el)}"` : part
}

/** A bubble that can't stay clear of its `avoid` says so in the dev console (F130, 0.33.3): once when it gets stuck,
 *  and again only after it was clear in between — never every frame. Nothing in a production build.
 *  `line` is made only when it's said (naming the pieces reads the page). */
export function stuckTeller(warn: (line: string) => void = (line) => console.warn(line), settle = STUCK_SETTLE_MS, clock = () => performance.now()) {
  let stuck = false, since = -1
  return (now: boolean, line: () => string) => {
    if (!now) { stuck = false; since = -1; return }
    if (stuck) return
    // Only when it STAYS stuck (0.35.4, F147): for a frame or two while things move (the text size just changed, another
    // bubble still popping in bigger) every bubble is re-placed — the Cozy emotes at 200% said so 26 ms after the switch,
    // then sat clear. `settle` ms covering it, then it's said.
    const at = clock()
    if (since < 0) since = at
    if (at - since < settle) return
    stuck = true
    if (import.meta.env?.DEV) warn(line())
  }
}
/** How long a bubble must stay stuck on what it avoids before it says so (ms). */
export const STUCK_SETTLE_MS = 300

/** The warning's words: which bubble, and what it covers. */
export const stuckLine = (bubble: string, covered: string[]) =>
  `[ui-kit] the ${bubble} can’t stay clear of ${covered.map((n) => `"${n}"`).join(', ')} (its avoid): no side has room, so it covers it — make room there, or point it at something else`

/** Show a popover layer while mounted (above the game and any open screen). */
export function useShownPopover(layer: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = layer.current
    if (el?.showPopover && !el.matches(':popover-open')) el.showPopover() // (very old browsers: it just sits in the page)
    return () => { if (el?.hidePopover && el.matches(':popover-open')) el.hidePopover() }
  }, [layer])
}

export function Callout({ target, text, title, action, placement = 'auto', onDismiss, onOutsideTap, dim, pulse, dimAmount, label, keepClear }: CalloutProps) {
  const layer = useRef<HTMLDivElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  // The latest props for the frame loop, without restarting it on every render
  const now = useRef<CalloutPlaceInput>({ target, placement, keepClear })
  useLayoutEffect(() => { now.current = { target, placement, keepClear } })

  // Show the popover while mounted (above the game and any open screen)
  useShownPopover(layer)

  // A pause (dim + a button) takes the focus, so keys and screen readers land on it
  // (a frame later: a screen opening in the same moment moves the focus into itself first)
  useEffect(() => {
    if (!dim || !action) return
    const frame = schedule(() => bubble.current?.querySelector('button')?.focus(focusRing({ preventScroll: true })))
    return () => cancel(frame)
  }, [dim, action])

  // Place it every frame while it's up: the target may move, scroll, resize or appear late. Only writes when something changed.
  useCalloutPlace(layer, bubble, now)

  const dismissible = !action && !!onDismiss
  const outside = onOutsideTap ?? (action ? undefined : onDismiss)
  const dimShare = dimAmount === undefined ? undefined : `${Math.round(clamp(dimAmount, 0, 1) * 100)}%` // (undefined = the CSS default)
  const titled = title !== undefined && title !== null && title !== ''
  const content = (
    <div ref={layer} {...{ popover: 'manual' }} className="kit-scope kit-callout-layer" data-dim={dim || undefined}
      style={{ '--kit-callout-dim': dimShare } as CSSProperties}>
      <div className="kit-callout-frame" aria-hidden />
      {dim && <div className="kit-callout-dim" aria-hidden onClick={outside} />}
      {pulse && <div className="kit-callout-ring" aria-hidden />}
      <div ref={bubble} className="kit-callout" data-dismissible={dismissible || undefined}
        role={dim && action ? 'dialog' : 'status'} aria-live={dim && action ? undefined : 'polite'}
        aria-label={titled ? undefined : (label ?? calloutWords.label)}
        onClick={dismissible ? onDismiss : undefined}>
        <Stack gap="s" className="kit-callout-body">
          {titled && <Text kind="label">{title}</Text>}
          <Text>{text}</Text>
          {action && <Row justify="end"><Button onClick={onDismiss}>{action}</Button></Row>}
        </Stack>
        <span className="kit-callout-tip" aria-hidden />
      </div>
    </div>
  )
  return typeof document === 'undefined' ? null : createPortal(content, document.body)
}

// One frame later (a timer where there are no animation frames, e.g. tests)
const schedule = (fn: () => void) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : (setTimeout(fn, 16) as unknown as number))
const cancel = (id: number) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id))


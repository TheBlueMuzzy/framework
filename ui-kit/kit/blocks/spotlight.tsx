// SPOTLIGHT (0.43.0, F199 — from Goops' lesson spotlight, F32) — dims everything except the things being taught, with
// an outline round each. Several holes at once (the piece AND the button that uses it). Knows nothing about any game:
// the game decides when it shows and what it lights. Pair it with a Callout (no dim) for the words.
//
// <Spotlight targets={['#plant', '[data-hex="3,4"]']} onOutsideTap={nudge} />
//   targets      one or more: an Element, a CSS selector (looked up every frame, so it can appear later or move) or a
//                screen box { left, top, right, bottom }. Each gets a hole (grown by the style's gap-s); a missing one
//                gets none. Two holes that overlap stay one hole.
//   outline      'each' (default: an accent outline round every hole) · 'joined' (one round them all) · 'none'
//   pulse        the outline breathes (the Callout's pulse; reduce motion: steady)
//   dimAmount    how dark, 0–1 (default 0.65)
//   TAPS: in a hole they reach the thing underneath. On the dim they stop there (the game under it gets nothing) and
//   call onOutsideTap (a nudge, "tap the glowing piece"). passThrough = more targets that stay dimmed but let taps
//   through (Goops' tank: the flick still works); passThrough={['body']} makes the dim only a look.
// A popover in the top layer like the Callout, sized to the window. A Callout shown while it's up stays above it.
import { useEffect, useId, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { targetBox } from './teach'
import type { CalloutBox } from './callout'
import { clipBox, growBox, holePath, joinBoxes, outsidePath } from './spotlightMath'

export type SpotlightTarget = Element | string | CalloutBox
export type SpotlightProps = {
  targets: SpotlightTarget | SpotlightTarget[]
  outline?: 'each' | 'joined' | 'none'
  pulse?: boolean
  dimAmount?: number
  passThrough?: SpotlightTarget[]
  onOutsideTap?: () => void
}

const listOf = (t: SpotlightTarget | SpotlightTarget[]) => (Array.isArray(t) ? t : [t])
const half = (n: number) => Math.round(n * 2) / 2

export function Spotlight({ targets, outline = 'each', pulse, dimAmount, passThrough, onOutsideTap }: SpotlightProps) {
  const layer = useRef<HTMLDivElement>(null)
  const maskId = `kit-spot-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const list = listOf(targets)
  // The latest props for the frame loop, without restarting it on every render
  const now = useRef({ list, outline, passThrough })
  useLayoutEffect(() => { now.current = { list, outline, passThrough } })

  // Above the game and any open screen (the top layer) — but under a Callout already up: it's raised back on top
  useEffect(() => {
    const el = layer.current
    if (!el?.showPopover) return
    if (!el.matches(':popover-open')) el.showPopover()
    const focused = document.activeElement
    for (const callout of document.querySelectorAll<HTMLElement>('.kit-callout-layer:popover-open')) {
      if (callout === el) continue
      callout.hidePopover(); callout.showPopover()
    }
    if (focused instanceof HTMLElement && focused !== document.activeElement) focused.focus({ preventScroll: true })
    return () => { if (el.matches(':popover-open')) el.hidePopover() }
  }, [])

  // Place it all every frame (targets move, slide, appear late); writes only what changed
  useLayoutEffect(() => {
    let frame = 0
    const last = new Map<Element, string>()
    const write = (el: Element | null, value: string, apply: (el: HTMLElement) => void) => {
      if (!(el instanceof HTMLElement) || last.get(el) === value) return
      last.set(el, value)
      apply(el)
    }
    const place = () => {
      const el = layer.current
      if (!el) return
      const w = window.innerWidth, h = window.innerHeight
      const space = parseFloat(getComputedStyle(el).columnGap) || 0 // (the style's gap-s: room round each target)
      const found = now.current.list.map((t) => targetBox(t))
      const holes = found.flatMap((b) => (b ? [growBox(b, space)] : []))
      const through = (now.current.passThrough ?? []).flatMap((t) => { const b = targetBox(t); return b ? [b] : [] })
      write(el, holes.length ? 'ready' : 'gone', (e) => e.toggleAttribute('data-ready', holes.length > 0))
      // The dim's holes: shaped like the style's controls (its corner radius and corner shape, read off the probe), cut
      // from an SVG mask — so two holes that overlap stay one hole
      const probe = getComputedStyle(el.querySelector('.kit-spot-probe')!)
      const radius = parseFloat(probe.borderTopLeftRadius) || 0, bevel = probe.getPropertyValue('corner-shape').trim() === 'bevel'
      el.querySelectorAll('.kit-spot-hole').forEach((path, i) => {
        const hole = found[i] && growBox(found[i], space)
        const d = hole ? holePath(hole, radius, bevel) : 'M0 0Z'
        if (last.get(path) !== d) { last.set(path, d); path.setAttribute('d', d) }
      })
      const blockPath = outsidePath([...holes, ...through], w, h)
      write(el.querySelector('.kit-spot-block'), blockPath, (e) => e.style.setProperty('clip-path', blockPath))
      // The outlines: the edge of each hole (or one round them all) — drawn just inside it (blocks.css), so there's no
      // dim sliver between hole and line, and a Callout's pointer (placed off the hole's edge) keeps clear of the line.
      // Kept on screen: a target running off the window's edge is outlined up to that edge
      const rings = [...el.querySelectorAll<HTMLElement>('.kit-spot-ring')]
      const boxes = now.current.outline === 'joined' ? [joinBoxes(holes)] : found.map((b) => (b ? growBox(b, space) : null))
      rings.forEach((ring, i) => {
        const hole = boxes[i], box = hole && clipBox(hole, { left: 0, top: 0, right: w, bottom: h })
        const key = box ? [box.left, box.top, box.right, box.bottom].map(half).join() : 'gone'
        write(ring, key, (e) => {
          if (!box) { e.setAttribute('data-gone', ''); return }
          e.removeAttribute('data-gone')
          e.style.setProperty('--kit-spot-x', `${half(box.left)}px`); e.style.setProperty('--kit-spot-y', `${half(box.top)}px`)
          e.style.setProperty('--kit-spot-w', `${half(box.right - box.left)}px`); e.style.setProperty('--kit-spot-h', `${half(box.bottom - box.top)}px`)
        })
      })
    }
    const loop = () => { place(); frame = schedule(loop) }
    place()
    frame = schedule(loop)
    return () => cancel(frame)
  }, [])

  const rings = outline === 'none' ? 0 : outline === 'joined' ? 1 : list.length
  const dimShare = dimAmount === undefined ? undefined : `${Math.round(Math.max(0, Math.min(1, dimAmount)) * 100)}%`
  const content = (
    <div ref={layer} {...{ popover: 'manual' }} className="kit-scope kit-spot-layer" aria-hidden data-pulse={pulse || undefined}
      style={{ '--kit-spot-dim': dimShare } as CSSProperties}>
      {/* the dim you see (taps pass it: the see-through block under it decides where they stop). The mask's white =
          dimmed, black = a hole: what a mask means, not a look (the dim's colour is the style's, in blocks.css) */}
      <svg className="kit-spot-dim">
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="white" />
          {list.map((_, i) => <path key={i} className="kit-spot-hole" fill="black" d="M0 0Z" />)}
        </mask>
        <rect className="kit-spot-shade" width="100%" height="100%" mask={`url(#${maskId})`} />
      </svg>
      <div className="kit-spot-probe" />
      <div className="kit-spot-block" onClick={onOutsideTap} />
      {Array.from({ length: rings }, (_, i) => <div key={i} className="kit-spot-ring" data-gone="" />)}
    </div>
  )
  return typeof document === 'undefined' ? null : createPortal(content, document.body)
}

// One frame later (a timer where there are no animation frames, e.g. tests)
const schedule = (fn: () => void) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : (setTimeout(fn, 16) as unknown as number))
const cancel = (id: number) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id))

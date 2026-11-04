// THE ANNOUNCER — what screen readers hear (0.32.0, F116; moved out of the archived emote parts in 0.40.0, F186).
//
// <LiveAnnouncer text="Ada: Well played!" stamp={n} /> — says it politely, at most one line a second, the rest skipped.
// announce("…") — the same, from anywhere, no limit. Both go through the page's ONE lasting live region (TalkingBubble
// says its line through it too).
import { useEffect, useRef } from 'react'

// ─── The announcer ──────────────────────────────────────────────────

// ONE LASTING LIVE REGION PER PAGE (0.32.0, F116). Screen readers only read a live region's CHANGES — one created
// together with its text is often skipped (the sprint 29 review: a remounted bubble's line went unsaid). So the kit
// keeps a single region per document: made the first time anything announces (or a LiveAnnouncer / TalkingBubble
// mounts), added straight to <body> (outside any screen, so a screen's slide or a remount never takes it away), and
// never removed; each line only changes its text. Its very first line waits a moment (FIRST_LINE_MS) so the region is
// already on the page before its text arrives. The same line twice is still said twice: the text then toggles a
// trailing no-break space (a change a screen reader hears as the same words). If something removes it (a game that
// clears <body>), the next line makes a new one.
// Why this and not a provider: nothing for a game to wrap or forget, and two parts (or two installed modules) can't
// end up with two regions talking over each other.
type Live = { el: HTMLElement; ready: boolean; at: number; pending: string | null }
const regions = new WeakMap<Document, Live>()
const FIRST_LINE_MS = 100
const SAME_AGAIN = ' '

/** The page's one live region (made now if there isn't one yet). */
export function liveRegion(doc: Document = document): HTMLElement {
  const known = regions.get(doc)
  if (known?.el.isConnected) return known.el
  const el = doc.createElement('div')
  el.className = 'kit-sr-only kit-live'
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'polite')
  el.setAttribute('aria-atomic', 'true')
  doc.body.appendChild(el)
  const live: Live = { el, ready: false, at: Date.now(), pending: null }
  regions.set(doc, live)
  setTimeout(() => { live.ready = true; if (live.pending !== null) say(live, live.pending) }, FIRST_LINE_MS)
  return el
}

function say(live: Live, text: string) {
  live.pending = null
  live.el.textContent = live.el.textContent === text ? text + SAME_AGAIN : text
}

/** Says `text` once, politely, through the page's one live region (the same line again is said again). */
export function announce(text: string, doc?: Document) {
  if (typeof document === 'undefined' || !text) return
  const page = doc ?? document
  liveRegion(page)
  const live = regions.get(page)!
  if (!live.ready && Date.now() - live.at >= FIRST_LINE_MS) live.ready = true // (a timer that never ran: fake clocks)
  if (live.ready) say(live, text)
  else live.pending = text // the newest line waits for the region's first moment
}

/** Each new `stamp` says `text` once through the page's live region — but at most one line every `minGapMs`; lines
 *  in between are skipped (a burst of emotes must not bury the game's own announcements). Draws nothing itself
 *  (0.32.0: it used to be its own region, made together with its text). */
export function LiveAnnouncer({ text, stamp, minGapMs = 1000 }: { text: string; stamp: number | string; minGapMs?: number }) {
  const last = useRef(-Infinity)
  useEffect(() => { liveRegion() }, []) // on the page before the first line
  useEffect(() => {
    if (!text) return
    const at = Date.now()
    if (at - last.current < minGapMs) return
    last.current = at
    announce(text)
  }, [stamp, text, minGapMs])
  return null
}

// Talking bubble (0.31.0, F111): the talking (rests, pops, squelches, plain), the spike shapes, the outline (the
// pointer never fizzes, the wave's sides), and the part — reduce motion shows the line whole, screen readers hear it
// once, a tap finishes then confirms, and the numbers are read live (a changed value takes effect without a re-render).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { liveRegion } from './emotes'
import {
  DEFAULT_TALK_FEEL, TALK_FEEL_RANGES, TALK_GROW_MS, TalkingBubble, finishTalk, growScale, restAfter, spikeShape, startTalk,
  stepTalk, squelchGap, talkFeel, talkOutline, waveOffsets, type TalkFeel, type TalkState,
  TALK_MIN_CONTRAST, colourRgb, contrastRatio, isColour, talkColours,
} from './talkingBubble'

const feel = (over: Partial<TalkFeel> = {}): TalkFeel => ({ ...DEFAULT_TALK_FEEL, ...over })
const half = () => 0.5
// Steps the talk at the part's own step until `until` is true (or `max` seconds); returns the seconds it took
function run(s: TalkState, text: string, f: TalkFeel, until: () => boolean, max = 30, plain = false) {
  let t = 0
  while (!until() && t < max) { stepTalk(s, 1 / 120, text, f, half, plain); t += 1 / 120 }
  return t
}

describe('the talking', () => {
  it('the approved values are the defaults', () => {
    expect(DEFAULT_TALK_FEEL).toEqual({ waveStart: 0, waveEnd: 0.34, spikeGap: 19, talkHeight: 51, roundness: 3, variability: 0.45,
      popSize: 0.025, typeSpeed: 22, pauseMs: 380, squelchEvery: 2.5 })
  })
  it('rests: full after . ! ? … (a "..." only after its last dot), half after , and —, none after a letter', () => {
    const f = feel({ pauseMs: 400 })
    expect(restAfter('Hi.', 2, f)).toBe(0.4)
    expect(restAfter('No!', 2, f)).toBe(0.4)
    expect(restAfter('Who?', 3, f)).toBe(0.4)
    expect(restAfter('so…', 2, f)).toBe(0.4)
    expect(restAfter('...x', 0, f)).toBe(0)
    expect(restAfter('...x', 2, f)).toBe(0.4)
    expect(restAfter('a, b', 1, f)).toBe(0.2)
    expect(restAfter('a— b', 1, f)).toBe(0.2)
    expect(restAfter('ab', 0, f)).toBe(0)
  })
  it('grows for 320 ms, waits a beat, then types at typeSpeed — and rests where the line says', () => {
    const f = feel({ typeSpeed: 10, pauseMs: 500 }), text = 'Hi. Yo, ok'
    const s = startTalk()
    expect(s.phase).toBe('grow')
    run(s, text, f, () => s.phase !== 'grow')
    expect(s.shown).toBe(0)
    run(s, text, f, () => s.shown >= 3) // "Hi." is out
    const afterDot = run(s, text, f, () => s.shown >= 4)
    expect(afterDot).toBeCloseTo(0.1 + 0.5, 1) // a letter's time + the full rest
    run(s, text, f, () => s.shown >= 7) // "Hi. Yo,"
    const afterComma = run(s, text, f, () => s.shown >= 8)
    expect(afterComma).toBeCloseTo(0.1 + 0.25, 1) // + half the rest
    const plainLetter = run(s, text, f, () => s.shown >= 9)
    expect(plainLetter).toBeCloseTo(0.1, 1)
    run(s, text, f, () => s.phase === 'wait')
    expect(s.shown).toBe(text.length)
  })
  it('the voice level rises while typing letters and relaxes flat at a rest', () => {
    const f = feel({ typeSpeed: 20, pauseMs: 800 }), text = 'Hello. there'
    const s = startTalk()
    run(s, text, f, () => s.shown >= 5)
    expect(s.level).toBeGreaterThan(0.4)
    run(s, text, f, () => s.shown >= 6) // the "."
    run(s, text, f, () => false, 0.5) // well into the rest
    expect(s.level).toBeLessThan(0.05)
  })
  it('a syllable (a vowel after a non-vowel) pops the outline; popSize 0 never does', () => {
    const s = startTalk()
    run(s, 'ba', feel(), () => s.shown >= 2)
    expect(s.popV).toBeGreaterThan(0)
    const flat = startTalk()
    run(flat, 'ba', feel({ popSize: 0 }), () => flat.shown >= 2)
    expect(flat.popV).toBe(0)
  })
  it('plain: same typing and pops, but the voice level (so the wave and the squelch) stays at 0', () => {
    const s = startTalk()
    run(s, 'banana banana', feel(), () => s.shown >= 8, 30, true)
    expect(s.level).toBe(0)
    expect(s.popV).not.toBe(0)
  })
  it('waiting: a squelch every squelchEvery ± 1.5 s (never under 0.2 s); 0 = never', () => {
    expect(squelchGap(feel({ squelchEvery: 2.5 }), () => 0)).toBe(1)
    expect(squelchGap(feel({ squelchEvery: 2.5 }), () => 1)).toBe(4)
    expect(squelchGap(feel({ squelchEvery: 0.5 }), () => 0)).toBe(0.2)
    expect(squelchGap(feel({ squelchEvery: 0 }), () => 0.5)).toBe(Infinity)
    const s = startTalk(), f = feel({ squelchEvery: 2 })
    finishTalk(s, 'Hi', f, half)
    expect(s.phase).toBe('wait')
    run(s, 'Hi', f, () => false, 1.9)
    expect(s.level).toBeLessThan(0.05)
    run(s, 'Hi', f, () => s.level > 0.3, 0.2)
    expect(s.level).toBeGreaterThan(0.3) // the burst
  })
  it('finishTalk shows the whole line and waits', () => {
    const s = startTalk()
    finishTalk(s, 'Some words', feel(), half)
    expect(s).toMatchObject({ phase: 'wait', shown: 10 })
  })
  it('grows from 0.15 to full with a little overshoot (ease-out-back)', () => {
    expect(growScale(0)).toBeCloseTo(0.15)
    expect(growScale(1)).toBeCloseTo(1)
    expect(Math.max(...[0.6, 0.7, 0.8, 0.9].map(growScale))).toBeGreaterThan(1)
    expect(TALK_GROW_MS).toBe(320)
  })
})

describe('the spikes and the outline', () => {
  it('roundness 0 = needle (concave), 5 = sine, 10 = semicircle', () => {
    expect(spikeShape(0.25, 0)).toBeCloseTo(0.25)
    expect(spikeShape(0.25, 5)).toBeCloseTo(Math.SQRT1_2)
    expect(spikeShape(0.25, 10)).toBeCloseTo(Math.sqrt(0.75))
    for (const r of [0, 3, 5, 10]) { expect(spikeShape(0.5, r)).toBeCloseTo(1); expect(spikeShape(0, r)).toBeCloseTo(0) }
  })
  const box = { x: 0, y: 0, w: 300, h: 100, r: 12, bevel: false, side: 'top' as const, tipX: 150, tipY: 100, reach: 11 }
  it('walks the outline 1 px apart, clockwise from the top-left; the pointer comes out of the edge facing the target', () => {
    const { points, tip } = talkOutline(box)
    expect(points.length).toBeGreaterThan(2 * (300 + 100) - 40)
    expect(points[0]).toMatchObject({ x: 12, y: 0 })
    expect(points[0].ny).toBeCloseTo(-1) // the top edge's outward normal points up
    expect(tip).toEqual({ x: 150, y: 111 }) // above its target: the pointer hangs down from the bottom edge
    expect(talkOutline({ ...box, side: 'right', tipX: 0, tipY: 50 }).tip).toEqual({ x: -11, y: 50 })
  })
  it('the pointer never fizzes: a full-loop wave at full voice moves every point but the pointer', () => {
    const { points } = talkOutline(box)
    const s = startTalk(); s.level = 1
    const { out } = waveOffsets(points, s, feel({ waveStart: 0, waveEnd: 1 }), 1, half)
    s.heights.fill(1)
    const { out: loud } = waveOffsets(points, s, feel({ waveStart: 0, waveEnd: 1 }), 1, half)
    const pointer = points.map((p, i) => [p, i] as const).filter(([p]) => p.keep === 0).map(([, i]) => i)
    expect(pointer.length).toBeGreaterThan(10)
    for (const i of pointer) expect(loud[i]).toBe(0)
    expect(Math.max(...loud)).toBeGreaterThan(40) // spikes up to ~talkHeight
    expect(out.length).toBe(points.length)
  })
  it('the approved stretch (0 → 0.34) on a wide bubble reaches only its top; quiet = flat', () => {
    const { points } = talkOutline({ ...box, w: 352 })
    const s = startTalk()
    const { out, sides } = waveOffsets(points, s, feel(), 1, half)
    expect(sides).toEqual({ top: true, right: false, bottom: false, left: false })
    expect(Math.max(...out)).toBe(0) // level 0: no wave
    expect(waveOffsets(points, s, feel({ waveStart: 0.5, waveEnd: 0.5 }), 1, half).sides).toEqual({ top: true, right: true, bottom: true, left: true })
  })
  it('a bad talk.json (0.32.0): out-of-range numbers pulled into range; null / missing / NaN / words = the default', () => {
    const bad = { variability: 5, waveStart: 'x', spikeGap: null, typeSpeed: Number.NaN, talkHeight: -3, popSize: Infinity, roundness: 99, pauseMs: '400' }
    expect(talkFeel(bad)).toEqual({ ...DEFAULT_TALK_FEEL, variability: 1, talkHeight: 0, roundness: 10 })
    expect(talkFeel(null)).toEqual(DEFAULT_TALK_FEEL)
    expect(talkFeel(undefined)).toEqual(DEFAULT_TALK_FEEL)
    expect(talkFeel({ spikeGap: 0, typeSpeed: 0, squelchEvery: -1, waveEnd: 2 })).toMatchObject({ spikeGap: 2, typeSpeed: 1, squelchEvery: 0, waveEnd: 1 })
    expect(talkFeel({ typeSpeed: 40 }).typeSpeed).toBe(40) // a good value is kept as is
    for (const [key, [low, high]] of Object.entries(TALK_FEEL_RANGES)) {
      const value = DEFAULT_TALK_FEEL[key as keyof TalkFeel]
      expect(value >= low && value <= high, `${key}'s approved value is inside its range`).toBe(true)
    }
  })
  it('…so the outline it draws is whole: variability 5 (spikes turned inside out before) stays a proper wave', () => {
    const { points } = talkOutline(box)
    const s = startTalk(); s.level = 1
    const f = talkFeel({ variability: 5, waveStart: 'x', waveEnd: 1, spikeGap: null })
    let rnd = 0
    const spread = () => ((rnd = (rnd + 0.37) % 1), rnd) // a spread of picks, the extremes included
    waveOffsets(points, s, f, 1, spread)
    for (let i = 0; i < 40; i++) stepTalk(s, 1 / 120, 'banana banana', f, spread)
    const { out } = waveOffsets(points, s, f, 1, spread)
    expect(s.widths.every((w) => w > 0)).toBe(true)
    expect([...out].every((o) => Number.isFinite(o) && o >= 0)).toBe(true)
  })
  it('bevel corners are cut straight (Neon, Pixel)', () => {
    const round = talkOutline(box).points.length, bevel = talkOutline({ ...box, bevel: true }).points.length
    expect(bevel).toBeLessThan(round) // a 12 px corner: an arc of ~19 px vs a cut of ~17 px
  })
})

describe('<TalkingBubble>', () => {
  // The page's one live region, already on the page past its first moment (as it is after a game's first line)
  beforeAll(async () => { liveRegion(); await new Promise((done) => setTimeout(done, 150)) })
  // Frames by hand: each tick moves the clock 1/60 s and runs the queued frames
  let now = 0
  let queued: FrameRequestCallback[] = []
  const frames = (n: number) => act(() => { for (let i = 0; i < n; i++) { now += 1000 / 60; const run = queued; queued = []; run.forEach((fn) => fn(now)) } })
  beforeEach(() => {
    now = 0; queued = []
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { queued.push(fn); return queued.length })
    vi.stubGlobal('cancelAnimationFrame', () => { queued = [] })
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); document.documentElement.removeAttribute('data-reduce-motion') })
  const typed = () => document.querySelector('.kit-talk-typed')!.textContent
  const rest = () => document.querySelector('.kit-talk-rest')!.textContent

  it('lays the whole line out from the start (the untyped part unseen), then types it', () => {
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="Found some scraps." />)
    expect(typed()).toBe('')
    expect(rest()).toBe('Found some scraps.') // fixed size: all of it is there, unseen
    frames(60) // 1 s: grown, then 22 letters a second
    expect(typed()!.length).toBeGreaterThan(4)
    expect(typed()! + rest()).toBe('Found some scraps.')
    expect(document.querySelector('.kit-talk')!.getAttribute('data-phase')).toBe('type')
  })
  it('the words sit outside the drawn outline: grow and pops move only the outline (the svg group)', () => {
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="Banana" />)
    expect(document.querySelector('.kit-talk-outline g .kit-talk-shape')).toBeTruthy()
    expect(document.querySelector('.kit-talk-outline .kit-talk-typed')).toBeNull()
  })
  it('screen readers hear the whole line once (with who says it), never the letters; the bubble is hidden from them', () => {
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="Don't tell the screen." speaker="The Veteran" />)
    frames(30)
    const status = screen.getByRole('status')
    expect(status.textContent).toBe("The Veteran: Don't tell the screen.")
    expect(document.querySelector('.kit-talk')!.getAttribute('aria-hidden')).toBe('true')
    expect(document.querySelector('.kit-talk-body')!.getAttribute('aria-hidden')).toBe('true')
  })
  it('reduce motion: no grow, no typing — the whole line at once, and it says so (onTyped)', () => {
    document.documentElement.setAttribute('data-reduce-motion', '')
    const onTyped = vi.fn()
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="Hold on. Bad wire." onTyped={onTyped} />)
    expect(typed()).toBe('Hold on. Bad wire.')
    expect(rest()).toBe('')
    expect(document.querySelector('.kit-talk')!.getAttribute('data-phase')).toBe('wait')
    expect(onTyped).toHaveBeenCalledOnce()
    frames(300)
    expect(onTyped).toHaveBeenCalledOnce()
  })
  it('reduce motion: a new line in the same bubble says onTyped again (review fix — it was missed: never seen typing)', () => {
    document.documentElement.setAttribute('data-reduce-motion', '')
    const onTyped = vi.fn()
    const { rerender } = render(<TalkingBubble target={{ x: 50, y: 50 }} text="Hold on." onTyped={onTyped} />)
    frames(10)
    rerender(<TalkingBubble target={{ x: 50, y: 50 }} text="Bad wire." onTyped={onTyped} />)
    frames(10)
    expect(typed()).toBe('Bad wire.')
    expect(onTyped).toHaveBeenCalledTimes(2)
  })
  it('with onConfirm it is a button ("Next"): a tap while typing shows the whole line, the next tap confirms', () => {
    const onConfirm = vi.fn()
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="Glad you're not goop yet." onConfirm={onConfirm} words={{ next: 'Go on' }} />)
    frames(40)
    const button = screen.getByRole('button', { name: 'Go on', hidden: true })
    fireEvent.click(button)
    frames(1)
    expect(typed()).toBe("Glad you're not goop yet.")
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.keyDown(button, { key: 'Enter', repeat: true })
    expect(onConfirm).not.toHaveBeenCalled() // a held key's repeat never confirms
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledOnce()
  })
  it('without onConfirm it never catches taps (no button)', () => {
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="Hi" />)
    expect(screen.queryByRole('button', { hidden: true })).toBeNull()
    expect(document.querySelector('.kit-talk')!.hasAttribute('data-confirm')).toBe(false)
  })
  it('reads its numbers live: a changed value in the same object takes effect without a re-render (Dev Kit edits)', () => {
    const live = { typeSpeed: 1 } // content/tuning/talk.json, as the Dev Kit hands it over (one object, edited in place)
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="abcdefghijklmnopqrstuvwxyz" feel={live} />)
    frames(60)
    const slow = typed()!.length
    expect(slow).toBeLessThanOrEqual(2)
    live.typeSpeed = 60 // (the gap already started — up to 1 s at 1 a second — finishes first)
    frames(90)
    expect(typed()!.length).toBeGreaterThan(slow + 15)
  })
  it('a new line starts over (grow, then type)', () => {
    const { rerender } = render(<TalkingBubble target={{ x: 50, y: 50 }} text="First line." />)
    frames(120)
    rerender(<TalkingBubble target={{ x: 50, y: 50 }} text="Second." />)
    frames(1)
    expect(typed()).toBe('')
    expect(rest()).toBe('Second.')
  })

  // 0.32.0 (F116, the sprint 29 review's minors)
  const region = () => liveRegion()
  it('says each line through the page\'s ONE lasting live region: no region of its own, the same element\'s text changes', () => {
    const before = region()
    const { rerender, unmount } = render(<TalkingBubble target={{ x: 50, y: 50 }} text="Found some scraps." speaker="The Veteran" />)
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1)
    expect(before.textContent).toBe('The Veteran: Found some scraps.')
    frames(60)
    expect(before.textContent).toBe('The Veteran: Found some scraps.') // once — never letter by letter
    rerender(<TalkingBubble target={{ x: 50, y: 50 }} text="Bad wire." speaker="The Veteran" />)
    expect(before.textContent).toBe('The Veteran: Bad wire.')
    unmount()
    expect(region()).toBe(before)
    expect(before.isConnected).toBe(true)
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="Oh! Hi!" />) // a new bubble: the same region
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1)
    expect(before.textContent).toBe('Oh! Hi!')
  })
  it('a line said twice (a new lineId, the same words) restarts — typed again, said again, onTyped again', () => {
    const onTyped = vi.fn()
    const { rerender } = render(<TalkingBubble target={{ x: 50, y: 50 }} text="Hold on." lineId={1} onTyped={onTyped} />)
    frames(120)
    expect(typed()).toBe('Hold on.')
    expect(onTyped).toHaveBeenCalledTimes(1)
    const said = region().textContent
    rerender(<TalkingBubble target={{ x: 50, y: 50 }} text="Hold on." lineId={1} onTyped={onTyped} />) // the same line re-rendered
    frames(1)
    expect(typed()).toBe('Hold on.')
    expect(region().textContent).toBe(said)
    rerender(<TalkingBubble target={{ x: 50, y: 50 }} text="Hold on." lineId={2} onTyped={onTyped} />) // said again
    frames(1)
    expect(typed()).toBe('')
    expect(rest()).toBe('Hold on.')
    expect(region().textContent).not.toBe(said) // changed, so a screen reader says it again
    expect(region().textContent!.trim()).toBe('Hold on.')
    frames(120)
    expect(onTyped).toHaveBeenCalledTimes(2)
  })
  it('a confirmable bubble takes the keyboard focus when it appears (a frame later) and gives it back when it goes', () => {
    const outside = document.body.appendChild(document.createElement('button'))
    outside.focus()
    const { unmount } = render(<TalkingBubble target={{ x: 50, y: 50 }} text="Glad you're not goop yet." onConfirm={() => {}} />)
    frames(1)
    const bubble = screen.getByRole('button', { name: 'Next', hidden: true })
    expect(document.activeElement).toBe(bubble)
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' }) // Enter goes straight to it: the whole line shows
    frames(1)
    expect(typed()).toBe("Glad you're not goop yet.")
    unmount()
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })
  it.each([
    ['a text box', () => document.createElement('input')],
    ['a textarea', () => document.createElement('textarea')],
    ['a select', () => document.createElement('select')],
    ['an editable', () => { const el = document.createElement('div'); el.contentEditable = 'true'; el.tabIndex = 0; Object.defineProperty(el, 'isContentEditable', { value: true }); return el }],
  ])('…but never out of %s the player is typing in', (_, make) => {
    const field = document.body.appendChild(make())
    field.focus()
    expect(document.activeElement).toBe(field)
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="Psst." onConfirm={() => {}} />)
    frames(2)
    expect(document.activeElement).toBe(field)
    field.remove()
  })
  it('a bubble that is not a button never takes the focus', () => {
    const outside = document.body.appendChild(document.createElement('button'))
    outside.focus()
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="Hi" />)
    frames(2)
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })
  it('a bad talk.json still talks: null / words / out-of-range values fall back or are pulled in, every frame', () => {
    const live: Record<string, unknown> = { typeSpeed: null, variability: 5, waveStart: 'x', spikeGap: 0 }
    render(<TalkingBubble target={{ x: 50, y: 50 }} text="abcdefghijklmnopqrstuvwxyz" feel={live} />)
    frames(60) // 1 s at the default 22 a second (null → the default), after the grow
    expect(typed()!.length).toBeGreaterThan(5)
    live.typeSpeed = -10 // pulled up to 1 a second: still types, never stalls or runs wild
    frames(120)
    expect(typed()!.length).toBeLessThan(26)
  })

  // 0.33.0 (F121): the game's own colours — Goops' Veteran is a light bubble with dark words
  describe('colours', () => {
    const paper = { fill: '#f4f4f2', ink: '#222', outline: '#555', outlineWidth: 1.6, more: '#888' } // sketch S9
    const bubble = () => document.querySelector<HTMLElement>('.kit-talk')!
    const vars = () => Object.fromEntries(['--kit-talk-fill', '--kit-talk-ink', '--kit-talk-outline', '--kit-talk-outline-width', '--kit-talk-more']
      .map((n) => [n, bubble().style.getPropertyValue(n)]).filter(([, v]) => v))
    // The style's own colours, as the page has them (neon: light words on a dark bubble)
    beforeEach(() => { document.documentElement.style.setProperty('--surface', '#0c1424'); document.documentElement.style.setProperty('--on-surface', '#dff8ff') })
    afterEach(() => { document.documentElement.removeAttribute('style') })

    it('unset = today: no colours (or null, or {}) writes nothing — the same element, attribute for attribute', () => {
      const html = (colours?: Record<string, unknown> | null) => {
        const { unmount } = render(<TalkingBubble target={{ x: 50, y: 50 }} text="Hi there." colours={colours} />)
        frames(30)
        const out = document.querySelector('.kit-talk-layer')!.outerHTML
        unmount()
        return out
      }
      const today = html()
      expect(today).not.toContain('--kit-talk-fill')
      expect(html(null)).toBe(today)
      expect(html({})).toBe(today) // (each colour not set falls back to exactly the style's: blocksCss.test.mjs)
    })
    it('the paper colours paint the bubble: fill, words, outline, its width (rem: grows with the text), the ▼', () => {
      render(<TalkingBubble target={{ x: 50, y: 50 }} text="Found some scraps." colours={paper} onConfirm={() => {}} />)
      frames(2)
      expect(vars()).toEqual({ '--kit-talk-fill': '#f4f4f2', '--kit-talk-ink': '#222', '--kit-talk-outline': '#555',
        '--kit-talk-outline-width': '0.1rem', '--kit-talk-more': '#888' })
    })
    it('reads them live: a changed value in the same object applies without a re-render (Dev Kit edits)', () => {
      const live: Record<string, unknown> = { ...paper }
      render(<TalkingBubble target={{ x: 50, y: 50 }} text="Found some scraps." colours={live} />)
      frames(2)
      live.fill = '#fffbe6'; live.outlineWidth = 3
      frames(1)
      expect(vars()['--kit-talk-fill']).toBe('#fffbe6')
      expect(vars()['--kit-talk-outline-width']).toBe('0.1875rem')
      delete live.more // taken out → the style's again
      frames(1)
      expect(vars()['--kit-talk-more']).toBeUndefined()
    })
    it('bad strings are ignored (the style colour instead), and each is said once in dev', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const bad = { fill: '#f4f4f2', ink: '#222', outline: 'red; display: none', more: 42, outlineWidth: '3px' }
      render(<TalkingBubble target={{ x: 50, y: 50 }} text="Hi." colours={bad} />)
      frames(10)
      expect(vars()).toEqual({ '--kit-talk-fill': '#f4f4f2', '--kit-talk-ink': '#222' })
      expect(warn).toHaveBeenCalledTimes(3) // outline, more, outlineWidth — once each, not every frame
      expect(String(warn.mock.calls[0][0])).toContain('colours.outline')
    })
    it('low contrast: ink under 4.5 : 1 on the fill → the style text colour (a dev warning, once)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      render(<TalkingBubble target={{ x: 50, y: 50 }} text="Hi." colours={{ fill: '#1a1a1a', ink: '#333' }} />)
      frames(10)
      expect(vars()).toEqual({ '--kit-talk-fill': '#1a1a1a' }) // the style's light words read on it
      expect(warn).toHaveBeenCalledOnce()
      expect(String(warn.mock.calls[0][0])).toContain('colours.ink #333 on #1a1a1a is under 4.5 : 1')
    })
    it('outlineWidth is a number pulled into 0–8', () => {
      const { rerender } = render(<TalkingBubble target={{ x: 50, y: 50 }} text="Hi." colours={{ outlineWidth: 40 }} />)
      frames(1)
      expect(vars()['--kit-talk-outline-width']).toBe('0.5rem') // 8 px
      rerender(<TalkingBubble target={{ x: 50, y: 50 }} text="Hi." colours={{ outlineWidth: -3 }} />)
      frames(1)
      expect(vars()['--kit-talk-outline-width']).toBe('0rem')
    })
    it('works with outline "plain" too, and the words stay body size', () => {
      render(<TalkingBubble target={{ x: 50, y: 50 }} text="Hi." outline="plain" colours={paper} />)
      frames(2)
      expect(vars()['--kit-talk-fill']).toBe('#f4f4f2')
      expect(document.querySelector('.kit-talk-typed')!.closest('.kit-text')!.getAttribute('data-kind')).toBe('body')
    })
  })
})

describe('talkColours (the parsing and the contrast floor)', () => {
  const neon = { fill: '#0c1424', ink: '#dff8ff' }
  it('reads hex, rgb() and hsl() (commas or spaces, with alpha); anything else is no colour', () => {
    for (const ok of ['#222', '#f4f4f2', '#f4f4f2cc', 'rgb(34, 34, 34)', 'rgb(34 34 34 / 50%)', 'rgba(0,0,0,0.5)', 'hsl(60 7% 95%)', 'hsl(0, 0%, 13%)']) expect(isColour(ok), ok).toBe(true)
    for (const bad of ['', 'red; x: y', '#12', '#ggg', 'rgb(1,2)', 'url(x)', 'var(--surface)', '12', 12, null, {}, '#fff}']) expect(isColour(bad), String(bad)).toBe(false)
    expect(colourRgb('#222')).toEqual([34, 34, 34])
    expect(colourRgb('hsl(0 0% 100%)')!.map(Math.round)).toEqual([255, 255, 255])
  })
  it('contrast: black on white is 21 : 1; paper ink on paper fill passes the floor', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#222', '#f4f4f2')!).toBeGreaterThan(TALK_MIN_CONTRAST)
  })
  it('a light fill the style light words cannot read on, with no ink of its own → the style fill too (never unreadable)', () => {
    const { colours, problems } = talkColours({ fill: '#f4f4f2', outline: '#555' }, neon)
    expect(colours).toEqual({ outline: '#555' })
    expect(problems[0]).toContain('colours.fill')
  })
  it('nothing given → nothing, no problems', () => {
    expect(talkColours(undefined, neon)).toEqual({ colours: {}, problems: [] })
    expect(talkColours('paper', neon)).toEqual({ colours: {}, problems: [] })
  })
})

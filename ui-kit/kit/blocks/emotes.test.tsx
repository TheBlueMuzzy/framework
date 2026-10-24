// Emotes parts (0.28.0): the bubble shows its words to sight only (screen readers get LiveAnnouncer), is sized by every
// phrase, fades after showMs and says it's done; the picker sends, closes on Escape / a tap outside, and holds back
// while cooling; the mute menu flips; the announcer speaks at most once a second.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { announce, EmotePicker, LiveAnnouncer, liveRegion, MuteMenu, MutedMark, SpeechBubble } from './emotes'

afterEach(() => { cleanup(); vi.useRealTimers() })
const phrases = [{ id: 'hello', label: 'Hello!' }, { id: 'wellPlayed', label: 'Well played!' }, { id: 'wow', label: 'Wow!' }]

describe('SpeechBubble', () => {
  it('holds every phrase (unseen) so its size is the longest one\'s; hidden from screen readers', () => {
    render(<SpeechBubble target={{ x: 50, y: 50 }} text="Wow!" sizeTo={phrases.map((p) => p.label)} showMs={2500} />)
    const layer = document.querySelector('.kit-speech-layer')!
    expect(layer.getAttribute('aria-hidden')).toBe('true')
    expect([...layer.querySelectorAll('.kit-speech-sizer')].map((s) => s.textContent)).toEqual(['Hello!', 'Well played!', 'Wow!'])
    expect(layer.querySelector('.kit-speech-text')!.textContent).toBe('Wow!')
    expect(layer.querySelector('.kit-callout.kit-speech .kit-callout-tip')).toBeTruthy() // a Callout underneath
  })
  it('fades after showMs (data-leaving), then calls onDone once the quick fade is over', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<SpeechBubble target={{ x: 50, y: 50 }} text="Hello!" showMs={2500} onDone={onDone} />)
    const layer = document.querySelector('.kit-speech-layer')!
    act(() => { vi.advanceTimersByTime(2499) })
    expect(layer.hasAttribute('data-leaving')).toBe(false)
    act(() => { vi.advanceTimersByTime(1) })
    expect(layer.hasAttribute('data-leaving')).toBe(true)
    expect(onDone).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(500) })
    expect(onDone).toHaveBeenCalledOnce()
  })
})

describe('EmotePicker', () => {
  it('a button per phrase (named by its words); a pick sends its id', () => {
    const onPick = vi.fn()
    render(<EmotePicker anchor={{ x: 10, y: 10 }} phrases={phrases} onPick={onPick} onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Emotes', hidden: true })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Well played!', hidden: true }))
    expect(onPick).toHaveBeenCalledWith('wellPlayed')
  })
  it('cooling: the buttons are dimmed (aria-disabled), a press sends nothing, and the ring is there', () => {
    const onPick = vi.fn()
    render(<EmotePicker anchor={{ x: 10, y: 10 }} phrases={phrases} onPick={onPick} onClose={() => {}} readyIn={1800} />)
    const button = screen.getByRole('button', { name: 'Hello!', hidden: true })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(button)
    expect(onPick).not.toHaveBeenCalled()
    expect(document.querySelector('.kit-emote-ring')).toBeTruthy()
    expect((document.querySelector('.kit-emote-grid') as HTMLElement).style.getPropertyValue('--kit-emote-wait')).toBe('1800ms')
  })
  it('Escape or a tap outside closes it; a tap inside doesn\'t', () => {
    const onClose = vi.fn()
    render(<EmotePicker anchor={{ x: 10, y: 10 }} phrases={phrases} onPick={() => {}} onClose={onClose} />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Wow!', hidden: true }))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.pointerDown(document.body)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
  it('the focus goes in on open and back to what opened it on close (F109 review: it dropped to <body>)', () => {
    function Host() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Ada</button>
          {open && <EmotePicker anchor={{ x: 10, y: 10 }} phrases={phrases} onPick={() => {}} onClose={() => setOpen(false)} />}
        </>
      )
    }
    render(<Host />)
    const seat = screen.getByRole('button', { name: 'Ada' })
    seat.focus()
    fireEvent.click(seat)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Hello!', hidden: true }))
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { hidden: true })).toBeNull()
    expect(document.activeElement).toBe(seat)
  })
})

describe('MuteMenu + MutedMark', () => {
  it('one button: Mute emotes → onToggle(true) and closes; muted → Unmute emotes', () => {
    const onToggle = vi.fn(), onClose = vi.fn()
    const { rerender } = render(<MuteMenu anchor={{ x: 10, y: 10 }} name="Ada" muted={false} onToggle={onToggle} onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Ada', hidden: true })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Mute emotes', hidden: true }))
    expect(onToggle).toHaveBeenCalledWith(true)
    expect(onClose).toHaveBeenCalledOnce()
    rerender(<MuteMenu anchor={{ x: 10, y: 10 }} name="Ada" muted onToggle={onToggle} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Unmute emotes', hidden: true }))
    expect(onToggle).toHaveBeenLastCalledWith(false)
  })
  it('the mark is read out (never colour alone)', () => {
    render(<MutedMark />)
    expect(screen.getByRole('img', { name: 'Emotes muted' })).toBeTruthy()
  })
})

// The page's one live region (0.32.0, F116): made once, before its first line, and only its text changes after
describe('the live region (announce)', () => {
  const statuses = () => document.querySelectorAll('[role="status"]')
  beforeAll(async () => { liveRegion(); await new Promise((done) => setTimeout(done, 150)) }) // past its first moment

  it('a new page: the region goes on the page EMPTY, and its first line arrives a moment later (never made with it)', () => {
    vi.useFakeTimers()
    const page = document.implementation.createHTMLDocument('fresh')
    announce('Ada: Hello!', page)
    const region = page.querySelector('[role="status"]')!
    expect([region.getAttribute('aria-live'), region.getAttribute('aria-atomic'), region.parentElement]).toEqual(['polite', 'true', page.body])
    expect(region.textContent).toBe('')
    announce('Bo: Wow!', page) // still waiting: the newest line is the one said
    vi.advanceTimersByTime(100)
    expect(region.textContent).toBe('Bo: Wow!')
  })
  it('one region for the whole page, lasting: parts come and go, the same element just changes its text', () => {
    const region = liveRegion()
    const first = render(<LiveAnnouncer text="Ada: Hello!" stamp={1} />)
    expect(region.textContent).toBe('Ada: Hello!')
    first.unmount()
    expect(region.isConnected).toBe(true)
    render(<LiveAnnouncer text="Bo: Wow!" stamp={2} />)
    render(<LiveAnnouncer text="Cy: Oops!" stamp={3} />)
    expect(statuses()).toHaveLength(1)
    expect(statuses()[0]).toBe(region)
    expect(region.textContent).toBe('Cy: Oops!')
  })
  it('the same line twice is said twice: the text still changes (a trailing no-break space toggles)', () => {
    const region = liveRegion()
    announce('Ada: Well played!')
    const once = region.textContent
    announce('Ada: Well played!')
    const twice = region.textContent
    announce('Ada: Well played!')
    expect(new Set([once, twice, region.textContent]).size).toBe(2)
    expect([once, twice, region.textContent].map((t) => t!.trim())).toEqual(Array(3).fill('Ada: Well played!'))
  })
  it('nothing to say: nothing changes', () => {
    announce('Ada: Hi!')
    announce('')
    expect(liveRegion().textContent).toBe('Ada: Hi!')
  })
  it('a region taken off the page (a game clearing <body>) is made again on the next line', () => {
    liveRegion().remove()
    vi.useFakeTimers()
    announce('Back again')
    vi.advanceTimersByTime(100)
    expect(statuses()).toHaveLength(1)
    expect(liveRegion().textContent).toBe('Back again')
  })
})

describe('LiveAnnouncer', () => {
  beforeAll(async () => { liveRegion(); await new Promise((done) => setTimeout(done, 150)) })
  it('says each new line once, at most one a second (the rest skipped)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    const { rerender } = render(<LiveAnnouncer text="Ada: Hello!" stamp={1} />)
    const region = screen.getByRole('status')
    expect(region.textContent).toBe('Ada: Hello!')
    vi.setSystemTime(10_400)
    rerender(<LiveAnnouncer text="Bo: Wow!" stamp={2} />)
    expect(region.textContent).toBe('Ada: Hello!') // too soon: skipped
    vi.setSystemTime(11_100)
    rerender(<LiveAnnouncer text="Bo: Oops!" stamp={3} />)
    expect(region.textContent).toBe('Bo: Oops!')
  })
})

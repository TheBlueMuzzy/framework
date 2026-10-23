// @vitest-environment jsdom
// The glue on a page: a sent emote shows in its seat's bubble (one per seat, replaced in place), a muted seat's never
// does, a bot's say() uses the same bubble, and the picker holds back past the spam limit.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmotes } from '../emotes'
import { EmoteBubbles, EmoteMenu, EmoteSeats } from './EmoteLayer'
import template from '../../templates/content/emotes.json'
import words from '../../templates/content/words.json'

afterEach(() => { cleanup(); vi.useRealTimers() })
const make = () => createEmotes({ settings: template, words: words.emotes, banter: { bully: { won: 'Too easy.' } }, mine: ['me'], warn: () => {} })
const bubbles = () => [...document.querySelectorAll('.kit-speech-text')].map((el) => el.textContent)

describe('EmoteBubbles', () => {
  it('a sent emote shows in a bubble; the same seat again replaces it; a bot\'s say() uses the same bubble', () => {
    const emotes = make()
    render(<EmoteBubbles emotes={emotes} targetFor={() => ({ x: 20, y: 20 })} nameFor={(s) => (s === 'me' ? 'Ada' : 'Bot')} />)
    act(() => { emotes.sendEmote('me', 'hello') })
    expect(bubbles()).toEqual(['Hello!'])
    expect(screen.getByRole('status').textContent).toBe('Ada: Hello!')
    act(() => { emotes.receive({ seat: 'me', id: 'wow' }) })
    expect(bubbles()).toEqual(['Wow!']) // in place, not stacked
    act(() => { emotes.say('bot', 'banter.bully.won') })
    expect(bubbles()).toEqual(['Wow!', 'Too easy.'])
    expect(document.querySelectorAll('.kit-speech').length).toBe(2)
  })
  it('a muted seat never gets a bubble; it goes once faded', () => {
    vi.useFakeTimers()
    const emotes = make()
    emotes.mute('ada', true)
    render(<EmoteBubbles emotes={emotes} targetFor={() => ({ x: 20, y: 20 })} />)
    act(() => { emotes.receive({ seat: 'ada', id: 'oops' }) })
    expect(bubbles()).toEqual([])
    act(() => { emotes.receive({ seat: 'bo', id: 'oops' }) })
    expect(bubbles()).toEqual(['Oops!'])
    act(() => { vi.advanceTimersByTime(2500 + 1000) })
    expect(bubbles()).toEqual([])
  })
})

describe('EmoteMenu', () => {
  it('my seat → the picker: a pick sends and closes; past the limit the buttons dim', () => {
    const emotes = make()
    const onClose = vi.fn()
    const seen: string[] = []
    emotes.onEmote((e) => seen.push(e.id))
    const { unmount } = render(<EmoteMenu emotes={emotes} seat="me" mine anchor={{ x: 10, y: 10 }} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Thanks!', hidden: true }))
    expect(seen).toEqual(['thanks'])
    expect(onClose).toHaveBeenCalledOnce()
    unmount()
    render(<EmoteMenu emotes={emotes} seat="me" mine anchor={{ x: 10, y: 10 }} onClose={onClose} />)
    expect(screen.getByRole('button', { name: 'Wow!', hidden: true }).getAttribute('aria-disabled')).toBe('true') // minGapMs
  })
  it('an opponent\'s seat → Mute emotes; then their emotes stop', () => {
    const emotes = make()
    render(<EmoteMenu emotes={emotes} seat="bo" mine={false} name="Bo" anchor={{ x: 10, y: 10 }} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mute emotes', hidden: true }))
    expect(emotes.isMuted('bo')).toBe(true)
    expect(screen.getByRole('button', { name: 'Unmute emotes', hidden: true })).toBeTruthy()
  })
})

describe('EmoteSeats (0.3.0, F109: the seat row in one line)', () => {
  const seats = [{ id: 'me', name: 'Ada' }, { id: 'bo', name: 'Bo' }]
  it('every seat is a button named for screen readers, tagged for check:framework; the words can be swapped', () => {
    const emotes = make()
    const { rerender } = render(<EmoteSeats emotes={emotes} seats={seats} mine="me" />)
    const mine = screen.getByRole('button', { name: 'Ada — send an emote' })
    const rival = screen.getByRole('button', { name: 'Bo — mute or unmute' })
    expect(mine.getAttribute('data-emote-seat')).toBe('me')
    expect(mine.hasAttribute('data-emote-mine')).toBe(true)
    expect(rival.hasAttribute('data-emote-mine')).toBe(false)
    expect(rival.getAttribute('aria-expanded')).toBe('false')
    rerender(<EmoteSeats emotes={emotes} seats={seats} mine={['me']} words={{ mine: '{name}: dire quelque chose' }} />)
    expect(screen.getByRole('button', { name: 'Ada: dire quelque chose' })).toBeTruthy()
  })
  it('tap mine → the picker → a pick shows in my bubble (said once: "Ada: Thanks!")', () => {
    const emotes = make()
    render(<EmoteSeats emotes={emotes} seats={seats} mine="me" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ada — send an emote' }))
    expect(screen.getByRole('dialog', { name: 'Emotes', hidden: true })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ada — send an emote' }).getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Thanks!', hidden: true }))
    expect(screen.queryByRole('dialog', { hidden: true })).toBeNull() // closeAfterSend
    expect(bubbles()).toEqual(['Thanks!'])
    expect(screen.getByRole('status').textContent).toBe('Ada: Thanks!')
  })
  it('tap a rival → Mute → the muted mark on their portrait, and their next emote never shows; tap again closes', () => {
    const emotes = make()
    render(<EmoteSeats emotes={emotes} seats={seats} mine="me" />)
    const rival = () => screen.getByRole('button', { name: 'Bo — mute or unmute' })
    expect(screen.queryByRole('img', { name: 'Emotes muted' })).toBeNull()
    fireEvent.click(rival())
    expect(screen.getByRole('dialog', { name: 'Bo', hidden: true })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Mute emotes', hidden: true }))
    expect(emotes.isMuted('bo')).toBe(true)
    const mark = screen.getByRole('img', { name: 'Emotes muted' })
    expect(rival().contains(mark)).toBe(true)
    expect(mark.closest('.kit-seat-badge')).toBeTruthy()
    act(() => { emotes.receive({ seat: 'bo', id: 'wow' }) })
    expect(bubbles()).toEqual([])
    fireEvent.click(rival())
    expect(screen.getByRole('dialog', { name: 'Bo', hidden: true })).toBeTruthy()
    fireEvent.click(rival()) // the seat's own toggle
    expect(screen.queryByRole('dialog', { hidden: true })).toBeNull()
  })
  it('a seat id with a quote still finds its seat', () => {
    const emotes = createEmotes({ settings: template, words: words.emotes, mine: ['a"b'], warn: () => {} })
    render(<EmoteSeats emotes={emotes} seats={[{ id: 'a"b', name: 'Ada' }]} mine={'a"b'} />)
    act(() => { emotes.sendEmote('a"b', 'hello') })
    expect(bubbles()).toEqual(['Hello!'])
    expect(document.querySelector('[data-emote-seat="a\\"b"]')).toBeTruthy()
  })
})

// The long fake language (F91): the transform's promises, and the page pass that applies it to what's on screen.
import { afterEach, describe, expect, it } from 'vitest'
import { fill, isPseudo, pseudo, PSEUDO_GROWTH } from './blocks/words'
import { startPseudoPage } from './pseudoPage'
import { render } from '@testing-library/react'
import { PlayerChip, PlayerSeats } from './blocks/hud'

const letters = (text: string) => [...text].filter((ch) => /\p{L}/u.test(ch)).length

describe('pseudo', () => {
  it('accents every letter, brackets the text, keeps {slots}', () => {
    const out = pseudo('Round {n} of {total}')
    expect(out.startsWith('[') && out.endsWith(']')).toBe(true)
    expect(out).toContain('{n}')
    expect(out).toContain('{total}')
    expect(out.replace(/\{\w+\}/g, '')).not.toMatch(/[a-z]{2}/) // no plain English left outside the slots
    expect(fill(out, { n: 2, total: 5 })).toMatch(/2.*5/)
  })
  it('every word grows by about 40%, with no new spaces', () => {
    for (const text of ['Play', 'Settings', 'Waiting for the other player', 'OK']) {
      const out = pseudo(text)
      expect(out.split(' ').length).toBe(text.split(' ').length)
      expect(letters(out)).toBeGreaterThanOrEqual(Math.floor(letters(text) * (1 + PSEUDO_GROWTH)))
    }
  })
  it('leaves text without letters alone, and never does it twice', () => {
    expect(pseudo(' · 3/5 ')).toBe(' · 3/5 ')
    const once = pseudo('Your turn')
    expect(isPseudo(once)).toBe(true)
    expect(pseudo(once)).toBe(once)
  })
  it('a piece of fake-language text carrying one of its marker letters is never rewritten again', () => {
    const word = pseudo('Undo') // '[Ûñðöûñ]'
    for (const piece of [word.slice(2, 5), word.slice(3), 'ð']) expect(pseudo(piece)).toBe(piece)
  })
  it('a real word with an accent (ö, é) is still rewritten', () => {
    for (const word of ['Spieleinstellungsmöglichkeiten', 'Café']) expect(isPseudo(pseudo(word)) && pseudo(word) !== word).toBe(true)
  })
  it('keeps the spaces round the words (JSX text keeps its gaps)', () => {
    expect(pseudo(' Your turn ')).toMatch(/^ \[.*\] $/)
  })
})

describe('startPseudoPage', () => {
  let stop: (() => void) | null = null
  afterEach(() => { stop?.(); stop = null; document.body.innerHTML = '' })

  it('rewrites the words on the page and their screen-reader / tooltip words, not the Dev Kit', () => {
    document.body.innerHTML = '<main><p>Your turn</p><button aria-label="Close" title="Close it">×</button></main><aside data-devkit="1"><p>Tuning</p></aside>'
    stop = startPseudoPage()
    expect(isPseudo(document.querySelector('main p')!.textContent!)).toBe(true)
    expect(isPseudo(document.querySelector('button')!.getAttribute('aria-label')!)).toBe(true)
    expect(isPseudo(document.querySelector('button')!.getAttribute('title')!)).toBe(true)
    expect(document.querySelector('aside p')!.textContent).toBe('Tuning')
    expect(document.documentElement.hasAttribute('data-pseudo')).toBe(true)
  })
  it('never rewrites what says translate="no" — a name, initials, a room code (F156: "SM" spilled out of its circle)', () => {
    document.body.innerHTML = '<p>Room <span translate="no">QX2T</span></p><span translate="no" role="img" aria-label="Sherman Meredith">SM</span>'
    stop = startPseudoPage()
    expect(document.querySelector('p span')!.textContent).toBe('QX2T')
    expect(document.querySelector('[role="img"]')!.textContent).toBe('SM')
    expect(document.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Sherman Meredith')
    expect(isPseudo(document.querySelector('p')!.firstChild!.textContent!)).toBe(true) // "Room" itself is a word
  })
  // F161: the chip and the seat button are named after the player (aria-label), but hold words that ARE translated
  // (a score, a badge), so they can't be translate="no" themselves — the name drawn inside them is, and that marks it
  it("keeps a player's name as written in a label too — a PlayerChip, a seat button, Remove Ana (F161)", async () => {
    const view = render(
      <>
        <PlayerChip name="Ana" score={3} />
        <PlayerSeats players={[{ id: 'b', name: 'Sherman Meredith', tapLabel: 'Wave at Sherman Meredith' }, { id: 'c', name: 'Bo' }]} onSeatTap={() => {}} />
        <button aria-label="Remove Ana">x</button>
      </>,
    )
    stop = startPseudoPage()
    const chip = view.container.querySelector('.kit-player-chip')!
    expect(chip.getAttribute('aria-label')).toBe('Ana')
    expect(isPseudo(chip.querySelector('.kit-player-chip-score')!.getAttribute('aria-label')!)).toBe(true) // "3 points" is words
    const [wave, bo] = view.container.querySelectorAll('.kit-seat-button')
    expect(bo.getAttribute('aria-label')).toBe('Bo')
    expect(wave.getAttribute('aria-label')).toContain('Sherman Meredith')
    expect(isPseudo(wave.getAttribute('aria-label')!)).toBe(true) // "Wave at" is still rewritten
    const remove = view.container.querySelector('button[aria-label$="Ana]"]')!
    expect(remove.getAttribute('aria-label')).toMatch(/^\[\S+ Ana\]$/)
    // …and a chip that arrives after the pass started (React mounting it later)
    const later = render(<PlayerChip name="Zed" />)
    await new Promise((done) => queueMicrotask(() => done(null)))
    expect(later.container.querySelector('.kit-player-chip')!.getAttribute('aria-label')).toBe('Zed')
    view.unmount(); later.unmount()
  })
  it('keeps rewriting as the game changes its words', async () => {
    document.body.innerHTML = '<p id="w">Your turn</p>'
    stop = startPseudoPage()
    const p = document.getElementById('w')!
    p.firstChild!.textContent = 'Game over' // what React does when a word changes
    p.append(document.createElement('span'))
    p.lastElementChild!.textContent = 'Rematch'
    await new Promise((done) => queueMicrotask(() => done(null))) // MutationObserver reports after this task
    expect(isPseudo(p.firstChild!.textContent!)).toBe(true)
    expect(isPseudo(p.lastElementChild!.textContent!)).toBe(true)
  })
  it('never rewrites its own writes — a word with no accented letters (日本語) stays one bracketed word', async () => {
    document.body.innerHTML = '<p id="w">日本語</p><button aria-label="日本語">x</button>'
    stop = startPseudoPage()
    for (let i = 0; i < 3; i++) await new Promise((done) => queueMicrotask(() => done(null))) // let its own writes come back
    const once = pseudo('日本語')
    expect(document.getElementById('w')!.textContent).toBe(once)
    expect(document.querySelector('button')!.getAttribute('aria-label')).toBe(once)
    expect(pseudo(once)).toBe(once)
  })
  it('stop() leaves the words as they are and stops rewriting', async () => {
    document.body.innerHTML = '<p id="w">Your turn</p>'
    startPseudoPage()()
    const p = document.getElementById('w')!
    p.textContent = 'Game over'
    await new Promise((done) => queueMicrotask(() => done(null)))
    expect(p.textContent).toBe('Game over')
    expect(document.documentElement.hasAttribute('data-pseudo')).toBe(false)
  })
})

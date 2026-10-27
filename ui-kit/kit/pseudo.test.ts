// The long fake language (F91): the transform's promises, and the page pass that applies it to what's on screen.
import { afterEach, describe, expect, it } from 'vitest'
import { fill, isPseudo, pseudo, PSEUDO_GROWTH } from './blocks/words'
import { startPseudoPage } from './pseudoPage'

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

// Words per control type (F198 task 4): a line written as { keys, mouse, phone } gives the right one for how the
// player plays. Cases from Goops' lessonWords tests (tests/lessons/lessonWords.test.ts), without Goops' text.
import { describe, expect, it } from 'vitest'
import { lessonLine, watchControls, wordsFor, type ControlWords } from './controlWords'

const book: Record<string, Record<string, ControlWords>> = {
  laser: { broke: { keys: 'Press L twice.', mouse: 'Two clicks on the laser.', phone: 'Two taps on the laser.' } },
  visor: { fixButton: { keys: 'Press the lit key.', mouse: 'Press the lit button.', phone: 'Tap the lit button.' }, plain: 'The same for all.' },
  shared: { toConsole: { keys: 'W or ↑ for the console.', mouse: 'Click the console.', phone: 'Flick up for the console.' } },
}

describe('words per control type', () => {
  it('a phone gets the phone line, a mouse the mouse line, keys the keys line', () => {
    expect(lessonLine(book, 'laser', 'broke', 'phone')).toBe('Two taps on the laser.')
    expect(lessonLine(book, 'laser', 'broke', 'mouse')).toBe('Two clicks on the laser.')
    expect(lessonLine(book, 'laser', 'broke', 'keys')).toBe('Press L twice.')
    expect(lessonLine(book, 'visor', 'fixButton', 'phone')).toBe('Tap the lit button.')
  })

  it('a plain string is for everyone; a shared line serves every lesson; an unknown id shows as it is', () => {
    expect(lessonLine(book, 'visor', 'plain', 'phone')).toBe('The same for all.')
    expect(lessonLine(book, 'visor', 'toConsole', 'phone')).toBe('Flick up for the console.')
    expect(lessonLine(book, 'visor', 'toConsole', 'keys')).toBe('W or ↑ for the console.')
    expect(lessonLine(book, null, 'Drag it here', 'mouse')).toBe('Drag it here')
    expect(lessonLine(undefined, 'laser', 'broke', 'keys')).toBe('broke')
  })

  it('a line written for only some controls falls back keys → mouse → phone', () => {
    expect(wordsFor({ keys: 'k' }, 'phone')).toBe('k')
    expect(wordsFor({ mouse: 'm', phone: 'p' }, 'keys')).toBe('m')
    expect(wordsFor({ phone: 'p' }, 'mouse')).toBe('p')
    expect(wordsFor({}, 'mouse', 'none')).toBe('none')
    expect(wordsFor(undefined, 'keys')).toBe('')
  })

  it('watchControls: the last key / touch / mouse press decides; stop() stops listening', () => {
    const target = new EventTarget()
    const watch = watchControls(target, 'phone')
    expect(watch.kind()).toBe('phone') // before any input: the guess
    target.dispatchEvent(new Event('keydown'))
    expect(watch.kind()).toBe('keys')
    target.dispatchEvent(Object.assign(new Event('pointerdown'), { pointerType: 'mouse' }))
    expect(watch.kind()).toBe('mouse')
    target.dispatchEvent(Object.assign(new Event('pointerdown'), { pointerType: 'touch' }))
    expect(watch.kind()).toBe('phone')
    watch.stop()
    target.dispatchEvent(new Event('keydown'))
    expect(watch.kind()).toBe('phone')
  })
})

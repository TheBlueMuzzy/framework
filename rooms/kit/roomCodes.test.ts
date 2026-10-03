import { describe, expect, it } from 'vitest'
import { CONSONANTS, NEVER_MAKE, VOWELS, cleanRoomCode, isRoomCode, makeRoomCode } from './roomCodes'

describe('room codes', () => {
  it('makes 4-letter consonant–vowel codes', () => {
    for (let i = 0; i < 500; i++) {
      const code = makeRoomCode()
      expect(code).toMatch(/^[A-Z]{4}$/)
      expect(isRoomCode(code)).toBe(true)
      expect(CONSONANTS).toContain(code[0])
      expect(VOWELS).toContain(code[1])
    }
  })

  it('never uses look-alike or awkward letters', () => {
    const letters = new Set(Array.from({ length: 2000 }, () => makeRoomCode()).join(''))
    for (const letter of 'CQWXY') expect(letters.has(letter)).toBe(false)
  })

  it('never hands out a code on the rude list', () => {
    // A "random" that would spell the first rude code, then something fine
    const rude = NEVER_MAKE[0] // DAGO
    const wanted = [rude[0], rude[1], rude[2], rude[3], 'B', 'A', 'K', 'U']
    const picks = wanted.map((letter, i) => {
      const letters = i % 2 === 0 ? CONSONANTS : VOWELS
      return (letters.indexOf(letter) + 0.5) / letters.length
    })
    let n = 0
    expect(makeRoomCode(() => picks[n++])).toBe('BAKU')
  })

  it('reads what a player typed, forgivingly', () => {
    expect(cleanRoomCode('baku')).toBe('BAKU')
    expect(cleanRoomCode(' Ba-Ku ')).toBe('BAKU')
    expect(cleanRoomCode('M0T1')).toBe('MOTI') // zero and one read as O and I
    expect(cleanRoomCode('BAK')).toBeNull()
    expect(cleanRoomCode('BAKUS')).toBeNull()
    expect(cleanRoomCode('ABCD')).toBeNull() // not consonant–vowel
    expect(cleanRoomCode('CAKE')).toBeNull() // C is never used
  })

  it('isRoomCode wants the exact, cleaned code', () => {
    expect(isRoomCode('BAKU')).toBe(true)
    expect(isRoomCode('baku')).toBe(false)
    expect(isRoomCode('')).toBe(false)
  })
})

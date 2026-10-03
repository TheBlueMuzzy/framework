import { describe, expect, it } from 'vitest'
import {
  mustBeList, mustBeListWithoutRepeats, mustBeObject, mustBeOneOf, mustBeText, mustBeTrueOrFalse,
  mustBeWholeNumber, nullOr,
} from './checks'

describe('checks for game actions', () => {
  it('pass good values straight through', () => {
    expect(mustBeObject({ a: 1 }, 'action')).toEqual({ a: 1 })
    expect(mustBeOneOf('turn', ['draft', 'turn'], 'type')).toBe('turn')
    expect(mustBeWholeNumber(3, 0, 7, 'slot')).toBe(3)
    expect(mustBeText('MOSS', 20, 'word')).toBe('MOSS')
    expect(mustBeTrueOrFalse(false, 'ready')).toBe(false)
    expect(mustBeList([1, 2], 8, (n) => mustBeWholeNumber(n, 0, 7, 'slot'), 'slots')).toEqual([1, 2])
    expect(nullOr(null, (v) => mustBeWholeNumber(v, 0, 7, 'seed'))).toBeNull()
    expect(nullOr(2, (v) => mustBeWholeNumber(v, 0, 7, 'seed'))).toBe(2)
  })

  it('throw a plain reason for bad values', () => {
    expect(() => mustBeObject([1], 'action')).toThrow('action must be an object')
    expect(() => mustBeObject(null, 'action')).toThrow('action must be an object')
    expect(() => mustBeOneOf('fly', ['draft', 'turn'], 'type')).toThrow('type must be one of: draft, turn')
    expect(() => mustBeWholeNumber(1.5, 0, 7, 'slot')).toThrow('slot must be a whole number from 0 to 7')
    expect(() => mustBeWholeNumber(8, 0, 7, 'slot')).toThrow()
    expect(() => mustBeWholeNumber('3', 0, 7, 'slot')).toThrow()
    expect(() => mustBeText('x'.repeat(21), 20, 'word')).toThrow('word must be text (at most 20 characters)')
    expect(() => mustBeTrueOrFalse('yes', 'ready')).toThrow('ready must be true or false')
    expect(() => mustBeList('1,2', 8, (n) => n, 'slots')).toThrow('slots must be a list of at most 8')
    expect(() => mustBeList(new Array(9).fill(0), 8, (n) => n, 'slots')).toThrow()
    expect(() => mustBeList([1, 99], 8, (n) => mustBeWholeNumber(n, 0, 7, 'slot'), 'slots')).toThrow('slot must be')
    expect(() => mustBeListWithoutRepeats([1, 1], 8, (n) => mustBeWholeNumber(n, 0, 7, 'slot'), 'slots')).toThrow('slots has the same item twice')
  })
})

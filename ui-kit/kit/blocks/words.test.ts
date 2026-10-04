import { describe, expect, it } from 'vitest'
import { noOrphan } from './words'

const NB = String.fromCharCode(160) // a no-break space

describe('noOrphan', () => {
  it('holds the last two words together, so one word is never alone on the last line', () => {
    expect(noOrphan('cut Yellow from 18 moves to 7')).toBe(`cut Yellow from 18 moves to${NB}7`)
    expect(noOrphan('one')).toBe('one')
    expect(noOrphan('two words ')).toBe(`two${NB}words`)
  })
})

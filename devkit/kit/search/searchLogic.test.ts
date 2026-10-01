// Runs in the framework (not copied into games): how the Dev Kit search matches settings.
import { describe, expect, it } from 'vitest'
import { countFound, filterSections, highlightParts, matchesAll, readableKey, searchTerms, splitWords } from './searchLogic'

describe('splitWords / readableKey', () => {
  it('splits camelCase, dots, dashes and numbers into lower-case words', () => {
    expect(splitWords('trailFade')).toBe('trail fade')
    expect(splitWords('awardPriority.photoFinish')).toBe('award priority photo finish')
    expect(splitWords('on-primary')).toBe('on primary')
    expect(splitWords('awardsFor2')).toBe('awards for 2')
    expect(splitWords('scorePopMinPx')).toBe('score pop min px')
  })
  it('makes a readable label when a file gives none', () => {
    expect(readableKey('trailFade')).toBe('Trail fade')
    expect(readableKey('maxSpeed')).toBe('Max speed')
  })
})

describe('matchesAll — what a typed search finds', () => {
  const t = (q: string, ...texts: string[]) => matchesAll(searchTerms(q), texts)
  it('finds text INSIDE a word, not just at its start, ignoring case', () => {
    expect(t('ade', 'spotlightFade')).toBe(true)
    expect(t('LIGHT', 'spotlightFade')).toBe(true)
    expect(t('fade', 'spotlightHold')).toBe(false)
  })
  it('splits camelCase keys, so "trail fade" finds trailFade (and so does "trailfade")', () => {
    expect(t('trail fade', 'trailFade')).toBe(true)
    expect(t('trailfade', 'trailFade')).toBe(true)
    expect(t('l f', 'trailFade')).toBe(true) // each word is found on its own
  })
  it('several words: every one must be found, in any of the texts', () => {
    expect(t('pop time', 'scorePopTime')).toBe(true)
    expect(t('pop width', 'scorePopTime')).toBe(false)
    expect(t('seconds trail', 'trailHold', 'How long it holds, in seconds.')).toBe(true)
  })
  it('matches the readable label, the help text and the section/file name too', () => {
    expect(t('spotlight time', 'spotlightHold', 'Spotlight: time per word')).toBe(true)
    expect(t('finger', 'dragLift', 'Drag: lift', 'how far above your finger the piece floats')).toBe(true)
    expect(t('anim.json', 'trailHold', 'anim.json')).toBe(true)
  })
  it('empty or spaces-only search matches everything', () => {
    expect(searchTerms('   ')).toEqual([])
    expect(t('  ', 'anything')).toBe(true)
  })
})

describe('highlightParts', () => {
  it('marks every found part, merging neighbours', () => {
    expect(highlightParts('Trail fade', ['fade'])).toEqual([{ text: 'Trail ', hit: false }, { text: 'fade', hit: true }])
    expect(highlightParts('spotlightFade', ['ade', 'light'])).toEqual([
      { text: 'spot', hit: false },
      { text: 'light', hit: true },
      { text: 'F', hit: false },
      { text: 'ade', hit: true },
    ])
    expect(highlightParts('pop pop', ['pop']).filter((p) => p.hit)).toHaveLength(2)
    expect(highlightParts('nothing', [])).toEqual([{ text: 'nothing', hit: false }])
  })
})

describe('filterSections', () => {
  type Item = { key: string; help?: string }
  const sections = [
    { id: 's:Trails', title: 'Trails', items: [{ key: 'trailLead' }, { key: 'trailHold' }] as Item[] },
    { id: 's:Score pops', title: 'Score pops', items: [{ key: 'scorePopTime', help: 'how long a pop takes' }, { key: 'scoreFlyTime' }] as Item[] },
  ]
  const find = (q: string) => filterSections(sections, q, (i: Item) => [i.key, i.help])
  it('keeps matching settings and drops empty sections', () => {
    const found = find('fly')
    expect(found.map((s) => s.title)).toEqual(['Score pops'])
    expect(found[0].items.map((i) => i.key)).toEqual(['scoreFlyTime'])
    expect(countFound(found)).toBe(1)
  })
  it('a section whose TITLE matches keeps all its settings (and says so)', () => {
    const found = find('trails')
    expect(found[0].titleHit).toBe(true)
    expect(found[0].items).toHaveLength(2)
  })
  it('one word in the title and one in the setting still match', () => {
    expect(countFound(find('pops fly'))).toBe(1)
  })
  it('nothing matches: no sections', () => {
    expect(find('zzz')).toEqual([])
  })
})

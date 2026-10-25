// What's new: the "should it show?" rule, one test per rule (design §4c), and the last-seen record.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_WHATS_NEW_LINES, readLastSeen, shortVersion, versionParts, whatsNewDecision, whatsNewProblems,
  whatsNewStorageKey, writeLastSeen } from './whatsNew'

const versions = {
  '0.3.0': ['Old news'],
  '0.4.0': ['Two new boards', 'Faster dice', 'A calmer Settings'],
}

describe('whatsNewDecision — every rule', () => {
  it('first install (no last seen): remembers this version, shows nothing', () => {
    expect(whatsNewDecision('0.4.0.7', null, versions)).toEqual({ entry: null, remember: '0.4.0' })
  })

  it('the same version again: nothing, the record stays', () => {
    expect(whatsNewDecision('0.4.0.7', '0.4.0', versions)).toEqual({ entry: null, remember: null })
  })

  it('a build-only bump (0.4.0.7 → 0.4.0.8) is the same version: nothing', () => {
    expect(whatsNewDecision('v0.4.0.8', '0.4.0', versions)).toEqual({ entry: null, remember: null })
  })

  it('a new version with an entry: shows its lines and remembers the new version', () => {
    expect(whatsNewDecision('0.4.0.1', '0.3.0', versions)).toEqual({
      entry: { version: '0.4.0', lines: versions['0.4.0'] }, remember: '0.4.0',
    })
  })

  it('a new version without an entry (a patch the game chose not to announce): remembers it quietly', () => {
    expect(whatsNewDecision('0.4.1.0', '0.4.0', versions)).toEqual({ entry: null, remember: '0.4.1' })
  })

  it('a skipped release still shows after a hotfix with no entry of its own (0.3.0 → 0.4.1 shows 0.4.0)', () => {
    expect(whatsNewDecision('0.4.1.2', '0.3.0', versions)).toEqual({
      entry: { version: '0.4.0', lines: versions['0.4.0'] }, remember: '0.4.1',
    })
  })

  it('two releases skipped: only the newest one shows (one panel, never a pile)', () => {
    expect(whatsNewDecision('0.4.0', '0.2.0', versions).entry?.version).toBe('0.4.0')
  })

  it('an entry for a version newer than this build (written ahead) waits for its build', () => {
    expect(whatsNewDecision('0.3.5', '0.3.0', { ...versions, '0.5.0': ['Soon'] })).toEqual({ entry: null, remember: '0.3.5' })
  })

  it('"dev" (no version baked in): nothing, and nothing remembered', () => {
    expect(whatsNewDecision('dev', '0.3.0', versions)).toEqual({ entry: null, remember: null })
    expect(whatsNewDecision('dev', null, versions)).toEqual({ entry: null, remember: null })
  })

  it('a downgrade (an older build after a newer one): nothing, the newer record stays', () => {
    expect(whatsNewDecision('0.3.0.4', '0.4.0', versions)).toEqual({ entry: null, remember: null })
  })

  it('a garbled stored value is treated like a first install: remember, show nothing', () => {
    for (const junk of ['', 'banana', '{"seen":"0.3.0"}', '0.3', 42, undefined]) {
      expect(whatsNewDecision('0.4.0', junk, versions)).toEqual({ entry: null, remember: '0.4.0' })
    }
  })

  it('more than 5 lines: only the first 5 show', () => {
    const long = { '0.4.0': ['1', '2', '3', '4', '5', '6', '7'] }
    expect(whatsNewDecision('0.4.0', '0.3.0', long).entry?.lines).toEqual(['1', '2', '3', '4', '5'])
    expect(MAX_WHATS_NEW_LINES).toBe(5)
  })

  it('an empty entry, blank lines or a bad key never show', () => {
    expect(whatsNewDecision('0.4.0', '0.3.0', { '0.4.0': [] }).entry).toBeNull()
    expect(whatsNewDecision('0.4.0', '0.3.0', { '0.4.0': ['', '  '] }).entry).toBeNull()
    expect(whatsNewDecision('0.4.0', '0.3.0', { 'four': ['x'], '0.4.0': 'not a list' as unknown as string[] }).entry).toBeNull()
  })

  it('no versions file at all: just remembers', () => {
    expect(whatsNewDecision('0.4.0', '0.3.0')).toEqual({ entry: null, remember: '0.4.0' })
  })
})

describe('version words', () => {
  it('versionParts reads X.Y.Z with or without the v and the build; nothing else', () => {
    expect(versionParts('0.4.0')).toEqual([0, 4, 0])
    expect(versionParts('v1.12.3.40')).toEqual([1, 12, 3])
    for (const no of ['dev', '', '1.2', '1.2.3.4.5', 'v', null, 3]) expect(versionParts(no)).toBeNull()
  })
  it('compares numbers, not text (0.10.0 is newer than 0.9.0)', () => {
    expect(whatsNewDecision('0.10.0', '0.9.0', { '0.10.0': ['Ten'] }).entry?.version).toBe('0.10.0')
  })
  it('shortVersion: 0.4.0 → "0.4", 0.4.1 → "0.4.1"', () => {
    expect(shortVersion('0.4.0')).toBe('0.4')
    expect(shortVersion('0.4.1')).toBe('0.4.1')
  })
})

describe('whatsNewProblems — the dev-console notes', () => {
  it('names a bad key, a non-list and too many lines; a good file has none', () => {
    expect(whatsNewProblems(versions)).toEqual([])
    const problems = whatsNewProblems({ 'v0.4': ['x'], '0.5.0': 'x' as unknown as string[], '0.6.0': ['1', '2', '3', '4', '5', '6'] })
    expect(problems).toHaveLength(3)
    expect(problems[0]).toMatch(/v0\.4/)
    expect(problems[1]).toMatch(/must be a list/)
    expect(problems[2]).toMatch(/6 lines/)
  })
})

describe('the last-seen record', () => {
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('is one string under kit-whats-new:<game folder>', () => {
    expect(whatsNewStorageKey()).toMatch(/^kit-whats-new(:|$)/)
    writeLastSeen('0.4.0')
    expect(localStorage.getItem(whatsNewStorageKey())).toBe('0.4.0')
    expect(readLastSeen()).toBe('0.4.0')
  })

  it('a browser that refuses storage (a private window): no crash, reads as nothing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => writeLastSeen('0.4.0')).not.toThrow()
    expect(readLastSeen()).toBeNull()
  })
})

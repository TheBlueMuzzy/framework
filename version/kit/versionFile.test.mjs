// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { labelOf, readAppVersion, versionInHtml, versionOf } from './versionFile.mjs'

const dirs = []
const gameWith = (text) => {
  const dir = mkdtempSync(join(tmpdir(), 'version-'))
  dirs.push(dir)
  if (text !== null) writeFileSync(join(dir, 'version.json'), text)
  return dir
}
afterEach(() => { while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true }) })

describe('versionOf / readAppVersion', () => {
  it('version + build → X.Y.Z.B; no build counts as 0', () => {
    expect(versionOf({ version: '0.11.0', build: 7 })).toBe('0.11.0.7')
    expect(versionOf({ version: '1.2.3' })).toBe('1.2.3.0')
  })

  it('VERSION_BUILD overrides the build number (an update test\'s "next release")', () => {
    const game = gameWith('{ "version": "0.11.0", "build": 7 }')
    expect(readAppVersion(game, {})).toBe('0.11.0.7')
    expect(readAppVersion(game, { VERSION_BUILD: '8' })).toBe('0.11.0.8')
    expect(readAppVersion(game, { VERSION_BUILD: '' })).toBe('0.11.0.7') // set but empty = not set
  })

  it('says in plain words what is wrong with the file', () => {
    expect(() => readAppVersion(gameWith(null), {})).toThrow(/version\.json is missing/)
    expect(() => readAppVersion(gameWith('{ nope'), {})).toThrow(/isn't valid JSON/)
    expect(() => versionOf({ version: '1.2', build: 0 })).toThrow(/three numbers like "0\.1\.0"/)
    expect(() => versionOf({ version: '1.2.3', build: -1 })).toThrow(/"build" \(-1\) should be a whole number/)
    expect(() => readAppVersion(gameWith('{ "version": "1.2.3", "build": 1 }'), { VERSION_BUILD: 'x' })).toThrow(/VERSION_BUILD=x should be a whole number/)
  })
})

describe('labelOf / versionInHtml', () => {
  it('one format: vX.Y.Z.B', () => {
    expect(labelOf('0.11.0.7')).toBe('v0.11.0.7')
    expect(labelOf('v0.11.0.7')).toBe('v0.11.0.7')
  })

  it('reads the version a built page carries (either attribute order), or null', () => {
    expect(versionInHtml('<head><meta name="app-version" content="v1.2.3.4"></head>')).toBe('v1.2.3.4')
    expect(versionInHtml("<meta content='v1.2.3.4' name='app-version' />")).toBe('v1.2.3.4')
    expect(versionInHtml('<meta name="viewport" content="width=device-width">')).toBe(null)
  })
})

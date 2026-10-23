// @vitest-environment node
// The module's settings-rows.json (F110): the UI kit's Settings check reads it in the game to know the "Send crash
// reports" row is passed on. Its ids must be this module's rows, and its patterns must match the wiring the README asks for.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readRowManifest, stripComments } from '../../ui-kit/kit/conformance.mjs'
import { CRASH_SETTINGS_ROWS } from './settingsRow.ts'

const text = readFileSync(new URL('./settings-rows.json', import.meta.url), 'utf8')
const manifest = readRowManifest(text, { module: 'crashes' })
const passes = (code) => manifest.rows[0].readBy.some((re) => re.test(stripComments(code)))

describe('crashes settings-rows.json', () => {
  it('is a manifest the UI kit can read, naming exactly this module\'s rows', () => {
    expect(manifest.problems).toEqual([])
    const ids = CRASH_SETTINGS_ROWS.filter((row) => row.type !== 'heading').map((row) => row.id)
    expect(manifest.rows.map((row) => row.id)).toEqual(ids)
    expect(manifest.rows.every((row) => row.hint.includes('applyCrashSetting'))).toBe(true)
  })
  it('the wiring the README asks for counts as read; a comment doesn\'t', () => {
    expect(passes('applyCrashSetting(loadSettings(settingsJson))')).toBe(true)
    expect(passes('setOn(values.crashReports !== false)')).toBe(true)
    expect(passes('// applyCrashSetting(values) later')).toBe(false)
  })
})

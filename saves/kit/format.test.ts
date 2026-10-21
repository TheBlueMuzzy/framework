// FORMAT.md is what another language's version (C# for Unity, a desktop backend) is built from — these checks keep
// it true to the code: the record fields, the copy keys and the golden-save file names it names are the real ones.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { goldenFileName } from './oldSaves'
import { COPIED_MARKER } from './platform'
import { backupKey, createSave, damagedKey } from './saves'
import { memoryStorage } from './storage'

const format = readFileSync(new URL('../FORMAT.md', import.meta.url), 'utf8')
/** The rows of the table under a heading: first column, without the backticks. */
function tableKeys(heading: string): string[] {
  const part = format.split(`## ${heading}`)[1]?.split('\n## ')[0] ?? ''
  return [...part.matchAll(/^\| `([^`]+)`/gm)].map((m) => m[1])
}

describe('FORMAT.md matches the kit', () => {
  it('a record has exactly the fields §2 lists', () => {
    const storage = memoryStorage()
    const save = createSave({ key: 'mygame:progress', kind: 'progress', version: 1, fresh: { played: 0 }, fields: { played: 'add-up' }, storage })
    save.save({ played: 3 })
    const record = JSON.parse(storage.data['mygame:progress'])
    expect(Object.keys(record).sort()).toEqual(tableKeys('2. A record').sort())
    expect(record.savedAt).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/) // ISO with milliseconds, UTC
  })

  it('the keys §1 lists are the ones the kit writes', () => {
    // (a row's first key only: "`<key>~1` … `<key>~5`" → <key>~1)
    expect(tableKeys('1. Keys')).toEqual(['<key>', backupKey('<key>', 1), damagedKey('<key>'), '<key>~device', '<key>/list', '<key>/<id>', COPIED_MARKER])
    const storage = memoryStorage()
    const save = createSave({ key: 'mygame:progress', kind: 'progress', version: 1, fresh: { played: 0 }, fields: { played: 'add-up' }, storage })
    save.save({ played: 1 })
    save.save({ played: 2 })
    expect(Object.keys(storage.data).sort()).toEqual(['mygame:progress', 'mygame:progress~1', 'mygame:progress~device'])
    const slots = createSave({ key: 'mygame:slots', kind: 'slots', version: 1, fresh: { n: 0 }, storage: memoryStorage() })
    const slotStorage = memoryStorage()
    slots.withStorage(slotStorage).slot('a').save({ n: 1 })
    expect(Object.keys(slotStorage.data).sort()).toEqual(['mygame:slots/a', 'mygame:slots/list'])
    expect(JSON.parse(slotStorage.data['mygame:slots/a']).save).toBe('mygame:slots') // §1: a slot's record names the slots key
  })

  it("§7's golden-save file name example is the kit's", () => {
    expect(format).toContain(`\`glyphtender:run\`, 2 → \`${goldenFileName('glyphtender:run', 2)}\``)
  })
})

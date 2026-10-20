import { describe, expect, it } from 'vitest'
import { DEFAULT_SAVES_CONFIG } from './config'
import { askToKeepSaves, checkSaveHealth, HEALTH_WORDS, healthLine, type HealthEnv } from './health'
import { createBackupNudge } from './nudge'
import { memoryStorage } from './storage'

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const CHROME_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0 Mobile/15E148 Safari/604.1'
const FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0'
const GB = 1024 ** 3

/** A normal desktop Chrome with a roomy disk, unless told otherwise. */
function env(more: Partial<HealthEnv> = {}): HealthEnv {
  return {
    storage: memoryStorage(), userAgent: CHROME, crossSiteFrame: false, hostname: 'muzzy.github.io', standalone: false, heapLimit: 4 * GB,
    storageManager: { persisted: async () => true, persist: async () => true, estimate: async () => ({ quota: 200 * GB }) },
    ...more,
  }
}
const ids = async (e: HealthEnv) => (await checkSaveHealth(e)).warnings.map((w) => w.id)

describe('storage health', () => {
  it('a normal browser that keeps the data: nothing to warn about', async () => {
    expect(await checkSaveHealth(env())).toEqual({ canSave: true, kept: true, inFrame: false, onItch: false, warnings: [] })
    expect(healthLine(await checkSaveHealth(env()))).toBe(HEALTH_WORDS.okShort)
  })

  it('storage refused → blocked (and its plain words)', async () => {
    const storage = memoryStorage()
    storage.blocked = true
    const health = await checkSaveHealth(env({ storage }))
    expect(health.canSave).toBe(false)
    expect(health.warnings[0]).toEqual({ id: 'blocked', level: 'risk', message: HEALTH_WORDS.blocked })
    expect(await ids(env({ storage: null }))).toEqual(['blocked'])
  })

  it('itch.io\'s frame and other sites\' frames', async () => {
    expect(await ids(env({ hostname: 'html-classic.itch.zone', crossSiteFrame: true }))).toEqual(['itch'])
    expect(await ids(env({ hostname: 'v6p9d9t4.ssl.hwcdn.net', crossSiteFrame: true }))).toEqual(['itch'])
    expect(await ids(env({ crossSiteFrame: true }))).toEqual(['frame'])
    expect(healthLine(await checkSaveHealth(env({ hostname: 'html.itch.zone' })))).toBe('In itch.io\'s frame')
  })

  it('Safari\'s 7-day rule — not for Home Screen apps, not for Chrome on an iPhone', async () => {
    expect(await ids(env({ userAgent: SAFARI, storageManager: { persisted: async () => true, getDirectory: async () => ({}) as FileSystemDirectoryHandle } }))).toEqual(['safari'])
    expect(await ids(env({ userAgent: SAFARI, standalone: true, storageManager: { persisted: async () => true } }))).toEqual([])
    expect(await ids(env({ userAgent: CHROME_IPHONE, storageManager: { persisted: async () => true } }))).toEqual([])
  })

  it('a private window (best guess): Firefox / Safari refuse their file storage; Chrome gives far less room', async () => {
    const refused = { persisted: async () => false, getDirectory: async () => { throw new Error('SecurityError') } }
    expect(await ids(env({ userAgent: FIREFOX, storageManager: refused }))).toEqual(['private'])
    expect(await ids(env({ storageManager: { persisted: async () => false, estimate: async () => ({ quota: 0.5 * GB }) } }))).toEqual(['private'])
    expect(await ids(env({ storageManager: { persisted: async () => true, estimate: async () => ({ quota: 100 * GB }) } }))).toEqual([])
  })

  it('a refused persist is a quiet note, only when nothing worse is said', async () => {
    const health = await checkSaveHealth(env({ storageManager: { persisted: async () => false, estimate: async () => ({ quota: 200 * GB }) } }))
    expect(health.warnings).toEqual([{ id: 'not-kept', level: 'note', message: HEALTH_WORDS['not-kept'] }])
    expect(healthLine(health)).toBe(HEALTH_WORDS.okShort)
  })

  it('a browser with no storage manager at all, or one that throws: no crash', async () => {
    expect(await ids(env({ storageManager: undefined }))).toEqual([])
    const throwing = { persisted: async () => { throw new Error('nope') }, estimate: async () => { throw new Error('nope') } }
    expect((await checkSaveHealth(env({ storageManager: throwing }))).kept).toBeNull()
  })

  it('askToKeepSaves asks only when not already kept, and never throws', async () => {
    let asked = 0
    expect(await askToKeepSaves({ storageManager: { persisted: async () => true, persist: async () => { asked++; return true } } })).toBe(true)
    expect(asked).toBe(0)
    expect(await askToKeepSaves({ storageManager: { persisted: async () => false, persist: async () => { asked++; return false } } })).toBe(false)
    expect(asked).toBe(1)
    expect(await askToKeepSaves({ storageManager: undefined })).toBe(false)
    expect(await askToKeepSaves({ storageManager: { persist: async () => { throw new Error('no') } } })).toBe(false)
  })
})

describe('"back up your save" nudge', () => {
  const DAY = 24 * 60 * 60 * 1000
  function nudgeAt(config = DEFAULT_SAVES_CONFIG.nudge) {
    let clock = 100 * DAY
    const nudge = createBackupNudge('test', { storage: memoryStorage(), config: () => config, now: () => clock })
    return { nudge, later: (days: number) => { clock += days * DAY } }
  }

  it('due after enough progress, then not again for minDaysBetween', () => {
    const { nudge, later } = nudgeAt({ afterProgress: 3, minDaysBetween: 7, onlyWhenAtRisk: false })
    nudge.noteProgress()
    nudge.noteProgress()
    expect(nudge.due()).toBe(false)
    nudge.noteProgress()
    expect(nudge.due()).toBe(true)
    nudge.shown()
    expect(nudge.due()).toBe(false)
    later(7)
    expect(nudge.due()).toBe(true)
  })

  it('a backup starts the count again; 0 = never', () => {
    const { nudge } = nudgeAt({ afterProgress: 2, minDaysBetween: 0, onlyWhenAtRisk: false })
    nudge.noteProgress(5)
    nudge.backedUp()
    expect(nudge.due()).toBe(false)
    const never = nudgeAt({ afterProgress: 0, minDaysBetween: 0, onlyWhenAtRisk: false }).nudge
    never.noteProgress(100)
    expect(never.due()).toBe(false)
  })

  it('onlyWhenAtRisk waits for a risky browser', () => {
    const { nudge } = nudgeAt({ afterProgress: 1, minDaysBetween: 0, onlyWhenAtRisk: true })
    nudge.noteProgress()
    expect(nudge.due({ canSave: true, kept: true, inFrame: false, onItch: false, warnings: [] })).toBe(false)
    expect(nudge.due({ canSave: true, kept: true, inFrame: false, onItch: false, warnings: [{ id: 'safari', level: 'risk', message: '' }] })).toBe(true)
  })
})

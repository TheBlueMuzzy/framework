// The emotes module: phrases from content, the spam limit (device side), mute per seat + hide-all (kept through the
// saves module), the bot-facing say() on the same path, online send + receive, and the config reader.
import { describe, expect, it, vi } from 'vitest'
import { createBucket } from './bucket'
import { DEFAULT_EMOTES_CONFIG, looserServer, readEmotesConfig } from './config'
import { createEmotes, type EmoteMessage } from './emotes'
import { EMOTE_SAVE } from './save'
import { applyEmoteSetting, EMOTE_SETTING, emoteSettingsRows } from './settingsRow'
import { createSave, memoryStorage } from '../saves'
import template from '../templates/content/emotes.json'
import words from '../templates/content/words.json'

// A clock the test moves by hand
function clock(start = 1_000_000) {
  let t = start
  return { now: () => t, wait: (ms: number) => { t += ms } }
}
const banter = { bully: { won: 'Too easy, if you ask me.' } }
function setup(extra: Parameters<typeof createEmotes>[0] = {}) {
  const time = clock()
  const seen: EmoteMessage[] = []
  const emotes = createEmotes({ settings: template, words: words.emotes, banter, mine: ['seat-1'], now: time.now, warn: () => {}, ...extra })
  emotes.onEmote((e) => seen.push(e))
  return { emotes, seen, time }
}

describe('the bucket (spam limit)', () => {
  it('3 in a row, then one every 4 s, never two closer than 800 ms', () => {
    const b = createBucket({ burst: 3, refillSeconds: 4, minGapMs: 800 })
    let t = 0
    expect(b.take(t)).toBe(true)
    expect(b.take(t + 100)).toBe(false) // closer than 800 ms
    expect(b.readyIn(t + 100)).toBe(700)
    t = 800; expect(b.take(t)).toBe(true)
    t = 1600; expect(b.take(t)).toBe(true)
    t = 2400; expect(b.take(t)).toBe(false) // the burst is spent: 2.4 s refilled 0.6 of one
    expect(b.readyIn(t)).toBe(Math.ceil((1 - 2400 / 4000) * 4000))
    t = 4000; expect(b.take(t)).toBe(true) // one came back
    t = 4800; expect(b.take(t)).toBe(false)
    t = 4000 + 4000 * 3 + 1; expect(b.readyIn(t)).toBe(0) // long quiet: full again, never more than burst
    expect([b.take(t), b.take(t + 800), b.take(t + 1600), b.take(t + 2400)]).toEqual([true, true, true, false])
  })
  it('a refused send changes nothing (pressing harder never makes it later)', () => {
    const b = createBucket({ burst: 1, refillSeconds: 4 })
    b.take(0)
    const before = b.readyIn(1000)
    for (let i = 0; i < 50; i++) b.take(1000)
    expect(b.readyIn(1000)).toBe(before)
  })
})

describe('sendEmote (a local game)', () => {
  it('a phrase shows straight away, with its seat, id and time; its words come from the text file', () => {
    const { emotes, seen, time } = setup()
    expect(emotes.sendEmote('seat-1', 'wellPlayed')).toEqual({ ok: true })
    expect(seen).toEqual([{ seat: 'seat-1', id: 'wellPlayed', at: time.now() }])
    expect(emotes.text('wellPlayed')).toBe('Well played!')
    expect(emotes.phrases).toEqual(template.phrases)
  })
  it('an id that isn\'t a phrase (or is words) is refused as unknown, and nothing shows', () => {
    const { emotes, seen } = setup()
    for (const id of ['Well played!', 'nope', '', '__proto__', 'constructor', 'banter.bully.lost', 'banter.__proto__.x']) expect(emotes.sendEmote('seat-1', id)).toEqual({ ok: false, reason: 'unknown' })
    expect(emotes.sendEmote('', 'wow')).toEqual({ ok: false, reason: 'unknown' })
    expect(seen).toEqual([])
  })
  it('a burst past the limit is held back (cooling), and readyIn says for how long; each seat has its own bucket', () => {
    const { emotes, seen, time } = setup()
    const results = []
    for (let i = 0; i < 6; i++) { results.push(emotes.sendEmote('seat-1', 'wow').ok); time.wait(800) }
    expect(results).toEqual([true, true, true, false, false, true]) // 3 in a row; by 4 s one is back
    expect(seen).toHaveLength(4)
    expect(emotes.readyIn('seat-1')).toBeGreaterThan(0)
    // hot seat: another person on this device still has a full bucket
    expect(emotes.sendEmote('seat-2', 'wow')).toEqual({ ok: true })
    expect(emotes.readyIn('seat-9')).toBe(0)
  })
  it('bubbleMs: showMs, or readMsPerWord × words when longer', () => {
    const { emotes } = setup({ words: { ...words.emotes, thinking: 'one two three four five six seven eight nine ten eleven twelve' } })
    expect(emotes.bubbleMs('wow')).toBe(2500)
    expect(emotes.bubbleMs('thinking')).toBe(12 * 250)
    expect(emotes.allTexts()).toHaveLength(7)
  })
})

describe('say (a bot seat) — the same path', () => {
  it('a bot\'s banter line and a preset phrase go through the same check, bucket and bubble', () => {
    const { emotes, seen, time } = setup()
    expect(emotes.say('seat-3', 'banter.bully.won')).toEqual({ ok: true })
    expect(emotes.text('banter.bully.won')).toBe('Too easy, if you ask me.')
    time.wait(800); emotes.say('seat-3', 'wow')
    time.wait(800); emotes.say('seat-3', 'oops')
    time.wait(800)
    expect(emotes.say('seat-3', 'thanks')).toEqual({ ok: false, reason: 'cooling' })
    expect(seen.map((e) => e.seat)).toEqual(['seat-3', 'seat-3', 'seat-3'])
  })
  it('muting a bot silences its banter too', () => {
    const { emotes, seen } = setup()
    emotes.mute('seat-3', true)
    expect(emotes.say('seat-3', 'banter.bully.won')).toEqual({ ok: true }) // (the bot isn't told)
    expect(seen).toEqual([])
  })
})

describe('mute and hide-all', () => {
  it('a muted seat\'s emotes never reach onEmote; unmute brings them back; you can\'t mute yourself', () => {
    const { emotes, seen } = setup()
    emotes.mute('seat-2', true)
    expect(emotes.isMuted('seat-2')).toBe(true)
    expect(emotes.sendEmote('seat-2', 'wow')).toEqual({ ok: true }) // the muted player isn't told
    emotes.receive({ seat: 'seat-2', id: 'oops' })
    expect(seen).toEqual([])
    emotes.mute('seat-2', false)
    emotes.receive({ seat: 'seat-2', id: 'oops' })
    expect(seen.map((e) => e.id)).toEqual(['oops'])
    emotes.mute('seat-1', true)
    expect(emotes.isMuted('seat-1')).toBe(false)
    expect(emotes.muted()).toEqual([])
  })
  it('hide-all drops everyone\'s but this device\'s own', () => {
    const { emotes, seen } = setup()
    emotes.setHideAll(true)
    emotes.receive({ seat: 'seat-2', id: 'wow' })
    emotes.say('seat-3', 'banter.bully.won')
    emotes.sendEmote('seat-1', 'thanks')
    expect(seen.map((e) => `${e.seat}:${e.id}`)).toEqual(['seat-1:thanks'])
  })
  it('the Settings row: its starting value is mutedByDefault, and applyEmoteSetting passes the switch on', () => {
    const { emotes } = setup()
    expect(emoteSettingsRows({ mutedByDefault: true }).find((r) => r.id === EMOTE_SETTING)).toMatchObject({ type: 'toggle', default: true })
    applyEmoteSetting(emotes, { [EMOTE_SETTING]: true })
    expect(emotes.hideAll()).toBe(true)
    applyEmoteSetting(emotes, {}) // missing = keep the saved choice
    expect(emotes.hideAll()).toBe(true)
    applyEmoteSetting(emotes, { [EMOTE_SETTING]: false })
    expect(emotes.hideAll()).toBe(false)
  })
})

describe('kept with the saves module', () => {
  const makeSave = (storage = memoryStorage()) => ({ storage, save: createSave({ ...EMOTE_SAVE, key: 'testgame:emotes', version: 1, storage }) })
  it('the switch and this match\'s mutes survive a reload; a new match starts with no mutes (the switch stays)', () => {
    const { storage, save } = makeSave()
    const first = createEmotes({ settings: template, words: words.emotes, save, match: 'ROOM-1', mine: ['seat-1'] })
    first.mute('seat-2', true)
    first.setHideAll(true)
    const reload = createEmotes({ settings: template, words: words.emotes, save: makeSave(storage).save, match: 'ROOM-1', mine: ['seat-1'] })
    expect(reload.isMuted('seat-2')).toBe(true)
    expect(reload.hideAll()).toBe(true)
    const next = createEmotes({ settings: template, words: words.emotes, save: makeSave(storage).save, match: 'ROOM-2', mine: ['seat-1'] })
    expect(next.isMuted('seat-2')).toBe(false)
    expect(next.hideAll()).toBe(true)
    next.mute('seat-4', true)
    next.setMatch('ROOM-3')
    expect(next.muted()).toEqual([])
  })
  it('a new player\'s switch starts at mutedByDefault; a damaged save never breaks it', () => {
    const { storage, save } = makeSave()
    expect(createEmotes({ settings: { ...template, mutedByDefault: true }, save }).hideAll()).toBe(true)
    storage.data['testgame:emotes'] = JSON.stringify({ save: 'testgame:emotes', version: 1, savedAt: '', data: { hideAll: 'yes', seats: [1, 'seat-2', 'seat-2'] } })
    const loaded = createEmotes({ settings: template, save: makeSave(storage).save, match: '' })
    expect(loaded.hideAll()).toBe(false)
    expect(loaded.muted()).toEqual(['seat-2'])
  })
  it('a save made with the wrong version is named', () => {
    const warn = vi.fn()
    createEmotes({ save: createSave({ ...EMOTE_SAVE, key: 'testgame:emotes', version: 2, storage: memoryStorage() }), warn })
    expect(warn.mock.calls[0][0]).toMatch(/version 2 but the module's is 1/)
  })
})

describe('online: send and receive', () => {
  it('a send goes to the room, not straight to the bubble; the room\'s relay shows it (the sender\'s screen too)', () => {
    const sent: string[] = []
    const { emotes, seen } = setup({ send: (seat, id) => { sent.push(`${seat}:${id}`); return true } })
    expect(emotes.sendEmote('seat-1', 'hello')).toEqual({ ok: true })
    expect(sent).toEqual(['seat-1:hello'])
    expect(seen).toEqual([])
    emotes.receive({ type: 'emote', seat: 'seat-1', id: 'hello' })
    expect(seen.map((e) => e.id)).toEqual(['hello'])
  })
  it('setSend switches a page between online and local (a game with both modes)', () => {
    const sent: string[] = []
    const { emotes, seen, time } = setup()
    emotes.setSend((_seat, id) => { sent.push(id); return true })
    emotes.sendEmote('seat-1', 'hello')
    expect([sent, seen.length]).toEqual([['hello'], 0])
    emotes.setSend(undefined)
    time.wait(1000)
    emotes.sendEmote('seat-1', 'wow')
    expect(seen.map((e) => e.id)).toEqual(['wow'])
  })
  it('not connected → offline; the device bucket still holds a burst back before it reaches the room', () => {
    const { emotes: down } = setup({ send: () => false })
    expect(down.sendEmote('seat-1', 'hello')).toEqual({ ok: false, reason: 'offline' })
    let count = 0
    const { emotes } = setup({ send: () => { count++; return true } })
    for (let i = 0; i < 20; i++) emotes.sendEmote('seat-1', 'wow')
    expect(count).toBe(1) // 20 presses at once: one leaves (minGapMs), the rest never reach the network
  })
  it('receive ignores anything not shaped like a known emote (words, odd types, long seats)', () => {
    const { emotes, seen } = setup()
    for (const m of [null, 'wow', { seat: 'seat-2' }, { seat: 2, id: 'wow' }, { seat: 'seat-2', id: '<b>hi</b>' }, { seat: 'x'.repeat(65), id: 'wow' }]) emotes.receive(m)
    expect(seen).toEqual([])
  })
})

describe('content/emotes.json', () => {
  it('the template reads as the defaults with no warnings', () => {
    const warn = vi.fn()
    expect(readEmotesConfig(template, warn)).toEqual(DEFAULT_EMOTES_CONFIG)
    expect(warn).not.toHaveBeenCalled()
  })
  it('a bad value → the default, with one warning naming it; words instead of ids are left out', () => {
    const warn = vi.fn()
    const c = readEmotesConfig({ phrases: ['hello', 'Well played!', 'hello', 3], limits: { burst: 0, refillSeconds: 'fast' }, bubble: { showMs: 10 } }, warn)
    expect(c.phrases).toEqual(['hello'])
    expect(c.limits.burst).toBe(3)
    expect(c.limits.refillSeconds).toBe(4)
    expect(c.bubble.showMs).toBe(2500)
    expect(warn.mock.calls.map((call) => call[0]).join('\n')).toMatch(/"Well played!", 3 aren't phrase ids[\s\S]*limits\.burst[\s\S]*limits\.refillSeconds[\s\S]*bubble\.showMs/)
  })
  it('looserServer names a server limit looser than the device\'s', () => {
    expect(looserServer(DEFAULT_EMOTES_CONFIG)).toEqual([])
    expect(looserServer({ limits: DEFAULT_EMOTES_CONFIG.limits, server: { burst: 10, refillSeconds: 1, perMatch: 200 } })).toHaveLength(2)
  })
})

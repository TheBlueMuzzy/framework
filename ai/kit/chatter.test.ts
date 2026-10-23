// "Bot chatter" (F22 task 6, Muzzy 2026-10-23: "this is usually a menu setting"): Off · Some · Lots in the player's
// Settings, kept by the saves module. Off = the bots say nothing at all; Some = content/ai/banter.json's numbers;
// Lots = more often (chance × levels.lots.chanceTimes, capped at 1, and a shorter cooldown). Changing it applies live.
import { describe, expect, it } from 'vitest'
import { DEFAULT_BANTER_SETTINGS, chatterLevelOf, readBanterSettings, settingsAtLevel, type BanterSettings, type MomentMap } from './banter'
import { botBanter, type BanterSeat } from './brain'
import type { PaceClock } from './pace'
import { BANTER_SAVE } from './save'
import { BANTER_SETTING, BANTER_SETTINGS_ROWS, applyBanterSetting } from './settingsRow'

function rulesClock() {
  let t = 0
  const timers: { at: number; fn: () => void; live: boolean }[] = []
  const clock: PaceClock = {
    now: () => t,
    after(ms, fn) {
      const timer = { at: t + ms, fn, live: true }
      timers.push(timer)
      return () => { timer.live = false }
    },
  }
  const run = (ms: number) => {
    const end = t + ms
    for (;;) {
      const next = timers.filter((x) => x.live && x.at <= end).sort((a, b) => a.at - b.at)[0]
      if (!next) break
      t = next.at
      next.live = false
      next.fn()
    }
    t = end
  }
  return { clock, run }
}

type Ev = { type: 'hit'; by: number } | { type: 'over'; winner: number }
const moments: MomentMap<Ev> = (e, seat) => (e.type === 'hit' ? (e.by === seat ? 'hitRival' : null) : e.winner === seat ? 'won' : 'lost')
const lines = { Bully: { hitRival: 'Gotcha!', hitRival_2: 'Squirm.', won: 'Too easy.' } }
const bully: BanterSeat[] = [{ seat: 1, personality: { id: 'Bully', chattiness: 50 } }]
const base: BanterSettings = { ...DEFAULT_BANTER_SETTINGS, chance: { hitRival: 0.4, won: 1 }, cooldownTurns: 0, alwaysAllowed: ['won'], presets: {}, delay: { min: 1, max: 1 }, tableGap: 0 }

function voice(options: { settings?: BanterSettings; chatter?: 'off' | 'some' | 'lots'; save?: Parameters<typeof botBanter>[0]['save'] } = {}) {
  const time = rulesClock()
  const said: string[] = []
  const banter = botBanter({ moments, bots: () => bully, settings: options.settings ?? base, lines: () => lines, say: (_s, id) => { said.push(id); return true }, seed: 11, clock: time.clock, chatter: options.chatter, save: options.save })
  const hits = (n: number) => { for (let i = 0; i < n; i++) { banter.hear([{ type: 'hit', by: 1 }]); time.run(5000) } }
  return { time, said, banter, hits }
}

describe('Bot chatter: Off · Some · Lots', () => {
  it('Some (the default) = the file\'s numbers; Lots speaks about twice as often; Off says nothing at all', () => {
    const some = voice()
    some.hits(1000)
    expect(some.banter.chatter()).toBe('some')
    expect(some.said.length / 1000).toBeGreaterThan(0.16) // 0.4 × 50% = 20%
    expect(some.said.length / 1000).toBeLessThan(0.24)
    const lots = voice({ chatter: 'lots' })
    lots.hits(1000)
    expect(lots.said.length / 1000).toBeGreaterThan(0.35) // min(1, 0.4 × 2) × 50% = 40%
    expect(lots.said.length / 1000).toBeLessThan(0.45)
    const off = voice({ chatter: 'off' })
    off.hits(200)
    off.banter.hear([{ type: 'over', winner: 1 }]) // even an always-allowed moment at chance 1
    off.time.run(5000)
    expect(off.said).toEqual([])
  })

  it('Lots caps each chance at 1 and uses its own cooldown', () => {
    const at = settingsAtLevel({ ...base, chance: { hitRival: 0.7, won: 0.9 }, cooldownTurns: 3 }, 'lots')!
    expect(at.chance).toEqual({ hitRival: 1, won: 1 })
    expect(at.cooldownTurns).toBe(1)
    expect(settingsAtLevel(base, 'off')).toBeNull()
    expect(settingsAtLevel({ ...base, cooldownTurns: 3 }, 'some')!.cooldownTurns).toBe(3)
  })

  it('changing it applies live: Off drops a waiting line at once; back to Some, it talks again', () => {
    const { time, said, banter } = voice({ settings: { ...base, chance: { hitRival: 1 } }, chatter: 'some' })
    banter.hear([{ type: 'hit', by: 1 }])
    expect(Object.keys(banter.waiting())).toEqual(['1'])
    applyBanterSetting(banter, { [BANTER_SETTING]: 'Off' })
    expect(banter.waiting()).toEqual({})
    time.run(5000)
    expect(said).toEqual([])
    applyBanterSetting(banter, { [BANTER_SETTING]: 'Some' })
    banter.hear([{ type: 'hit', by: 1 }]); time.run(5000)
    expect(said).toHaveLength(1)
    applyBanterSetting(banter, { [BANTER_SETTING]: 'nonsense' }) // unknown → left as it is
    applyBanterSetting(banter, {})
    expect(banter.chatter()).toBe('some')
  })

  it('kept by the saves module: the next game (a new botBanter) starts at the saved level', () => {
    // (the saves module's createSave in a game; here the same load / save shape over one stored value — the ai
    // folder typechecks without the browser's types the saves module needs)
    let stored: unknown = null
    const save = () => ({ load: () => BANTER_SAVE.clean((stored ?? BANTER_SAVE.fresh) as never), save: (data: unknown) => { stored = JSON.parse(JSON.stringify(data)) }, version: BANTER_SAVE.version })
    const first = voice({ save: save() })
    expect(first.banter.chatter()).toBe('some') // a new player
    applyBanterSetting(first.banter, { botChatter: 'Lots' })
    expect(stored).toEqual({ chatter: 'lots' })
    const next = voice({ save: save() })
    expect(next.banter.chatter()).toBe('lots')
    expect(BANTER_SAVE.clean({ chatter: 'loud' as never })).toEqual({ chatter: 'some' }) // a damaged save → Some
  })

  it('the row: a selector Off · Some · Lots, default Some; its values read as levels', () => {
    expect(BANTER_SETTINGS_ROWS).toEqual([expect.objectContaining({ id: 'botChatter', type: 'selector', label: 'Bot chatter', options: ['Off', 'Some', 'Lots'], default: 'Some' })])
    expect(BANTER_SETTINGS_ROWS[0].options.map(chatterLevelOf)).toEqual(['off', 'some', 'lots'])
  })

  it('content/ai/banter.json "levels": read with _help ignored; a bad level warns and keeps its default', () => {
    const warned: string[] = []
    const read = readBanterSettings({ levels: { _help: 'x', some: { chanceTimes: 0.5 }, lots: { chanceTimes: 'lots' } } }, (m) => warned.push(m))
    expect(read.levels).toEqual({ some: { chanceTimes: 0.5 }, lots: DEFAULT_BANTER_SETTINGS.levels.lots })
    expect(warned).toEqual([expect.stringContaining('levels.lots')])
  })
})

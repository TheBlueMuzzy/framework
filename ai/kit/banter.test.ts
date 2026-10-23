import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_BANTER_SETTINGS, isLineFor, linesFor, maybeSay, momentsFor, quietMemory, readBanterSettings, type BanterSettings, type MomentMap } from './banter'

describe('banter moments + settings (F22)', () => {
  type Ev = { type: 'hit'; by: number; on: number } | { type: 'over'; winner: number } | { type: 'drew'; seat: number }
  const map: MomentMap<Ev> = (e, seat) => {
    if (e.type === 'hit') return e.by === seat ? 'hitRival' : e.on === seat ? 'gotHit' : null
    if (e.type === 'over') return e.winner === seat ? ['won'] : ['lost']
    return undefined
  }

  it('the game names its moments from its own events, per seat, in order, without repeats', () => {
    const events: Ev[] = [{ type: 'drew', seat: 0 }, { type: 'hit', by: 0, on: 1 }, { type: 'hit', by: 0, on: 2 }, { type: 'over', winner: 0 }]
    expect(momentsFor(map, events, 0)).toEqual(['hitRival', 'won'])
    expect(momentsFor(map, events, 1)).toEqual(['gotHit', 'lost'])
    expect(momentsFor(map, events, 3)).toEqual(['lost'])
    // a secret event (a Table event's seen) only counts for the seats that may see it
    const secret = [{ type: 'hit', by: 2, on: 1, seen: { seats: [1, 2] } }] as unknown as Ev[]
    expect(momentsFor(map, secret, 1)).toEqual(['gotHit'])
    expect(momentsFor((e: Ev) => (e.type === 'hit' ? 'rivalBigMove' : null), secret, 0)).toEqual([])
    // a name that couldn't be an emote id is ignored
    expect(momentsFor(() => ['bad name', '9x', 'ok'], [{ type: 'drew', seat: 0 }], 0)).toEqual(['ok'])
  })

  it('reads content/ai/banter.json; a bad value warns once and keeps the default; the template reads clean', () => {
    const warnings: string[] = []
    const read = readBanterSettings({ chance: { won: 1, gotHit: 2, 'bad name': 0.5, _note: 'x' }, cooldownTurns: -1, delay: { min: 3, max: 1 }, tableGap: 0, presets: { won: ['goodGame'], lost: 'nope' } }, (m) => warnings.push(m))
    expect(read.chance).toEqual({ won: 1 })
    expect(read.cooldownTurns).toBe(DEFAULT_BANTER_SETTINGS.cooldownTurns)
    expect(read.delay).toEqual(DEFAULT_BANTER_SETTINGS.delay)
    expect(read.tableGap).toBe(0)
    expect(read.presets).toEqual({ won: ['goodGame'] })
    expect(warnings).toHaveLength(5)
    expect(warnings.join(' ')).toContain('chance.gotHit')
    const template = JSON.parse(readFileSync(new URL('../templates/content/ai/banter.json', import.meta.url), 'utf8'))
    const none: string[] = []
    expect(readBanterSettings(template, (m) => none.push(m))).toEqual(DEFAULT_BANTER_SETTINGS)
    expect(none).toEqual([])
    expect(readBanterSettings(undefined)).toEqual(DEFAULT_BANTER_SETTINGS)
  })

  it('a personality\'s lines for a moment are its emote ids: the moment and its numbered extras, only with words', () => {
    const lines = { Bully: { won: 'Too easy.', won_2: 'Next!', won_x: 'not a line', wonder: 'no', won_3: '  ', lost: 'Rigged.' }, Shy: {} }
    expect(linesFor(lines, 'Bully', 'won')).toEqual(['banter.Bully.won', 'banter.Bully.won_2'])
    expect(linesFor(lines, 'Bully', 'gotHit')).toEqual([])
    expect(linesFor(lines, 'Shy', 'won')).toEqual([])
    expect(linesFor(lines, 'toString', 'won')).toEqual([]) // (own keys only)
    expect(linesFor(undefined, 'Bully', 'won')).toEqual([])
    expect(isLineFor('won_12', 'won')).toBe(true)
    expect(isLineFor('wonder', 'won')).toBe(false)
  })
})

const settings: BanterSettings = { chance: { tangledRival: 0.8, reveal: 1 }, cooldownTurns: 2, alwaysAllowed: ['reveal'] }
const lines = ['Gotcha!', 'Nowhere to go?', 'Squirm a little.']

describe('banter', () => {
  it('speaks about as often as chance × chattiness', () => {
    let rng = 1
    let spoke = 0
    for (let i = 0; i < 2000; i++) {
      const r = maybeSay('tangledRival', 0, 50, lines, quietMemory(), settings, rng)
      rng = r.rng
      if (r.line) spoke++
    }
    expect(spoke / 2000).toBeGreaterThan(0.36) // 0.8 × 50% = 40%
    expect(spoke / 2000).toBeLessThan(0.44)
    expect(maybeSay('tangledRival', 0, 0, lines, quietMemory(), settings, 1).line).toBeNull()
    expect(maybeSay('sneezed', 0, 100, lines, quietMemory(), settings, 1).line).toBeNull() // unlisted moment
  })

  it('stays quiet during the cooldown, except for moments that ignore it', () => {
    const mem = { lastSpokeTurn: 10, said: ['Gotcha!'] }
    const always = { ...settings, chance: { tangledRival: 1, reveal: 1 } }
    expect(maybeSay('tangledRival', 12, 100, lines, mem, always, 1).line).toBeNull()
    expect(maybeSay('tangledRival', 13, 100, lines, mem, always, 1).line).not.toBeNull()
    expect(maybeSay('reveal', 11, 100, ['Well played!'], mem, always, 1).line).toBe('Well played!')
  })

  it('never repeats a line until it has used them all, then reuses the oldest', () => {
    const always = { ...settings, chance: { tangledRival: 1 }, cooldownTurns: 0 }
    let mem = quietMemory()
    let rng = 3
    const heard: string[] = []
    for (let turn = 1; turn <= 4; turn++) {
      const r = maybeSay('tangledRival', turn, 100, lines, mem, always, rng)
      ;[mem, rng] = [r.memory, r.rng]
      heard.push(r.line!)
    }
    expect(new Set(heard.slice(0, 3)).size).toBe(3)
    expect(heard[3]).toBe(heard[0])
  })
})

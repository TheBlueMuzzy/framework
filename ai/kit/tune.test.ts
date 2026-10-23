import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ArenaPlug, ArenaRequest, CheckTargets } from './arena'
import type { FeelTarget } from './check'
import { defaultTuneSettings, isBetter, shortfall, sliderText, sliderValue, slidersOf, tunePersonality, tuneTables, withSlider, type TuneResult } from './tune'
import type { Personality } from './types'
import { tuneHtml } from './report'
import { arenaPlug, careful, greedy, skills, targets, type Action, type Setup, type State, type View } from '../fixtures/drawTo10'

// A plug whose meter IS the seat's caution (its range's low end) — so a target on it is reached by one slider, with no
// luck: the search itself is what's tested. (The real Draw to 10 games test the rest.)
const cautionPlug: ArenaPlug<State, Action, Setup, View> = { ...arenaPlug, meters: (game) => game.seats.map((s) => ({ caution: s.personality.traits.caution.min, greed: s.personality.traits.greed.min })) }
const withTargets = (careful_: FeelTarget[], greedy_: FeelTarget[] = []): CheckTargets => ({ personalities: { Careful: careful_, Greedy: greedy_ }, all: [] })
const req = (t: CheckTargets, over: Partial<ArenaRequest> = {}): ArenaRequest => ({ personalities: [careful, greedy], skills, targets: t, ...over })
const quick = { tuneGames: 4, tuneFreshGames: 6, tuneTries: 200, tuneSeconds: 0 }
const withoutClock = (r: TuneResult) => ({ ...r, seconds: 0 })

describe('the sliders', () => {
  it('each trait (its range moved whole), nudge, focus and each steady goal — nothing else', () => {
    const p: Personality = { ...careful, steady: { GREED: 0.4 } }
    expect(slidersOf(p).map((s) => s.path)).toEqual(['traits.caution', 'traits.greed', 'nudge', 'focus', 'steady.GREED'])
    expect(slidersOf(p)[0]).toEqual({ path: 'traits.caution', min: 0, max: 85, grain: 1 }) // 80–95 is 15 wide: its low end goes 0…85
  })

  it('a slider set past its range stops at the end; a trait keeps its width', () => {
    const [caution, , nudge] = slidersOf(careful)
    expect(withSlider(careful, caution, 200).traits.caution).toEqual({ min: 85, max: 100 })
    expect(withSlider(careful, caution, -5).traits.caution).toEqual({ min: 0, max: 15 })
    expect(withSlider(careful, nudge, 1.7).nudge).toBe(1)
    expect(withSlider(careful, nudge, 0.333).nudge).toBe(0.35) // to its grain
    expect(sliderValue(careful, 'focus')).toBe(0) // missing = 0
    expect(sliderText(careful, 'traits.caution')).toBe('80–95')
  })

  it('the original personality is never changed', () => {
    const before = JSON.stringify(careful)
    withSlider(careful, slidersOf(careful)[0], 10)
    expect(JSON.stringify(careful)).toBe(before)
  })
})

describe('scoring a try', () => {
  it('more of its own targets first, then the others\', then closer', () => {
    expect(isBetter({ own: 2, others: 0, gap: 9 }, { own: 1, others: 5, gap: 0 })).toBe(true)
    expect(isBetter({ own: 1, others: 3, gap: 9 }, { own: 1, others: 2, gap: 0 })).toBe(true)
    expect(isBetter({ own: 1, others: 2, gap: 0.1 }, { own: 1, others: 2, gap: 0.2 })).toBe(true)
    expect(isBetter({ own: 1, others: 2, gap: 0.2 }, { own: 1, others: 2, gap: 0.2 })).toBe(false) // a tie isn't better
  })

  it('a red target\'s shortfall is on its own scale; green is 0', () => {
    const t = { meter: 'm', op: '>=' as const, value: 10, label: '', measured: 5, pass: false }
    expect(shortfall(t)).toBeCloseTo(0.5)
    expect(shortfall({ ...t, measured: 12, pass: true })).toBe(0)
    expect(shortfall({ ...t, op: 'tableBest', rival: { personality: 'x', measured: 6 }, measured: 4 })).toBeGreaterThan(shortfall({ ...t, op: 'tableBest', rival: { personality: 'x', measured: 6 }, measured: 5.9 }))
  })
})

describe('the tuning tables', () => {
  it('the tuned personality sits at every table, its seat moving round; table sizes go round', () => {
    const tables = tuneTables([careful, greedy], 'Careful', skills[1], 6, { minSeats: 2, maxSeats: 4 }, 500)
    expect(tables.map((t) => t.seats.length)).toEqual([2, 3, 4, 2, 3, 4])
    expect(tables.every((t) => t.seats.some((s) => s.personality.id === 'Careful'))).toBe(true)
    expect(tables.map((t) => t.seats.findIndex((s) => s.personality.id === 'Careful'))).toEqual([0, 1, 2, 1, 0, 1].map((_, g) => g % [2, 3, 4, 2, 3, 4][g]))
    expect(tables.map((t) => t.seed)).toEqual([500, 501, 502, 503, 504, 505])
  })
})

describe('tunePersonality', () => {
  it('reaches a reachable target by moving one slider, and checks it on fresh seeds before suggesting', () => {
    const r = tunePersonality(cautionPlug, req(withTargets([{ meter: 'caution', op: '<=', value: 30, label: 'easy-going' }])), 'Careful', { settings: quick })
    expect(r.verdict).toBe('better')
    expect(r.targets[0].before).toEqual({ measured: 80, pass: false })
    expect(r.targets[0].after.pass).toBe(true)
    expect(r.sliders.find((s) => s.path === 'traits.caution')).toMatchObject({ from: '80–95', changed: true })
    expect(r.sliders.filter((s) => s.changed).map((s) => s.path)).toEqual(['traits.caution'])
    expect(r.suggested!.traits.caution.min).toBeLessThanOrEqual(30)
    expect(r.stoppedBy).toBe('allGreen')
    expect(r.cantReach).toEqual([])
    expect(r.message).toMatch(/0 → 1 of 1 targets green on 6 fresh games/)
  })

  it('stays inside every slider\'s range (real games, many tries)', () => {
    const t = withTargets([{ meter: 'draws', op: '>=', value: 2.5, label: 'draws more' }, { meter: 'busted', op: '>=', value: 0.4, label: 'busts often' }])
    const r = tunePersonality(arenaPlug, req(t), 'Careful', { settings: { ...quick, tuneTries: 40 } })
    const sliders = slidersOf(careful)
    for (const line of r.log.slice(1)) {
      const [path, , , to] = line.change.split(' ')
      const slider = sliders.find((s) => s.path === path)!
      const value = path.startsWith('traits.') ? Number(to.split('–')[0]) : Number(to)
      expect(value).toBeGreaterThanOrEqual(slider.min)
      expect(value).toBeLessThanOrEqual(slider.max)
      if (path.startsWith('traits.')) expect(Number(to.split('–')[1]) - value).toBe(15) // width kept
    }
  })

  it('is never worse than the start on fresh seeds: a suggestion has more targets green there, else none', () => {
    for (const seed of [7000, 7100, 7200]) {
      const t = withTargets([{ meter: 'held', op: '>=', value: 5.5, label: 'holds more' }, { meter: 'busted', op: '<=', value: 0.2, label: 'rarely busts' }])
      const r = tunePersonality(arenaPlug, req(t), 'Careful', { settings: { ...quick, tuneGames: 10, tuneFreshGames: 20, tuneTries: 12, tuneSeed: seed } })
      const green = (k: 'before' | 'after') => r.targets.filter((x) => x[k].pass).length
      if (r.verdict === 'better') expect(green('after')).toBeGreaterThan(green('before'))
      else {
        expect(r.suggested).toBeNull()
        expect(green('after')).toBe(green('before'))
      }
    }
  })

  it('the other personalities stay exactly as they are; only sliders change in the suggestion', () => {
    const greedyBefore = JSON.stringify(greedy)
    const r = tunePersonality(cautionPlug, req(withTargets([{ meter: 'caution', op: '<=', value: 30, label: 'x' }])), 'Careful', { settings: quick })
    expect(JSON.stringify(greedy)).toBe(greedyBefore)
    const { traits: a, ...restA } = r.suggested!
    const { traits: b, ...restB } = careful
    expect(restA).toEqual(restB)
    expect(Object.keys(a)).toEqual(Object.keys(b))
  })

  it('the same seed gives the same suggestion', () => {
    const t = withTargets([{ meter: 'draws', op: '>=', value: 2.2, label: 'draws more' }])
    const settings = { ...quick, tuneGames: 8, tuneFreshGames: 10, tuneTries: 10 }
    const a = tunePersonality(arenaPlug, req(t), 'Careful', { settings })
    const b = tunePersonality(arenaPlug, req(t), 'Careful', { settings })
    expect(withoutClock(b)).toEqual(withoutClock(a))
    expect(a.log.length).toBeGreaterThan(1)
  })

  it('respects the budget: tries, games a try, and the time', () => {
    const t = withTargets([{ meter: 'caution', op: '>=', value: 999, label: 'impossible' }])
    const r = tunePersonality(cautionPlug, req(t), 'Careful', { settings: { tuneGames: 3, tuneFreshGames: 5, tuneTries: 7, tuneSeconds: 0 } })
    expect(r.tries).toBe(7)
    expect(r.log).toHaveLength(7)
    expect(r.stoppedBy).toBe('tries')
    expect(r.games).toBe(7 * 3 + 5 + (r.log.some((l, i) => i > 0 && l.kept) ? 5 : 0))
    let clock = 0
    const timed = tunePersonality(cautionPlug, req(t), 'Careful', { settings: { tuneGames: 3, tuneFreshGames: 5, tuneTries: 100, tuneSeconds: 4 }, now: () => (clock += 1000) })
    expect(timed.stoppedBy).toBe('time')
    expect(timed.tries).toBeLessThan(6)
    expect(timed.cantReach[0].why).toMatch(/time ran out \(4 s\)/)
  })

  it('says honestly when a target can\'t be reached within the ranges', () => {
    const t = withTargets([{ meter: 'caution', op: '>=', value: 999, label: 'impossible' }, { meter: 'greed', op: '<=', value: 50, label: 'already fine' }])
    const r = tunePersonality(cautionPlug, req(t), 'Careful', { settings: quick })
    expect(r.stoppedBy).toBe('settled')
    expect(r.verdict).toBe('noGain')
    expect(r.suggested).toBeNull()
    expect(r.cantReach).toEqual([{ label: 'impossible', why: expect.stringMatching(/measured 80, wants ≥ 999 — couldn't reach it within these ranges/) }])
    expect(r.message).toMatch(/keep what you have/)
  })

  it('a personality with no targets: nothing played, nothing suggested', () => {
    const r = tunePersonality(arenaPlug, req(withTargets([], [{ meter: 'draws', op: '>=', value: 1, label: 'x' }])), 'Careful', { settings: quick })
    expect(r).toMatchObject({ verdict: 'noTargets', games: 0, tries: 0, suggested: null, targets: [] })
    expect(r.message).toMatch(/Careful has no feel targets/)
    expect(tunePersonality(arenaPlug, { ...req(targets), targets: { personalities: {}, all: [] } }, 'Greedy').verdict).toBe('noTargets')
  })

  it('every target green already: says so, changes nothing', () => {
    const r = tunePersonality(cautionPlug, req(withTargets([{ meter: 'caution', op: '>=', value: 50, label: 'careful' }])), 'Careful', { settings: quick })
    expect(r).toMatchObject({ verdict: 'alreadyGreen', tries: 1, suggested: null, cantReach: [] })
  })

  it('stops in plain English for a personality that isn\'t there or a bad budget', () => {
    expect(() => tunePersonality(arenaPlug, req(targets), 'Nobody')).toThrow(/No personality "Nobody" \(there are Careful, Greedy\)/)
    expect(() => tunePersonality(arenaPlug, req(targets), 'Careful', { settings: { tuneGames: -1 } })).toThrow(/"tuneGames" should be a number of 0 or more/)
    expect(() => tunePersonality(arenaPlug, req(targets), 'Careful', { settings: { tuneTries: '5' as unknown as number } })).toThrow(/"tuneTries" should be a number/)
  })

  it('takes a game\'s whole arena.json as its settings: only the tune* numbers are read, the rest left alone', () => {
    const arenaJson = { _help: { games: 'help' }, games: 60, whatWinsMoments: [3, 'end'], tuneGames: 2, tuneFreshGames: 3, tuneTries: 2, tuneSeconds: 0 }
    const r = tunePersonality(cautionPlug, req(withTargets([{ meter: 'caution', op: '<=', value: 10, label: 'x' }])), 'Careful', { settings: arenaJson })
    expect(r.settings).toEqual({ ...defaultTuneSettings, tuneGames: 2, tuneFreshGames: 3, tuneTries: 2, tuneSeconds: 0 })
    expect(r.tries).toBe(2)
  })

  it('reports progress per game: "Try n / tries", then the fresh check', () => {
    const seen: string[] = []
    tunePersonality(cautionPlug, req(withTargets([{ meter: 'caution', op: '<=', value: 60, label: 'x' }])), 'Careful', { settings: { ...quick, tuneGames: 2, tuneFreshGames: 2 }, onProgress: (p) => seen.push(`${p.phase} ${p.tryNo}/${p.tries} ${p.game}/${p.games}`) })
    expect(seen.slice(0, 3)).toEqual(['search 1/200 1/2', 'search 1/200 2/2', 'search 2/200 1/2'])
    expect(seen.at(-1)).toMatch(/^fresh .* 2\/2$/)
  })

  it('its page escapes everything game-named (personality, slider, meter, label, the game) and shows old → new', () => {
    const odd: Personality = { ...careful, id: '<b>Odd</b>', traits: { '"x"<i>': { min: 80, max: 95 }, ...careful.traits } }
    const plug = { ...cautionPlug, meters: (game: Parameters<typeof cautionPlug.meters>[0]) => game.seats.map((s) => ({ '<m>': s.personality.traits['"x"<i>']?.min ?? 0 })) }
    const t: CheckTargets = { personalities: { '<b>Odd</b>': [{ meter: '<m>', op: '<=', value: 30, label: '<script>alert(1)</script>' }] }, all: [] }
    const r = tunePersonality(plug, { personalities: [odd, greedy], skills, targets: t }, '<b>Odd</b>', { settings: quick })
    const html = tuneHtml(r, '<Game & "Co">')
    expect(html).not.toMatch(/<script>|<b>Odd|<i>|<m>|<Game/)
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('&lt;Game &amp; &quot;Co&quot;&gt;')
    expect(html).toContain('data-tune-verdict="better"')
    expect(html).toMatch(/<td>80–95<\/td><td class="changed">\d+–\d+<\/td>/)
  })

  it('has defaults for every budget number — the same as the installer\'s starter arena.json, each with a help line', () => {
    expect(Object.keys(defaultTuneSettings).sort()).toEqual(['tuneFreshGames', 'tuneFreshSeed', 'tuneGames', 'tuneSeconds', 'tuneSeed', 'tuneStep', 'tuneTries'])
    const starter = JSON.parse(readFileSync(new URL('../templates/content/ai/arena.json', import.meta.url), 'utf8'))
    for (const [k, v] of Object.entries(defaultTuneSettings)) {
      expect(starter[k]).toBe(v)
      expect(starter._help[k]).toBeTruthy()
    }
  })
})

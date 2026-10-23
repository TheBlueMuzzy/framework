import { describe, expect, it } from 'vitest'
import { arenaPlan, arenaTotal, decisionTimes, ladderTables, mixedTables, playArenaGame, runArena, toResults, type ArenaRequest } from './arena'
import { botSeed } from './brain'
import { reportHtml } from './report'
import { arenaPlug, careful, drawTo10, greedy, skills, targets } from '../fixtures/drawTo10'

const [apprentice, steady, expert] = skills
const request = (over: Partial<ArenaRequest> = {}): ArenaRequest => ({ personalities: [careful, greedy], skills, targets, settings: { games: 80, ladderGames: 20 }, ...over })

describe('the arena loop', () => {
  it('plays a whole game with a bot in every seat, through the rules, until it is over', () => {
    const game = playArenaGame(arenaPlug, [{ personality: careful, skill: steady }, { personality: greedy, skill: steady }], 1000)
    expect(drawTo10.isOver(game.state)).toBe(true)
    expect(game.moves.length).toBeGreaterThan(1)
    expect(game.notes.length).toBe(game.moves.length) // one note per decision, the seat in front
    expect(game.notes[0]).toMatch(/^0 /)
    expect(game.decisionMs.length).toBe(game.moves.length)
  })

  it('the same seed plays the same game; another seed plays another', () => {
    const seats = [{ personality: careful, skill: apprentice }, { personality: greedy, skill: apprentice }]
    const a = playArenaGame(arenaPlug, seats, 1000)
    expect(playArenaGame(arenaPlug, seats, 1000).moves).toEqual(a.moves)
    const others = [1001, 1002, 1003, 1004].map((s) => JSON.stringify(playArenaGame(arenaPlug, seats, s).moves))
    expect(others.some((m) => m !== JSON.stringify(a.moves))).toBe(true)
  })

  it('each seat gets its own randomness from the seed (botSeed unless the plug says otherwise)', () => {
    const seen: number[] = []
    const plug = { ...arenaPlug, bot: () => (_v: unknown, _seat: number, rng: number) => (seen.push(rng), { action: { type: 'stop' as const }, rng }) }
    playArenaGame(plug, [{ personality: careful, skill: steady }, { personality: greedy, skill: steady }], 77)
    expect(seen).toEqual([botSeed(77, 0), botSeed(77, 1)])
    seen.length = 0
    playArenaGame({ ...plug, seatRng: (seed, seat) => seed * 10 + seat }, [{ personality: careful, skill: steady }, { personality: greedy, skill: steady }], 77)
    expect(seen).toEqual([770, 771])
  })

  it('a game that never ends stops with a plain-English error', () => {
    const endless = { ...arenaPlug, maxMoves: 3, rules: { ...drawTo10, isOver: () => false, toAct: () => [0], apply: (s: never) => ({ state: s }) } }
    expect(() => playArenaGame(endless, [{ personality: careful, skill: steady }], 5)).toThrow(/did not end within 3 moves/)
  })

  it('results: each seat its meters and its share of the win', () => {
    const games = [1000, 1001, 1002].map((s) => playArenaGame(arenaPlug, [{ personality: careful, skill: steady }, { personality: greedy, skill: steady }], s))
    const rows = toResults(arenaPlug, games)
    expect(rows[0].seats.map((s) => s.personality)).toEqual(['Careful', 'Greedy'])
    for (const r of rows) {
      const won = r.seats.reduce((n, s) => n + s.won, 0)
      expect([0, 1]).toContain(Math.round(won * 1000) / 1000) // somebody wins (shares add to 1) or everyone bust
      expect(Object.keys(r.seats[0].meters).sort()).toEqual(['busted', 'draws', 'held', 'stopped'])
    }
  })
})

describe('situations ("What wins?", F25)', () => {
  const seats = [{ personality: greedy, skill: steady }, { personality: greedy, skill: steady }]

  it('reads each seat\'s situations after its own turns N and at the end', () => {
    const game = playArenaGame(arenaPlug, seats, 1000, 'mixed', [1, 2, 'end'])
    for (const [i, s] of game.situations.entries()) {
      expect(s.end).toEqual(arenaPlug.situations!(game.state, i))
      const own = game.moves.filter((m) => m.seat === i).length
      // Draw to 10: every move is one turn, so turn 1 = the hand after the seat's first card
      if (own >= 1 && game.moves.find((m) => m.seat === i)!.action.type === 'draw') expect(s['turn 1'].total).toBeGreaterThan(0)
      if (own < 2) expect(s['turn 2']).toBeUndefined() // a moment the game never reached isn't there
    }
    expect(toResults(arenaPlug, [game])[0].seats[0].situations).toEqual(game.situations[0])
  })

  it('a turn is all of a seat\'s moves until someone else acts', () => {
    // A game where seat 0 acts twice in a row: its turn 1 is read after the second move only
    let count = 0
    const rules = { setup: () => ({ n: 0 }), isOver: (s: { n: number }) => s.n >= 3, toAct: (s: { n: number }) => [s.n < 2 ? 0 : 1], viewFor: () => ({}), apply: (s: { n: number }) => ({ state: { n: s.n + 1 } }) }
    const plug = { name: 'Two in a row', rules, setup: () => ({}), bot: () => (_v: unknown, _s: number, rng: number) => ({ action: {}, rng }), meters: () => [{}, {}], winners: () => [1], situations: (s: { n: number }) => (count++, { moves: s.n }) }
    const game = playArenaGame(plug, seats, 1, 'mixed', [1])
    expect(game.situations).toEqual([{ 'turn 1': { moves: 2 } }, { 'turn 1': { moves: 3 } }])
    expect(count).toBe(2) // read only at its moments, not after every move
  })

  it('true/false count as 1/0; anything else that isn\'t a number stops the run in plain English', () => {
    const yesNo = { ...arenaPlug, situations: () => ({ ahead: true }) as unknown as Record<string, number> }
    expect(playArenaGame(yesNo, seats, 1000, 'mixed', ['end']).situations[0].end).toEqual({ ahead: 1 })
    const bad = { ...arenaPlug, situations: () => ({ lead: NaN }) }
    expect(() => playArenaGame(bad, seats, 1000, 'mixed', ['end'])).toThrow(`Draw to 10's situation "lead" (seat 0, end) isn't a number`)
    const word = { ...arenaPlug, situations: () => ({ lead: 'lots' }) as unknown as Record<string, number> }
    expect(() => playArenaGame(word, seats, 1000, 'mixed', ['end'])).toThrow(/it gave "lots"/)
  })

  it('an old plug without situations keeps working: no situations in its results', () => {
    const { situations: _none, ...old } = arenaPlug
    void _none
    const game = playArenaGame(old, seats, 1000)
    expect(game.situations).toEqual([{}, {}])
    expect(toResults(old, [game])[0].seats[0]).not.toHaveProperty('situations')
  })
})

describe('seating plans', () => {
  it('mixed tables go round 2, 3, 4 seats, shuffled the same way every run, with repeats past the cast', () => {
    const plan = mixedTables([careful, greedy], steady, 6, { minSeats: 2, maxSeats: 4, seed: 9 })
    expect(plan.map((t) => t.seats.length)).toEqual([2, 3, 4, 2, 3, 4])
    expect(plan.map((t) => t.seed)).toEqual([9, 10, 11, 12, 13, 14])
    expect(new Set(plan[0].seats.map((s) => s.personality.id)).size).toBe(2) // a 2-seat table never seats one twice
    expect(mixedTables([careful, greedy], steady, 6, { minSeats: 2, maxSeats: 4, seed: 9 })).toEqual(plan)
    const firsts = mixedTables([careful, greedy], steady, 30, { minSeats: 2, maxSeats: 2, seed: 9 }).map((t) => t.seats[0].personality.id)
    expect(new Set(firsts).size).toBe(2) // who sits first is shuffled
  })

  it('"only" seats the same personalities every game', () => {
    const plan = mixedTables([careful, greedy], steady, 3, { minSeats: 2, maxSeats: 4, seed: 9 }, [greedy, greedy])
    expect(plan.every((t) => t.seats.map((s) => s.personality.id).join() === 'Greedy,Greedy')).toBe(true)
  })

  it('ladder tables: the highest skill against the lowest, sides swapped each game', () => {
    const plan = ladderTables([careful], apprentice, expert, 4, 5000)
    expect(plan.map((t) => t.seats.map((s) => s.skill.id).join())).toEqual(['Expert,Apprentice', 'Apprentice,Expert', 'Expert,Apprentice', 'Apprentice,Expert'])
    expect(plan.map((t) => t.seed)).toEqual([5000, 5001, 5002, 5003])
  })

  it('a whole plan: mixed at the middle skill, then the ladder; the total; plain-English mistakes', () => {
    const { tables, main } = arenaPlan(request({ settings: { games: 5, ladderGames: 2 } }))
    expect(main.id).toBe('Steady')
    expect(tables.map((t) => t.kind)).toEqual(['mixed', 'mixed', 'mixed', 'mixed', 'mixed', 'ladder', 'ladder', 'ladder', 'ladder'])
    expect(arenaTotal(request({ settings: { games: 5, ladderGames: 2 } }))).toBe(9)
    expect(() => arenaPlan(request({ mainSkill: 'Wizard' }))).toThrow('No skill "Wizard" (there are Apprentice, Steady, Expert)')
    expect(() => arenaPlan(request({ only: ['Bully'] }))).toThrow('No personality "Bully"')
  })
})

describe('the whole Personality Check on Draw to 10', () => {
  const run = runArena(arenaPlug, request())
  const { report } = run

  it('tells the careful one from the greedy one by behaviour alone', () => {
    expect(report.tell.overall).toBeGreaterThanOrEqual(0.8)
    expect(report.tell.accuracy.Careful).toBeGreaterThanOrEqual(0.7)
    expect(report.tell.accuracy.Greedy).toBeGreaterThanOrEqual(0.7)
  })

  it('each one feels like itself: all four feel targets green', () => {
    const feel = Object.values(report.feel).flat()
    expect(feel.filter((t) => !t.pass).map((t) => `${t.label} ${t.measured}`)).toEqual([])
    expect(feel).toHaveLength(4)
  })

  it('the skill ladder orders skill: Expert beats Apprentice for both personalities', () => {
    expect(report.ladder.Careful).toBeGreaterThan(0.5)
    expect(report.ladder.Greedy).toBeGreaterThan(0.5)
  })

  it('the checks for all of them: built-in ones and the game plug\'s own', () => {
    expect(report.all.map((a) => [a.label.split(' ')[0], a.pass])).toEqual([['the', true], ['its', true], ['stops', true]])
    const unknown = runArena(arenaPlug, request({ settings: { games: 4, ladderGames: 0 }, targets: { ...targets, all: [{ check: 'nope', label: 'x' }, { check: 'meter', meter: 'draws', min: 0, label: 'draws' }, { check: 'winRate', max: 0.0001, label: 'never wins' }] } })).report
    expect(unknown.all[0]).toMatchObject({ pass: false, detail: 'no check called "nope"' })
    expect(unknown.all[1]).toMatchObject({ pass: true, detail: 'all 2 in range' })
    expect(unknown.all[2].pass).toBe(false)
    expect(unknown.all[2].detail).toMatch(/^off: /)
  })

  it('the report has the title, a seeded subtitle, wins and notes from the first game', () => {
    expect(report.title).toBe('Personality Check — Draw to 10')
    expect(report.subtitle).toBe('80 mixed games at Steady (2–4 players) + 40 skill-ladder games · seed 1000')
    expect(Object.keys(report.wins.overall).sort()).toEqual(['Careful', 'Greedy'])
    expect(report.notes).toEqual(run.games[0].notes.slice(0, 24))
    expect(reportHtml(report)).toContain('Personality Check — Draw to 10')
  })

  // F24 review: at the lowest (or highest) skill the ladder's own seats share the main skill — they must never count
  it('ladder games never count in feel, tell-apart or wins, even when the main skill is the ladder\'s low end', () => {
    const at = (ladderGames: number) => runArena(arenaPlug, request({ mainSkill: 'Apprentice', settings: { games: 12, ladderGames } }))
    const withLadder = at(10)
    const without = at(0)
    expect(withLadder.report.wins).toEqual(without.report.wins)
    expect(withLadder.report.tell).toEqual(without.report.tell)
    expect(withLadder.report.feel).toEqual(without.report.feel)
    expect(withLadder.mixedResults).toHaveLength(12)
    expect(withLadder.results).toHaveLength(32) // + 10 ladder games for each of the 2 personalities
    expect(Object.keys(withLadder.report.ladder).length).toBeGreaterThan(0)
  })

  it('"What wins?" (F25): sentences from the mixed tables at the main skill, on the report page', () => {
    const w = report.whatWins!
    expect(w.top.length).toBeGreaterThan(0)
    expect(w.top.length).toBeLessThanOrEqual(5)
    // Draw to 10: at the end, not having bust is what wins — "busted" (fewer is better) or the lead tops the list
    expect(w.all[0].strength).toBeGreaterThan(0.5)
    expect(w.top.every((t) => /^Players with .+ win \d+% \(of \d+ games, ±\d+%\) — vs \d+% with /.test(t))).toBe(true)
    const html = reportHtml(report)
    expect(html).toContain('<h2>What wins?')
    expect(html).toContain(`<ol data-what-wins><li>${w.top[0].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`)
    // the settings: fewer sentences, a higher floor
    const strict = runArena(arenaPlug, request({ settings: { games: 80, ladderGames: 0, whatWinsTop: 1, whatWinsMinGames: 1000 } })).report.whatWins!
    expect(strict.top).toEqual([])
    expect(strict.leftOut.length).toBe(strict.all.length)
    expect(reportHtml({ ...report, whatWins: strict })).toContain('data-what-wins-none')
    expect(runArena(arenaPlug, request({ settings: { games: 80, ladderGames: 0, whatWinsTop: 1 } })).report.whatWins!.top).toHaveLength(1)
  })

  it('an old plug without situations: no "What wins?" on the report', () => {
    const { situations: _none, ...old } = arenaPlug
    void _none
    const r = runArena(old, request({ settings: { games: 6, ladderGames: 0 } })).report
    expect(r.whatWins).toBeUndefined()
    expect(reportHtml(r)).not.toContain('What wins?')
  })

  it('the same seed gives the same report; another seed another', () => {
    expect(runArena(arenaPlug, request()).report).toEqual(report)
    expect(runArena(arenaPlug, request({ settings: { games: 80, ladderGames: 20, seed: 4242 } })).report).not.toEqual(report)
  })

  it('progress after every game, and decision times', () => {
    const seen: [number, number][] = []
    const small = runArena(arenaPlug, request({ settings: { games: 3, ladderGames: 1 } }), (done, total) => seen.push([done, total]))
    expect(seen).toEqual([[1, 5], [2, 5], [3, 5], [4, 5], [5, 5]])
    const times = decisionTimes(small.games)
    expect(times.count).toBe(small.games.reduce((n, g) => n + g.moves.length, 0))
    expect(times.median).toBeLessThanOrEqual(times.slowest)
  })
})

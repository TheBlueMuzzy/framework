import { describe, expect, it } from 'vitest'
import { asBot, makeBrain, personalityProblems, rollGoal, shiftedRanges } from './brain'
import { sample } from './random'
import type { GamePlug, Personality, Skill } from './types'

// A toy game: a line of 21 cells. I stand somewhere, a rival stands somewhere, some cells hold gold.
// Goals: CHASE (aggression) = get next to the rival · GOLD (greed) = stand on gold. The rival's purse is hidden.
interface View { me: number; rival: number; gold: number[]; purse: number | '?' }
type Move = { to: number }
const view = (me: number, rival: number, gold: Record<number, number> = {}): View => ({ me, rival, gold: Array.from({ length: 21 }, (_, i) => gold[i] ?? 0), purse: '?' })

let imaginedFrom: View[] = []
const plug: GamePlug<View, Move> = {
  goals: [
    { id: 'CHASE', trait: 'aggression', score: (m, ctx) => ({ value: -Math.abs(m.to - ctx.world.rival), why: `${Math.abs(m.to - ctx.world.rival)} from the rival` }) },
    { id: 'GOLD', trait: 'greed', score: (m, ctx) => ({ value: ctx.world.gold[m.to], why: ctx.world.gold[m.to] ? `${ctx.world.gold[m.to]} gold` : undefined }) },
  ],
  readings: (v) => ({ danger: Math.max(0, 10 - Math.abs(v.me - v.rival)) }),
  imagine: (v, _seat, rng) => {
    imaginedFrom.push(v)
    return { world: { ...v, purse: 3 }, rng: rng + 1 }
  },
  candidates: (w, _seat, limit, rng) => {
    const all = Array.from({ length: 21 }, (_, to) => ({ to })).filter((m) => m.to !== w.me && m.to !== w.rival && Math.abs(m.to - w.me) <= 4)
    const s = sample(all, limit, rng)
    return { actions: s.items, rng: s.rng }
  },
  key: (m) => String(m.to),
  describe: (m) => `go to ${m.to}`,
}

const person = (over: Partial<Personality> = {}): Personality => ({
  id: 'Tester',
  traits: { aggression: { min: 50, max: 50 }, greed: { min: 50, max: 50 } },
  goals: ['CHASE', 'GOLD'],
  nudge: 0.2,
  shifts: [],
  chattiness: 0,
  ...over,
})
const skill = (over: Partial<Skill> = {}): Skill => ({ id: 'test', candidates: 100, worlds: 1, spread: 1, topN: 1, wobble: 0, beliefNoise: 0, ...over })

describe('the goal roll', () => {
  it('a goal wins about as often as its trait value, walking the priority list', () => {
    const traitOf = (g: string) => (g === 'CHASE' ? 'aggression' : 'greed')
    let rng = 1
    const wins = { CHASE: 0, GOLD: 0 }
    for (let i = 0; i < 4000; i++) {
      const r = rollGoal(['GOLD', 'CHASE'], traitOf, { aggression: 80, greed: 50 }, rng)
      rng = r.rng
      wins[r.goal as 'CHASE' | 'GOLD']++
    }
    // GOLD first: 50%; then CHASE 50% × 80% = 40%; nothing rolled (10%) → the first goal, GOLD. So GOLD ≈ 60%.
    expect(wins.GOLD / 4000).toBeGreaterThan(0.56)
    expect(wins.GOLD / 4000).toBeLessThan(0.64)
  })

  it('a bully-like personality chases far more often than a greedy one', () => {
    const count = (p: Personality) => {
      const brain = makeBrain(plug, p, skill())
      let rng = 7
      let chases = 0
      for (let i = 0; i < 300; i++) {
        const d = brain.decide(view(5, 15, { 2: 4 }), 0, rng)
        rng = d.rng
        if (d.decision.goal === 'CHASE') chases++
      }
      return chases
    }
    const bully = count(person({ traits: { aggression: { min: 80, max: 95 }, greed: { min: 30, max: 50 } }, goals: ['CHASE', 'GOLD'] }))
    const miser = count(person({ traits: { aggression: { min: 5, max: 20 }, greed: { min: 85, max: 100 } }, goals: ['GOLD', 'CHASE'] }))
    expect(bully).toBeGreaterThan(220)
    expect(miser).toBeLessThan(60)
  })
})

describe('scoring and choosing', () => {
  it('the nudge breaks ties toward the move that also does the other goal (two birds)', () => {
    // Rival at 10, me at 8: 9 and 11 are both right next to the rival; only 11 has gold.
    const always = (p: Personality) => {
      const brain = makeBrain(plug, p, skill())
      const picks = new Set<number>()
      let rng = 3
      for (let i = 0; i < 60; i++) {
        const d = brain.decide(view(8, 10, { 11: 5 }), 0, rng)
        rng = d.rng
        if (d.decision.goal === 'CHASE') picks.add(d.action.to)
      }
      return picks
    }
    const hunter = { aggression: { min: 100, max: 100 }, greed: { min: 30, max: 30 } }
    expect([...always(person({ traits: hunter, nudge: 0.2 }))]).toEqual([11])
    // Each other goal nudges by its trait: no greed → gold doesn't matter; no nudge → either neighbour.
    expect(always(person({ traits: { ...hunter, greed: { min: 0, max: 0 } }, nudge: 0.2 })).size).toBe(2)
    expect(always(person({ traits: hunter, nudge: 0 })).size).toBe(2)
  })

  it('focus keeps it on its main goal, and the nudge picks among those moves', () => {
    // Rival at 10, me at 6. Gold 9 at cell 7 (3 from the rival); gold 2 at cell 9 (right next to it).
    const pick = (focus: number) => {
      const brain = makeBrain(plug, person({ traits: { aggression: { min: 100, max: 100 }, greed: { min: 100, max: 100 } }, nudge: 1, focus }), skill())
      return brain.decide(view(6, 10, { 7: 9, 9: 2 }), 0, 5).action.to
    }
    expect(pick(0)).toBe(7) // no focus: the big gold wins though it is a weaker chase
    expect(pick(0.8)).toBe(9) // focused: only real chases count — the one with gold
  })

  it('steady goals count on every move; focus only bites at a big moment', () => {
    const at = (bigAt: number | undefined, focus: number) => {
      const p2: typeof plug = { ...plug, goals: plug.goals.map((g) => (g.id === 'CHASE' ? { ...g, bigAt } : g)) }
      const brain = makeBrain(p2, person({ traits: { aggression: { min: 100, max: 100 }, greed: { min: 0, max: 0 } }, nudge: 0, steady: { GOLD: 1 }, focus }), skill())
      return brain.decide(view(6, 10, { 7: 9, 9: 2 }), 0, 5)
    }
    // Steady gold, no focus: the gold-rich weaker chase wins (greed 0 and no nudge — only "steady" counts it).
    expect(at(undefined, 0).action.to).toBe(7)
    // A big chance (best chase −1 ≥ bar −2): focused on the chase, gold breaks the tie.
    expect(at(-2, 0.8).action.to).toBe(9)
    expect(at(-2, 0.8).decision.note).toContain('Big moment')
    // No big chance (bar above anything possible): it blends, like no focus.
    expect(at(5, 0.8).action.to).toBe(7)
  })

  it('poor sight misjudges that goal: a blind hunter wanders, a sighted one goes straight for it', () => {
    const picks = (sight: number) => {
      const brain = makeBrain(plug, person({ traits: { aggression: { min: 100, max: 100 }, greed: { min: 0, max: 0 } }, nudge: 0, sight: { CHASE: sight } }), skill())
      const seen = new Set<number>()
      let rng = 21
      for (let i = 0; i < 100; i++) {
        const d = brain.decide(view(4, 12), 0, rng)
        rng = d.rng
        seen.add(d.action.to)
      }
      return seen
    }
    expect([...picks(1)]).toEqual([8])
    expect(picks(0.2).size).toBeGreaterThan(2)
  })

  it('a looser skill picks among more moves; spread 1 + topN 1 always takes the best', () => {
    const picks = (s: Skill) => {
      const brain = makeBrain(plug, person({ traits: { aggression: { min: 100, max: 100 }, greed: { min: 0, max: 0 } }, nudge: 0 }), s)
      const seen = new Set<number>()
      let rng = 11
      for (let i = 0; i < 200; i++) {
        const d = brain.decide(view(4, 12), 0, rng)
        rng = d.rng
        seen.add(d.action.to)
      }
      return seen
    }
    expect([...picks(skill())]).toEqual([8]) // as close to 12 as a 4-step move gets
    expect(picks(skill({ spread: 0.5, topN: 4 })).size).toBeGreaterThan(1)
  })

  it('the same game and the same rng give the same move and the same note', () => {
    const brain = makeBrain(plug, person({ traits: { aggression: { min: 20, max: 90 }, greed: { min: 10, max: 80 } } }), skill({ spread: 0.6, topN: 5, wobble: 0.3 }))
    const a = brain.decide(view(3, 14, { 5: 2, 7: 3 }), 0, 42)
    const b = brain.decide(view(3, 14, { 5: 2, 7: 3 }), 0, 42)
    expect(b.action).toEqual(a.action)
    expect(b.decision.note).toBe(a.decision.note)
    expect(b.rng).toBe(a.rng)
  })

  it('only ever imagines from the view it was given, as many worlds as the skill says', () => {
    imaginedFrom = []
    const v = view(3, 14)
    makeBrain(plug, person(), skill({ worlds: 3 })).decide(v, 0, 5)
    expect(imaginedFrom).toHaveLength(3)
    expect(imaginedFrom.every((x) => x === v)).toBe(true)
  })

  it('explains itself: goal, roll, move, why, how many it looked at', () => {
    const d = makeBrain(plug, person({ id: 'Bully', traits: { aggression: { min: 100, max: 100 }, greed: { min: 40, max: 40 } } }), skill()).decide(view(8, 10, { 11: 5 }), 0, 9)
    expect(d.decision.note).toMatch(/^Bully rolled CHASE \(aggression 100 vs roll \d+\)\. go to 11 — 1 from the rival; also 5 gold\. Looked at \d+\.$/)
    expect(d.decision.mainGoalMattered).toBe(true)
  })
})

describe('moods and skill blur', () => {
  it('a reading moves a trait by its share of the ramp, kept inside 0–100', () => {
    const p = person({ shifts: [{ reading: 'danger', from: 2, full: 10, trait: 'aggression', by: -40 }] })
    const half = shiftedRanges(p, skill(), { danger: 6 })
    expect(half.ranges.aggression).toEqual({ min: 30, max: 30 })
    expect(half.shifts).toEqual([{ trait: 'aggression', by: -20, because: 'danger 6' }])
    expect(shiftedRanges(p, skill(), { danger: 1 }).shifts).toEqual([])
    expect(shiftedRanges(person({ shifts: [{ reading: 'danger', from: 0, full: 10, trait: 'greed', by: 90 }] }), skill(), { danger: 10 }).ranges.greed).toEqual({ min: 100, max: 100 })
  })

  it('a falling ramp (from above full) shifts more as the reading drops', () => {
    const p = person({ shifts: [{ reading: 'lead', from: 5, full: 0, trait: 'greed', by: 20 }] })
    expect(shiftedRanges(p, skill(), { lead: 0 }).ranges.greed).toEqual({ min: 70, max: 70 })
    expect(shiftedRanges(p, skill(), { lead: 5 }).shifts).toEqual([])
  })

  it('wobble widens every range around its centre', () => {
    expect(shiftedRanges(person({ traits: { aggression: { min: 40, max: 60 }, greed: { min: 50, max: 50 } } }), skill({ wobble: 0.3 }), {}).ranges)
      .toEqual({ aggression: { min: 34, max: 66 }, greed: { min: 47, max: 53 } })
  })
})

describe('modes (fight · flight · focus)', () => {
  // Home = a gold-digger. Danger ≥ 8 (rival within 2 cells) → Flight: only run from the rival.
  const flight = { id: 'Flight', goals: ['CHASE', 'GOLD'], traits: { aggression: { min: 100, max: 100 } }, sight: { GOLD: 0 } }
  const digger = person({ id: 'Digger', homeMode: 'Focus', traits: { aggression: { min: 0, max: 0 }, greed: { min: 100, max: 100 } }, goals: ['GOLD', 'CHASE'], nudge: 0, switches: [{ reading: 'danger', atLeast: 8, to: 'Flight' }] })

  it('plays its home mode until a switch matches, then the mode replaces its priorities', () => {
    const brain = makeBrain(plug, digger, skill(), [flight])
    const calm = brain.decide(view(2, 15, { 5: 9 }), 0, 1)
    expect(calm.decision.mode).toBe('Focus')
    expect(calm.decision.goal).toBe('GOLD')
    const threatened = brain.decide(view(9, 10, { 5: 9 }), 0, 1) // danger 9
    expect(threatened.decision.mode).toBe('Flight')
    expect(threatened.decision.goal).toBe('CHASE')
    expect(threatened.decision.note).toMatch(/^Digger \[Flight\] rolled CHASE/)
  })

  it('a broken mode (empty goal list, upside-down range) is named plainly instead of crashing a game', () => {
    const broken = { id: 'Flight', goals: [], traits: { aggression: { min: 90, max: 10 } } }
    const problems = personalityProblems(digger, plug, [broken])
    expect(problems).toContain("mode Flight: its goal list is empty (leave it out to keep the personality's)")
    expect(problems).toContain('mode Flight: trait "aggression" range 90–10 must be inside 0–100, low to high')
  })

  it('a switch to a mode the game does not have is a problem, named plainly', () => {
    expect(() => makeBrain(plug, digger, skill(), [])).toThrow(/switches to mode "Flight", which isn't one of the game's modes/)
  })
})

describe('the plug, specials and the Bot shape', () => {
  it('names what is wrong with a personality that does not fit the game', () => {
    expect(personalityProblems(person(), plug)).toEqual([])
    expect(personalityProblems(person({ goals: ['CHASE', 'NAP'], traits: { aggression: { min: 70, max: 20 } } }), plug)).toEqual([
      'Tester: goal "NAP" isn\'t one of this game\'s goals (CHASE, GOLD)',
      'Tester: goal "GOLD" is missing from its priority list',
      'Tester: no range for trait "greed" (goal GOLD)',
      'Tester: trait "aggression" range 70–20 must be inside 0–100, low to high',
    ])
    expect(() => makeBrain(plug, person({ goals: ['CHASE'] }), skill())).toThrow(/doesn't fit the game/)
  })

  it('a special decision skips the goal roll and says why', () => {
    const withSpecial: GamePlug<View, Move> = { ...plug, special: (ctx, rng) => ({ special: ctx.readings.danger >= 9 ? { action: { to: 0 }, goal: 'FLEE', why: 'too close' } : null, rng }) }
    const d = makeBrain(withSpecial, person(), skill()).decide(view(9, 10), 0, 1)
    expect(d.action).toEqual({ to: 0 })
    expect(d.decision.note).toBe('Tester — FLEE: go to 0 (too close)')
    expect(makeBrain(withSpecial, person(), skill()).decide(view(2, 15), 0, 1).decision.goal).not.toBe('FLEE')
  })

  it('works as a Table Bot and reports each decision', () => {
    const notes: string[] = []
    const bot = asBot(makeBrain(plug, person(), skill()), (d) => notes.push(d.note))
    const out = bot(view(3, 14), 0, 8)
    expect(typeof out.action.to).toBe('number')
    expect(typeof out.rng).toBe('number')
    expect(notes).toHaveLength(1)
  })
})

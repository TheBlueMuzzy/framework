// F154 — AI moments type fix: a plug's moments(event, seat) takes exactly what botBanter's MomentMap takes,
// { moment, by } (who caused it) included — so a game hands botBanter plug.moments with no separate export.
// The type half of this test is checked by `npm run typecheck` (tsc): on the old type (string | string[] only)
// the plug below doesn't compile.
import { describe, expect, it } from 'vitest'
import { momentsWithCause, type MomentMap } from './banter'
import type { GamePlug } from './types'

type Ev = { type: 'placed'; seat: number; threat: boolean } | { type: 'won'; seat: number }

const plug: Pick<GamePlug<unknown, unknown, unknown, Ev>, 'moments'> = {
  moments: (e, seat) => {
    if (e.type === 'won') return e.seat === seat ? 'won' : 'lost'
    if (e.threat) return e.seat === seat ? 'bigMove' : { moment: 'rivalBigMove', by: e.seat }
    return [{ moment: 'closeCall' }, 'bigMove']
  },
}

// Both ways round: the plug's moments IS a MomentMap, and any MomentMap fits on a plug (the two can't drift apart).
const asMap: MomentMap<Ev> | undefined = plug.moments
const someMap: MomentMap<Ev> = () => null
const fromMap: Pick<GamePlug<unknown, unknown, unknown, Ev>, 'moments'> = { moments: someMap }
// …and a plug with its own Event still fits where the brain takes any plug (makeBrain: Event = unknown).
const anyPlug: Pick<GamePlug<unknown, unknown, unknown>, 'moments'> = plug

describe('GamePlug.moments (F154)', () => {
  it('names who caused a moment, and botBanter reads it straight off the plug', () => {
    expect(asMap).toBe(plug.moments)
    expect(anyPlug.moments).toBe(plug.moments)
    expect(fromMap.moments?.({ type: 'won', seat: 0 }, 0)).toBeNull()
    expect(momentsWithCause(plug.moments!, [{ type: 'placed', seat: 1, threat: true }], 0)).toEqual([{ moment: 'rivalBigMove', by: 1 }])
  })
})

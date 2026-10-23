// Bots talk through the emote module (F22): botBanter turns a change's events into each bot seat's moments, rolls
// chance × chattiness (cooldown, no repeats) and says one line a moment later on the RULES clock — through the real
// emotes module here (its bucket, its bubble, its mute).
import { describe, expect, it } from 'vitest'
import { createEmotes, type EmoteMessage } from '../../emotes/kit/emotes'
import { readBanterSettings, type BanterSettings, type MomentMap } from './banter'
import { botBanter, type BanterSeat } from './brain'
import type { PaceClock } from './pace'

// A rules clock the test moves by hand; paused = time stands still (the Dev Kit's full or half pause)
function rulesClock() {
  let t = 0
  let paused = false
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
    if (paused) return
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
  return { clock, run, pause: (on: boolean) => { paused = on }, pending: () => timers.filter((x) => x.live).length }
}

type Ev = { type: 'hit'; by: number; on: number } | { type: 'over'; winner: number } | { type: 'drew'; seat: number }
const moments: MomentMap<Ev> = (e, seat) => {
  if (e.type === 'hit') return e.by === seat ? 'hitRival' : e.on === seat ? 'gotHit' : null
  if (e.type === 'over') return e.winner === seat ? 'won' : 'lost'
  return null
}
const lines = { Bully: { hitRival: 'Gotcha!', hitRival_2: 'Squirm.', hitRival_3: 'Nowhere to go?', won: 'Too easy.' }, Shy: { gotHit: 'Oh no.' } }
const always: BanterSettings = { chance: { hitRival: 1, gotHit: 1, won: 1, lost: 1 }, cooldownTurns: 0, alwaysAllowed: ['won'], presets: { lost: ['wellPlayed'] }, delay: { min: 1, max: 1 }, tableGap: 0 }
const seatId = (seat: number) => `seat-${seat + 1}`

function table(options: { settings?: BanterSettings; bots?: BanterSeat[]; mine?: string[] } = {}) {
  const time = rulesClock()
  const seen: EmoteMessage[] = []
  const emotes = createEmotes({ words: { wellPlayed: 'Well played!', goodGame: 'Good game!', wow: 'Wow!' }, banter: lines, mine: options.mine ?? ['seat-1'], now: time.clock.now, warn: () => {} })
  emotes.onEmote((e) => seen.push(e))
  const bots = options.bots ?? [{ seat: 1, personality: { id: 'Bully', chattiness: 100 } }, { seat: 2, personality: { id: 'Shy', chattiness: 100 } }]
  const banter = botBanter({ moments, bots: () => bots, settings: options.settings ?? always, lines: () => lines, say: (seat, id) => emotes.say(seatId(seat), id).ok, seed: 7, clock: time.clock })
  return { time, seen, emotes, banter, bots }
}

describe('bots talk through the emote module', () => {
  it('a bot says its personality\'s line at a named moment, a moment later, in its own seat\'s bubble', () => {
    const { time, seen, banter } = table()
    banter.hear([{ type: 'drew', seat: 1 }])
    time.run(5000)
    expect(seen).toEqual([]) // not a named moment: nothing
    banter.hear([{ type: 'hit', by: 1, on: 2 }])
    expect(banter.waiting()).toEqual({ 1: expect.stringMatching(/^banter\.Bully\.hitRival/), 2: 'banter.Shy.gotHit' })
    time.run(999)
    expect(seen).toEqual([])
    time.run(1)
    expect(seen.map((e) => [e.seat, e.id.replace(/_\d$/, '')])).toEqual([['seat-2', 'banter.Bully.hitRival'], ['seat-3', 'banter.Shy.gotHit']])
  })

  it('speaks about as often as chance × chattiness', () => {
    const half: BanterSettings = { ...always, chance: { hitRival: 0.8 } }
    const { time, seen, banter } = table({ settings: half, bots: [{ seat: 1, personality: { id: 'Bully', chattiness: 50 } }] })
    for (let i = 0; i < 1000; i++) {
      banter.hear([{ type: 'hit', by: 1, on: 0 }])
      time.run(5000) // (past the delay and the emote bucket's refill)
    }
    expect(seen.length / 1000).toBeGreaterThan(0.35) // 0.8 × 50% = 40%
    expect(seen.length / 1000).toBeLessThan(0.45)
    const quiet = table({ bots: [{ seat: 1, personality: { id: 'Bully', chattiness: 0 } }] })
    quiet.banter.hear([{ type: 'hit', by: 1, on: 0 }])
    quiet.time.run(5000)
    expect(quiet.seen).toEqual([])
  })

  it('stays quiet for the cooldown after it spoke (moves at the table), except for always-allowed moments', () => {
    const { time, seen, banter } = table({ settings: { ...always, cooldownTurns: 2 }, bots: [{ seat: 1, personality: { id: 'Bully', chattiness: 100 } }] })
    const hit = () => { banter.hear([{ type: 'hit', by: 1, on: 0 }]); time.run(5000) }
    hit() // move 1: speaks
    hit() // move 2: cooling
    hit() // move 3: cooling
    expect(seen).toHaveLength(1)
    hit() // move 4: speaks again
    expect(seen).toHaveLength(2)
    banter.hear([{ type: 'over', winner: 1 }]) // move 5: cooling, but "won" ignores it
    time.run(5000)
    expect(seen.map((e) => e.id).at(-1)).toBe('banter.Bully.won')
  })

  it('never repeats a line until it has said them all', () => {
    const { time, seen, banter } = table({ bots: [{ seat: 1, personality: { id: 'Bully', chattiness: 100 } }] })
    for (let i = 0; i < 6; i++) { banter.hear([{ type: 'hit', by: 1, on: 0 }]); time.run(5000) }
    const said = seen.map((e) => e.id)
    expect(said).toHaveLength(6)
    expect(new Set(said.slice(0, 3)).size).toBe(3)
    expect(new Set(said.slice(3, 6)).size).toBe(3)
  })

  it('a moment with no lines of its own presses a preset emote (content/ai/banter.json presets)', () => {
    const { time, seen, banter } = table()
    banter.hear([{ type: 'over', winner: 1 }])
    time.run(5000)
    expect(seen.map((e) => [e.seat, e.id])).toEqual([['seat-2', 'banter.Bully.won'], ['seat-3', 'wellPlayed']])
  })

  it('a pause (full or half: the rules clock stands still) stops a waiting line; it comes when play goes on', () => {
    const { time, seen, banter } = table({ bots: [{ seat: 1, personality: { id: 'Bully', chattiness: 100 } }] })
    banter.hear([{ type: 'hit', by: 1, on: 0 }])
    time.pause(true)
    time.run(60_000)
    expect(seen).toEqual([])
    time.pause(false)
    time.run(1000)
    expect(seen).toHaveLength(1)
  })

  it('a muted bot says nothing (the emote module drops it before the bubble); unmuted, it talks again', () => {
    const { time, seen, banter, emotes } = table({ bots: [{ seat: 1, personality: { id: 'Bully', chattiness: 100 } }] })
    emotes.mute('seat-2', true)
    for (let i = 0; i < 3; i++) { banter.hear([{ type: 'hit', by: 1, on: 0 }]); time.run(5000) }
    expect(seen).toEqual([])
    emotes.mute('seat-2', false)
    banter.hear([{ type: 'hit', by: 1, on: 0 }]); time.run(5000)
    expect(seen).toHaveLength(1)
  })

  it('at most one line waits per seat (a newer moment replaces it), and the table gap stops a second bot talking over the first', () => {
    const { time, seen, banter } = table({ settings: { ...always, tableGap: 3 } })
    banter.hear([{ type: 'hit', by: 1, on: 2 }])
    banter.hear([{ type: 'over', winner: 1 }]) // replaces both waiting lines
    expect(Object.keys(banter.waiting())).toEqual(['1', '2'])
    time.run(5000)
    expect(seen.map((e) => e.id)).toEqual(['banter.Bully.won']) // the Shy bot's came in the gap: let go
    time.run(5000)
    banter.hear([{ type: 'hit', by: 2, on: 1 }]) // (Shy has no hitRival line; Bully's gotHit has none either)
    banter.hear([{ type: 'hit', by: 1, on: 2 }]); time.run(5000)
    expect(seen.map((e) => e.id).slice(1)).toEqual([expect.stringMatching(/^banter\.Bully\.hitRival/)])
  })

  it('lines are read live: a line edited between two moments is the one said next (no reload)', () => {
    const live = { Bully: { won: 'Too easy.' } }
    const time = rulesClock()
    const seen: EmoteMessage[] = []
    const emotes = createEmotes({ banter: live, mine: ['seat-1'], now: time.clock.now, warn: () => {} })
    emotes.onEmote((e) => seen.push(emotes.text(e.id) as unknown as EmoteMessage))
    const banter = botBanter({ moments, bots: () => [{ seat: 1, personality: { id: 'Bully', chattiness: 100 } }], settings: always, lines: () => live, say: (s, id) => emotes.say(seatId(s), id).ok, seed: 1, clock: time.clock })
    banter.hear([{ type: 'over', winner: 1 }]); time.run(5000)
    live.Bully.won = 'Is that all?' // (the Dev Kit's AI tab edits the same object in place)
    banter.hear([{ type: 'over', winner: 1 }]); time.run(5000)
    expect(seen).toEqual(['Too easy.', 'Is that all?'])
  })

  it('online: the server\'s bots say it through room.emote (any say that returns true) — a client-side say is refused', () => {
    const relayed: string[] = []
    const room = { emote: (seatId: string, id: string) => { relayed.push(`${seatId} ${id}`); return true } }
    const time = rulesClock()
    const banter = botBanter({ moments, bots: () => [{ seat: 1, personality: { id: 'Bully', chattiness: 100 } }], settings: readBanterSettings({ ...always }), lines: () => lines, say: (s, id) => room.emote(seatId(s), id), seed: 1, clock: time.clock })
    banter.hear([{ type: 'over', winner: 1 }]); time.run(5000)
    expect(relayed).toEqual(['seat-2 banter.Bully.won'])
    const online = createEmotes({ banter: lines, mine: ['seat-1'], send: () => true, warn: () => {} })
    expect(online.say('seat-2', 'banter.Bully.won')).toEqual({ ok: false, reason: 'server' })
  })

  it('stop() drops every waiting line', () => {
    const { time, seen, banter } = table()
    banter.hear([{ type: 'hit', by: 1, on: 2 }])
    banter.stop()
    time.run(5000)
    expect([seen, banter.waiting(), time.pending()]).toEqual([[], {}, 0])
  })
})

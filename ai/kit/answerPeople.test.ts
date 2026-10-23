// A PERSON's good move always gets an answer (F22 task 7, Muzzy 2026-10-23: "they should always say something when
// you make good moves (like Sparky in MTG Arena)"). When a moment in content/ai/banter.json "answerPeople" is caused
// by a person's seat (the moment map says { moment, by }), exactly ONE bot replies — the chattiest unmuted one with a
// line, ties by the seed — skipping the chance roll and the cooldown, still respecting mute, pause, the table gap and
// "Bot chatter: Off". A bot's own big move is the ordinary chance.
import { describe, expect, it } from 'vitest'
import { createEmotes, type EmoteMessage } from '../../emotes/kit/emotes'
import { DEFAULT_BANTER_SETTINGS, momentsFor, momentsWithCause, readBanterSettings, type BanterSettings, type MomentMap } from './banter'
import { botBanter, type BanterSeat } from './brain'
import type { PaceClock } from './pace'

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
  return { clock, run, pause: (on: boolean) => { paused = on } }
}

// Seat 0 is the person; seats 1–3 are bots. A big word: "bigMove" for the one who played it, "rivalBigMove" (+ who) for the rest.
type Ev = { type: 'word'; seat: number; points: number } | { type: 'hit'; by: number; on: number }
const moments: MomentMap<Ev> = (e, seat) => {
  if (e.type === 'word') return e.points < 20 ? null : e.seat === seat ? 'bigMove' : { moment: 'rivalBigMove', by: e.seat }
  return e.by === seat ? 'hitRival' : e.on === seat ? 'gotHit' : null
}
const lines = {
  Chatty: { rivalBigMove: 'Nice one!', rivalBigMove_2: 'Ooh, clever.', rivalBigMove_3: 'Show-off.', hitRival: 'Gotcha!' },
  Calm: { rivalBigMove: 'Well done.', bigMove: 'Not bad, me.' },
  Quiet: { rivalBigMove: 'Hm.' },
}
const cast: BanterSeat[] = [
  { seat: 1, personality: { id: 'Calm', chattiness: 30 } },
  { seat: 2, personality: { id: 'Chatty', chattiness: 80 } },
  { seat: 3, personality: { id: 'Quiet', chattiness: 10 } },
]
// rivalBigMove at chance 0: only the always-answer can make a bot speak at it
const file: BanterSettings = { ...DEFAULT_BANTER_SETTINGS, chance: { rivalBigMove: 0, bigMove: 0.5, hitRival: 1 }, cooldownTurns: 5, presets: {}, delay: { min: 1, max: 1 }, tableGap: 3 }
const seatId = (seat: number) => `seat-${seat + 1}`
const bigWord = (seat = 0): Ev[] => [{ type: 'word', seat, points: 30 }]

function table(options: { settings?: BanterSettings; bots?: BanterSeat[]; useMuted?: boolean; seed?: number } = {}) {
  const time = rulesClock()
  const seen: EmoteMessage[] = []
  const emotes = createEmotes({ banter: lines, mine: ['seat-1'], now: time.clock.now, warn: () => {} })
  emotes.onEmote((e) => seen.push(e))
  const bots = options.bots ?? cast
  const banter = botBanter({
    moments, bots: () => bots, settings: options.settings ?? file, lines: () => lines, seed: options.seed ?? 5, clock: time.clock,
    say: (seat, id) => emotes.say(seatId(seat), id).ok,
    muted: options.useMuted === false ? undefined : (seat) => emotes.isMuted(seatId(seat)),
  })
  return { time, seen, emotes, banter }
}

describe('a person\'s good move always gets an answer', () => {
  it('a person\'s big word → exactly one line, from the chattiest bot, every time (no chance roll, no cooldown)', () => {
    const { time, seen, banter } = table()
    for (let i = 0; i < 6; i++) {
      banter.hear(bigWord(0))
      time.run(5000)
      expect(seen).toHaveLength(i + 1) // one each time — even though rivalBigMove's chance is 0 and the cooldown is 5
    }
    expect(new Set(seen.map((e) => e.seat))).toEqual(new Set(['seat-3'])) // Chatty (80)
    expect(new Set(seen.slice(0, 3).map((e) => e.id)).size).toBe(3) // no repeats until it has said them all
  })

  it('a bot\'s big word is the ordinary chance: no one is made to answer it', () => {
    const { time, seen, banter } = table()
    for (let i = 0; i < 20; i++) { banter.hear(bigWord(1)); time.run(5000) } // seat 1 = Calm, a bot
    expect(seen.filter((e) => /rivalBigMove/.test(e.id))).toEqual([]) // chance 0 for the others
    expect(seen.every((e) => e.id.startsWith('banter.Calm.bigMove'))).toBe(true) // only Calm's own bigMove, by chance
    expect(seen.length).toBeLessThan(20)
  })

  it('"Bot chatter: Off" silences the answer too', () => {
    const { time, seen, banter } = table()
    banter.setChatter('off')
    for (let i = 0; i < 5; i++) { banter.hear(bigWord(0)); time.run(5000) }
    expect(seen).toEqual([])
  })

  it('the chattiest bot muted → the next unmuted one answers (the game passes muted)', () => {
    const { time, seen, banter, emotes } = table()
    emotes.mute('seat-3', true) // Chatty
    banter.hear(bigWord(0)); time.run(5000)
    expect(seen.map((e) => [e.seat, e.id])).toEqual([['seat-2', 'banter.Calm.rivalBigMove']]) // Calm (30)
    emotes.mute('seat-2', true); emotes.mute('seat-4', true) // everyone muted → no one
    banter.hear(bigWord(0)); time.run(5000)
    expect(seen).toHaveLength(1)
  })

  it('without a muted check, the answer may go to a muted bot and the emote module drops it (documented)', () => {
    const { time, seen, banter, emotes } = table({ useMuted: false })
    emotes.mute('seat-3', true)
    banter.hear(bigWord(0)); time.run(5000)
    expect(seen).toEqual([])
  })

  it('a pause holds the answer; it comes when play goes on', () => {
    const { time, seen, banter } = table()
    banter.hear(bigWord(0))
    time.pause(true); time.run(60_000)
    expect(seen).toEqual([])
    time.pause(false); time.run(1000)
    expect(seen).toHaveLength(1)
  })

  it('the table gap still counts: just after another bot spoke, the answer waits for the gap — and still comes', () => {
    const { time, seen, banter } = table()
    banter.hear([{ type: 'hit', by: 2, on: 0 }]) // Chatty says "Gotcha!" at 1000
    time.run(1000)
    banter.hear(bigWord(0)) // the person answers back with a big word right away
    time.run(20_000)
    expect(seen.map((e) => [e.seat, e.at])).toEqual([['seat-3', 1000], ['seat-3', 4000]]) // 1000 + the 3 s gap (past the usual "stale" limit too)
  })

  it('equally chatty bots: the seed picks who answers (same seed → same bot); others stay quiet', () => {
    const twins: BanterSeat[] = [{ seat: 1, personality: { id: 'Calm', chattiness: 50 } }, { seat: 2, personality: { id: 'Quiet', chattiness: 50 } }]
    const who = (seed: number) => {
      const { time, seen, banter } = table({ bots: twins, seed })
      banter.hear(bigWord(0)); time.run(10_000)
      expect(seen).toHaveLength(1)
      return seen[0].seat
    }
    expect(who(1)).toBe(who(1))
    expect(new Set([1, 2, 3, 4, 5, 6, 7, 8].map(who)).size).toBe(2) // both get a turn across seeds
  })

  it('a moment without a cause (a plain name) never counts as a person\'s; old plugs keep working', () => {
    const plain: MomentMap<Ev> = (e, seat) => (e.type === 'word' && e.seat !== seat ? 'rivalBigMove' : null)
    expect(momentsFor(plain, bigWord(0), 1)).toEqual(['rivalBigMove'])
    expect(momentsWithCause(plain, bigWord(0), 1)).toEqual([{ moment: 'rivalBigMove' }])
    expect(momentsWithCause(moments, bigWord(0), 1)).toEqual([{ moment: 'rivalBigMove', by: 0 }])
    expect(momentsFor(moments, bigWord(0), 1)).toEqual(['rivalBigMove'])
    const time = rulesClock()
    const said: string[] = []
    const banter = botBanter({ moments: plain, bots: () => cast, settings: file, lines: () => lines, say: (_s, id) => { said.push(id); return true }, seed: 1, clock: time.clock })
    for (let i = 0; i < 5; i++) { banter.hear(bigWord(0)); time.run(5000) }
    expect(said).toEqual([]) // chance 0, no cause → no always-answer
  })

  it('content/ai/banter.json "answerPeople": default ["rivalBigMove"]; [] turns it off', () => {
    expect(readBanterSettings({}).answerPeople).toEqual(['rivalBigMove'])
    const { time, seen, banter } = table({ settings: { ...file, answerPeople: [] } })
    for (let i = 0; i < 5; i++) { banter.hear(bigWord(0)); time.run(5000) }
    expect(seen).toEqual([])
  })
})

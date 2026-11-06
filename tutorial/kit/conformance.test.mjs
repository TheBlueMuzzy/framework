// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { check, lessonProblems, runnerClocks } from './conformance.mjs'

function tester({ lessons = [], code = [], gameClock = true }) {
  const results = []
  const t = {
    files: (opts) => (opts?.dirs?.includes('content/lessons') ? lessons : []),
    gameCode: () => code,
    exists: (p) => (p === 'src/devkit/gameClock.ts' ? gameClock : false),
    pass: (name, detail) => results.push({ name, ok: true, detail }),
    fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
    skip: (name, why) => results.push({ name, skipped: true, why }),
  }
  return { t, results }
}

const good = { path: 'content/lessons/first.json', text: JSON.stringify({ id: 'first', steps: [
  { id: 'a', message: 'hi', while: 'pause', button: 'next' },
  { id: 'fall', pattern: 'positionGated', advance: { atLeast: 10 } }, // (half an advance: the pattern fills in the rest)
  { id: 'b', advance: { on: 'any', of: [{ on: 'event', event: 'lock' }, { on: 'time', after: 3 }] }, hint: { after: 5, message: 'h', unless: { on: 'action', action: 'drop' } } },
], interrupts: [{ id: 'x', when: { on: 'gate', gate: 'away', atLeast: 1 }, message: 'x', from: 'b' }] }) }

describe('lesson files', () => {
  it('a lesson the runner can play has no problems', () => {
    expect(lessonProblems(good.path, good.text)).toEqual([])
  })

  it('names each problem where it is: the id, a doubled step id, a bad while, an unknown condition, a missing interrupt step', () => {
    const text = JSON.stringify({ id: 'other', steps: [
      { id: 'a', while: 'paused' },
      { id: 'a', advance: { on: 'evnt', event: 'lock' } },
      { id: 'c', advance: { on: 'any', of: [{ on: 'gate' }] }, retry: { when: { on: 'event' } } },
    ], interrupts: [{ id: 'i', when: { on: 'dismiss' }, to: 'zz' }] })
    const problems = lessonProblems('content/lessons/first.json', text)
    expect(problems).toEqual([
      'content/lessons/first.json: "id" is "other" — it must be the file\'s name, "first"',
      'content/lessons/first.json step 1 (a): "while": "paused" isn\'t one of pause, slow, run',
      'content/lessons/first.json step 2 (a): the id "a" is used twice',
      'content/lessons/first.json step 2 (a) advance: "on": "evnt" isn\'t one of dismiss, event, action, gate, time, any',
      'content/lessons/first.json step 3 (c) advance.of[0]: a "gate" condition names no "gate"',
      'content/lessons/first.json step 3 (c) retry.when: an "event" condition names no "event"',
      'content/lessons/first.json interrupt i: "to": "zz" isn\'t a step id in this lesson',
    ])
    expect(lessonProblems('content/lessons/x.json', '{ nope')[0]).toContain('not valid JSON')
    expect(lessonProblems('content/lessons/x.json', '{"id":"x"}')).toEqual(['content/lessons/x.json: no "steps" list'])
  })
})

describe('the runner\'s clock', () => {
  it('reads the clock each createLessonRunner call is given; a comment isn\'t a call', () => {
    const files = [{ path: 'src/lessons.ts', text: "// createLessonRunner({ clock: wallClock })\nexport const runner = createLessonRunner({\n  clock: rulesClock, // the rules clock\n  timing: () => t,\n})\n" }]
    expect(runnerClocks(files)).toEqual([{ where: 'src/lessons.ts:2', clock: 'rulesClock' }])
  })
})

describe('check', () => {
  it('passes a game with good lessons on the rules clock', async () => {
    const { t, results } = tester({ lessons: [good], code: [{ path: 'src/l.ts', text: 'createLessonRunner({ clock: rulesClock, game, timing })' }] })
    await check(t)
    expect(results.map((r) => r.ok)).toEqual([true, true])
  })

  it('fails a broken lesson and a runner on another clock, with the fix', async () => {
    const { t, results } = tester({ lessons: [{ path: 'content/lessons/a.json', text: '{"id":"b","steps":[{"id":"s"}]}' }], code: [{ path: 'src/l.ts', text: 'createLessonRunner({ clock: myTimers, game })' }] })
    await check(t)
    expect(results[0]).toMatchObject({ ok: false })
    expect(results[1]).toMatchObject({ ok: false, problems: ['src/l.ts:1 — createLessonRunner\'s clock is myTimers, not rulesClock'] })
    expect(results[1].fix).toContain('rulesClock')
  })

  it('skips what isn\'t there yet: no lessons, no runner, no Dev Kit', async () => {
    const none = tester({})
    await check(none.t)
    expect(none.results.map((r) => r.skipped)).toEqual([true, true])
    const noDevkit = tester({ code: [{ path: 'src/l.ts', text: 'createLessonRunner({ clock: c })' }], gameClock: false })
    await check(noDevkit.t)
    expect(noDevkit.results[1].skipped).toBe(true)
  })
})

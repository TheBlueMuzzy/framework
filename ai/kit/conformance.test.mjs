// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { check } from './conformance.mjs'

// a tiny stand-in for check-framework's tester: content/ai files + game code
function tester({ content = [], code = [] }) {
  const results = []
  const linesMatching = (files, re) => files.flatMap((f) => f.text.split('\n').map((l, i) => (re.test(l) ? `${f.path}:${i + 1}  ${l.trim()}` : null)).filter(Boolean))
  const t = {
    rel: 'src/ai/kit',
    files: () => content.map((path) => ({ path, text: '{}' })),
    gameCode: () => code, linesMatching,
    pass: (name, detail) => results.push({ name, ok: true, detail }),
    fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
  }
  return { t, results }
}

describe('AI checks', () => {
  it('a game that hands bots the rules clock passes — a setTimeout elsewhere in a file that imports pace is not blamed', async () => {
    const { t, results } = tester({
      content: ['content/ai/personalities.json'],
      code: [
        { path: 'src/main.tsx', text: "import { setPaceClock } from './ai/kit/pace'\nsetPaceClock(rulesClock)" },
        { path: 'src/ui/Toast.tsx', text: "import type { Pace } from '../ai/kit/pace'\nsetTimeout(() => hide(), 2000)" },
        { path: 'src/store/localBot.ts', text: "import { thinkDelay, botWait } from '../ai/kit'\nconst d = thinkDelay(p, k, s, r)\nbotWait(d.ms, act)" },
      ],
    })
    await check(t)
    expect(results.map((r) => [r.ok, r.detail])).toEqual([[true, 'personalities.json'], [true, 'src/main.tsx:2  setPaceClock(rulesClock)']])
  })
  it('no clock handed over + no personalities: fails, and hints at bot code on plain timers (imported through the kit index too)', async () => {
    const { t, results } = tester({ code: [{ path: 'src/store/localBot.ts', text: "import { thinkDelay } from '../ai/kit'\nconst d = thinkDelay(p, k, s, r)\ntimer = setTimeout(() => act(), d.ms)" }] })
    await check(t)
    expect(results.map((r) => r.ok)).toEqual([false, false])
    expect(results[1].problems).toContain('  src/store/localBot.ts:3  timer = setTimeout(() => act(), d.ms)')
    expect(results[1].fix).toContain('setPaceClock(rulesClock)')
  })
})
